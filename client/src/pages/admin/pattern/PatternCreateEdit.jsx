import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { Settings, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatternInfoForm from '@/components/admin/pattern/PatternInfoForm';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';

// Hooks
import { useLevel } from '../../../services/hooks/useLevel';
import { usePattern, useCreatePattern, useUpdatePattern, usePatternTypes } from '../../../services/hooks/usePattern';
import { useBlocklyWorkspace } from '@/components/admin/level/hooks/useBlocklyWorkspace';
import { useBlocklyCleanup } from '@/components/admin/level/hooks/useBlocklyCleanup';
import { useSuppressBlocklyWarnings } from '@/components/admin/level/hooks/useSuppressBlocklyWarnings';

// Utils
import { removeVariableIdsFromXml, addMutationToProcedureDefinitions } from './utils/patternBlocklyUtils';
import { delay } from '@/components/admin/level/utils/asyncUtils';

const PatternCreateEdit = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!patternId;

  useSuppressBlocklyWarnings();

  // --- 1. Data Layer (TanStack Query) ---
  const { 
    data: levelData, 
    isLoading: isLevelLoading, 
    error: levelError 
  } = useLevel(levelId);

  const { 
    data: patternData, 
    isLoading: isPatternLoading, 
    error: patternError 
  } = usePattern(patternId);

  const { data: patternTypes = [] } = usePatternTypes();

  const createMutation = useCreatePattern();
  const updateMutation = useUpdatePattern();

  // --- 2. Local State for Form ---
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');
  const [weaponId, setWeaponId] = useState('');
  const [bigO, setBigO] = useState('');
  
  // Steps State
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const stepsRef = useRef([]); // Keep track of latest step data without re-renders
  const lastLoadedXmlRef = useRef(null); // Prevent redundant XML loads

  // Initialize Form Data when Pattern Loads
  useEffect(() => {
    if (patternData) {
      setPatternName(patternData.pattern_name || '');
      setPatternDescription(patternData.description || '');
      setWeaponId(patternData.weapon_id ? patternData.weapon_id.toString() : '');
      setBigO(patternData.bigO || '');

      // Parse Steps/Hints
      let hintsArray = patternData.hints;
      if (typeof patternData.hints === 'string') {
          try { hintsArray = JSON.parse(patternData.hints); } catch (e) { hintsArray = []; }
      }

      if (Array.isArray(hintsArray) && hintsArray.length > 0) {
        const loadedSteps = hintsArray.slice(0, 3).map((hint, index) => ({
            step: index,
            xml: (hint.xmlCheck && hint.xmlCheck.trim()) 
                 ? hint.xmlCheck 
                 : (patternData.starter_xml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>')
        }));
        setSteps(loadedSteps);
        stepsRef.current = loadedSteps;
      } else {
        setSteps([]);
        stepsRef.current = [];
      }
    }
  }, [patternData]);

  // Sync steps state to ref
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);


  // --- 2.6 View/Edit Mode Toggle ---
  const [isViewMode, setIsViewMode] = useState(false);

  // --- 2.5 Calculate Enabled Blocks ---
  const enabledBlocks = useMemo(() => {
    if (!levelData) return {};
    
    const enabledBlocksObj = {};
    
    // Logic from StarterCreateEdit: Map level_blocks array to object
    if (Array.isArray(levelData.level_blocks)) {
        levelData.level_blocks.forEach((blockInfo) => {
            if (blockInfo?.block?.block_key) {
                enabledBlocksObj[blockInfo.block.block_key] = true;
            }
        });
    }
    
    // Fallback or explicit enabled_blocks check (legacy support)
    if (Object.keys(enabledBlocksObj).length === 0) {
            if (typeof levelData.enabled_blocks === 'object') {
            Object.assign(enabledBlocksObj, levelData.enabled_blocks || {});
            } else if (typeof levelData.enabled_blocks === 'string') {
            try {
                Object.assign(enabledBlocksObj, JSON.parse(levelData.enabled_blocks) || {});
            } catch (e) {
                // console.error("Failed to parse enabled_blocks", e);
            }
            }
    }

    // Final fallback if still empty (ensure at least basic blocks exist)
    if (Object.keys(enabledBlocksObj).length === 0) {
        // console.warn("[PatternCreateEdit] No blocks found, using defaults");
        enabledBlocksObj.move_forward = true;
        enabledBlocksObj.turn_left = true;
        enabledBlocksObj.turn_right = true;
    }

    return enabledBlocksObj;
  }, [levelData]);

  // --- 3. Blockly Workspace ---
  const blocklyRef = useRef(null);
  const [blocklyRefReady, setBlocklyRefReady] = useState(false);

  // Callback ref to trigger re-render when DOM element is mounted
  const blocklyRefCallback = useCallback((node) => {
    blocklyRef.current = node;
    if (node) {
      setBlocklyRefReady(true);
    }
  }, []);

  const { 
    workspaceRef, 
    blocklyLoaded, 
    blocklyInitError 
  } = useBlocklyWorkspace({
    blocklyRef,
    levelData,
    enabledBlocks: enabledBlocks,
    isRestricted: false,
    refReady: blocklyRefReady, // Trigger re-run when ref is mounted
    readOnly: isViewMode
  });

  const { cleanupDuplicateProcedures } = useBlocklyCleanup({ workspaceRef });

  // --- 4. XML Loading Logic (Fixed: Linear Async) ---
  const [xmlLoading, setXmlLoading] = useState(false);

  const loadStepXml = useCallback(async (index, isForward = true) => {
    if (!workspaceRef.current || !levelData) return;
    if (lastLoadedXmlRef.current === index) return; // Already loaded
    
    console.log(`[loadStepXml] Loading Step ${index}`);
    console.log(`[loadStepXml] Current Steps Refs:`, stepsRef.current);

    // Prevent re-loading same step unnecessarily (unless first load)
    const targetStep = stepsRef.current[index];
    let xmlToLoad = null;

    // CRITICAL: In View Mode, ALWAYS load from DB (never inherit)
    // In Edit Mode: Only inherit from previous step when moving FORWARD
    // When moving backward, load the saved XML for that step
    if (!isViewMode && isForward && index > 0) {
        const prevStep = stepsRef.current[index - 1];
        console.log(`[loadStepXml] Moving FORWARD (Edit Mode) - Inheriting from Step ${index - 1}:`, prevStep);
        if (prevStep && prevStep.xml) {
            xmlToLoad = prevStep.xml;
        }
    }
    
    // If in View Mode, moving backward, OR no previous step XML, use current step's saved XML
    if (!xmlToLoad && targetStep && targetStep.xml) {
        console.log(`[loadStepXml] Using saved XML for Step ${index}`);
        xmlToLoad = targetStep.xml;
    }

    // Fallback to starter XML if still empty
    if (!xmlToLoad) {
        console.log(`[loadStepXml] Fallback to starter_xml`);
        xmlToLoad = levelData.starter_xml;
    }
    
    // Safety check: Don't reload if content is identical (optional optimization)
    // But for safety against "stuck" bugs, we force load but manage the spinner carefully.

    setXmlLoading(true);

    try {
        await delay(50); // Give UI time to show spinner

        // 1. Clear Workspace
        workspaceRef.current.clear();
        
        // 2. Load XML
        let finalXml = xmlToLoad;
        if (!finalXml || !finalXml.trim()) {
            finalXml = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }

        // Clean XML
        try {
            finalXml = removeVariableIdsFromXml(finalXml);
            finalXml = addMutationToProcedureDefinitions(finalXml); // Fix missing mutation tags
        } catch (e) {
            console.warn("XML Cleanup failed, using original", e);
        }

        const xmlDom = Blockly.utils.xml.textToDom(finalXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        
        // 3. Post-Load Cleanup
        // Fix procedure names (duplicates/zombies)
        // Skip cleanup in View Mode (read-only, shouldn't modify workspace)
        if (!isViewMode) {
            await delay(50); 
            if (cleanupDuplicateProcedures) {
                cleanupDuplicateProcedures(true); // Force cleanup
            }
        }

    } catch (err) {
        console.error("Error loading XML for step", index, err);
    } finally {
        setXmlLoading(false); 
        lastLoadedXmlRef.current = index;
    }
  }, [levelData, cleanupDuplicateProcedures, isViewMode]);

  // Trigger XML Load on initial mount only
  useEffect(() => {
    if (blocklyLoaded && workspaceRef.current && lastLoadedXmlRef.current === null) {
        loadStepXml(currentStepIndex, true);
    }
  }, [blocklyLoaded, loadStepXml]);
  // Note: We don't include currentStepIndex here because navigation is handled explicitly in handleNextStep/handlePreviousStep


  // --- 5. Event Handlers ---

  const saveCurrentWorkspaceToRef = useCallback(() => {
    if (!workspaceRef.current) return;
    try {
        const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
        let xmlText = Blockly.Xml.domToText(xmlDom);
        
        // Fix: Ensure XML is normalized (has NAME fields) before saving to state/DB
        // This prevents "bad data" from entering the database
        xmlText = addMutationToProcedureDefinitions(xmlText);
        
        const currentRef = [...stepsRef.current];
        
        // If step exists, update it
        if (currentRef[currentStepIndex]) {
            currentRef[currentStepIndex] = { ...currentRef[currentStepIndex], xml: xmlText, xmlCheck: xmlText };
        } else {
            // New step
            currentRef[currentStepIndex] = { step: currentStepIndex, xml: xmlText, xmlCheck: xmlText };
        }
        
        stepsRef.current = currentRef;
        setSteps(currentRef); // Sync state for UI
        return true;
    } catch (e) {
        console.error("Failed to save workspace", e);
        return false;
    }
  }, [currentStepIndex]);


  const handleNextStep = async () => {
    if (currentStepIndex >= 2) return alert('สูงสุด 3 ขั้นตอน');
    
    // Skip warning in View Mode
    if (!isViewMode) {
      const confirmed = window.confirm(
        '⚠️ คำเตือน: กรุณาตรวจสอบ Block ให้ดีก่อนกด Next\n\n' +
        'เพราะถ้าต้องกลับมาแก้ไข Step นี้ในภายหลัง\n' +
        'Block ของ Step ถัดไปจะต้องเรียงใหม่ทั้งหมด\n\n' +
        'ต้องการดำเนินการต่อหรือไม่?'
      );
      
      if (!confirmed) return;
      saveCurrentWorkspaceToRef();
    }
    
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    await loadStepXml(nextIndex, true);
  };

  const handlePreviousStep = async () => {
    if (currentStepIndex <= 0) return;
    
    // Skip warning in View Mode
    if (!isViewMode) {
      const confirmed = window.confirm(
        '⚠️ คำเตือน: การย้อนกลับจะทำให้ต้องเรียง Block ใหม่\n\n' +
        'Block ของ Step ปัจจุบัน (Step ' + (currentStepIndex + 1) + ') จะต้องเรียงใหม่\n' +
        'เมื่อคุณกลับมาจาก Step ' + currentStepIndex + '\n\n' +
        '💡 แนะนำ: ใช้ปุ่ม "� Export XML" เพื่อสำรอง Block ก่อนย้อนกลับ\n' +
        'ต้องการย้อนกลับหรือไม่?'
      );
      
      if (!confirmed) return;
      saveCurrentWorkspaceToRef();
    }
    
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    await loadStepXml(prevIndex, false);
  };

  const handleCopyToBuffer = () => {
    if (!workspaceRef.current) return;
    
    try {
      const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xmlDom);
      
      // Create download link
      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buffer_step${currentStepIndex + 1}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ Export สำเร็จ!\n\nไฟล์ XML ถูก Download แล้ว\nใช้ปุ่ม "📥 Import from File" เพื่อนำกลับมา');
      console.log(`[Export XML] Downloaded for Step ${currentStepIndex}`);
    } catch (e) {
      console.error('[Export XML] Failed:', e);
      alert('❌ เกิดข้อผิดพลาดในการ Export');
    }
  };

  const handleImportFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const xmlText = await file.text();
        
        const confirmed = window.confirm(
          '📥 Import XML?\n\n' +
          'Block จากไฟล์จะถูกเพิ่มเข้าไปใน Workspace\n' +
          '(ไม่ทับ Block เดิม)\n\n' +
          'ต้องการดำเนินการต่อหรือไม่?'
        );
        
        if (!confirmed) return;
        
        setXmlLoading(true);
        await delay(50);
        
        // Don't clear - just append blocks from XML
        const xmlDom = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        
        // alert('✅ Import สำเร็จ!\n\nBlock ถูกเพิ่มเข้าไปใน Workspace แล้ว');
      } catch (e) {
        console.error('[Import XML] Error:', e);
        alert('❌ เกิดข้อผิดพลาดในการ Import\n\nกรุณาตรวจสอบไฟล์ XML');
      } finally {
        setXmlLoading(false);
      }
    };
    
    input.click();
  };

  const handleSave = async () => {
    if (!patternName.trim()) return alert('กรุณากรอกชื่อ');
    saveCurrentWorkspaceToRef(); // Save current work before submitting

    console.log("[handleSave] stepsRef.current:", stepsRef.current);

    const finalSteps = stepsRef.current.slice(0, 3);
    if (finalSteps.length === 0) return alert('ต้องมีอย่างน้อย 1 Step');
 
    // Logic from original: Use last step as "Master XML" fallback
    const lastStep = finalSteps[finalSteps.length - 1];
    const finalPatternXml = lastStep.xml || '';
    
    // Determine Pattern Type ID
    // 1. Try to find type matching "fixed_steps"
    // 2. Fallback to first available type
    // 3. Fallback to ID 1
    let targetTypeId = 1;
    if (patternTypes && patternTypes.length > 0) {
        const fixedType = patternTypes.find(t => t.type_name === 'fixed_steps' || t.type_name === 'step_based');
        if (fixedType) {
            targetTypeId = fixedType.pattern_type_id;
        } else {
            targetTypeId = patternTypes[0].pattern_type_id;
        }
    }

    const payload = {
        level_id: parseInt(levelId),
        pattern_name: patternName,
        description: patternDescription,
        weapon_id: weaponId ? parseInt(weaponId) : null,
        bigO: bigO,
        pattern_type_id: parseInt(targetTypeId), 
        pattern_type: "fixed_steps", 
        
        // Send XML with multiple keys to ensure backend compatibility
        pattern_xml: finalPatternXml,
        xml_pattern: finalPatternXml,
        xmlpattern: finalPatternXml,

        hints: finalSteps.map(s => ({ 
            step: s.step, 
            trigger: "onXmlMatch",
            xmlCheck: s.xml 
        }))
    };

    try {
        if (isEditMode) {
            await updateMutation.mutateAsync({ patternId, patternData: payload });
        } else {
            await createMutation.mutateAsync({ levelId, patternData: payload });
        }
        navigate(`/admin/levels/${levelId}/patterns`);
    } catch (err) {
        console.error("Save failed", err);
        alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };


  // --- 6. Render ---

  const isLoading = isLevelLoading || isPatternLoading;
  const errorObj = levelError || patternError || blocklyInitError;

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader size="lg" text="กำลังโหลดข้อมูล..." /></div>;
  if (errorObj) return <div className="p-8 text-center text-red-500">เกิดข้อผิดพลาด: {errorObj.message || errorObj}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex-none p-4 bg-white shadow-sm z-10">
        <AdminPageHeader
          title={isEditMode ? `แก้ไขรูปแบบ: ${patternName}` : "สร้างรูปแบบคำตอบใหม่"}
          backPath={`/admin/levels/${levelId}/patterns`}
          rightContent={
            <div className="flex gap-2">
              <Button 
                variant={isViewMode ? "default" : "outline"}
                onClick={() => setIsViewMode(!isViewMode)}
              >
                {isViewMode ? '✏️ Edit Mode' : '👁️ View Mode'}
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending || isViewMode}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader size="sm" className="mr-2" />}
                บันทึก
              </Button>
            </div>
          }
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Settings */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-4 custom-scrollbar">
            <PatternInfoForm
                patternName={patternName} setPatternName={setPatternName}
                patternDescription={patternDescription} setPatternDescription={setPatternDescription}
                weaponId={weaponId} setWeaponId={setWeaponId}
                bigO={bigO} setBigO={setBigO}
                patternTypes={patternTypes}
                disabled={isViewMode}
            />
        </div>

        {/* Right: Workspace */}
        <div className="w-2/3 flex flex-col relative bg-gray-100">
           {/* Step Navigation */}
           <div className="bg-white p-2 border-b flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">Step {currentStepIndex + 1} / 3</span>
                </div>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyToBuffer}>
                        💾 Export XML
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleImportFromFile}>
                        📥 Import XML
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePreviousStep} disabled={currentStepIndex === 0}>
                        ← Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNextStep} disabled={currentStepIndex >= 2}>
                        Next Step →
                    </Button>
                </div>
           </div>

           {/* Blockly Container */}
           <div className="flex-1 relative">
             {(xmlLoading || !blocklyLoaded) && (
                 <div className="absolute inset-0 z-20 bg-white/90 flex flex-col items-center justify-center">
                     <Loader size="lg" className="mb-4" />
                     <p className="text-gray-600 font-medium">
                        {xmlLoading ? "กำลังเตรียม Block..." : "กำลังโหลด Workspace..."}
                     </p>
                     {!blocklyLoaded && Object.keys(enabledBlocks).length === 0 && (
                        <p className="text-red-500 text-sm mt-2">
                            รอข้อมูล Block... (ถ้าค้างนานให้ Refresh)
                        </p>
                     )}
                 </div>
             )}
              <div ref={blocklyRefCallback} className="absolute inset-0" />
           </div>
         </div>
      </div>
    </div>
  );
};

export default PatternCreateEdit;