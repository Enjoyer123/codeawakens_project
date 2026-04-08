import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/javascript';

import { setXmlLoading } from "@/gameutils/blockly/core/state";
import { analyzeWorkspace } from '@/gameutils/shared/hint/hintMatcher';

import { useSuppressBlocklyWarnings } from '../../../components/admin/level/hooks/useSuppressBlocklyWarnings';
import { useBlocklyWorkspace } from '../../../components/admin/level/hooks/useBlocklyWorkspace';
import { useEnabledBlocks } from '@/gameutils/blockly/hooks/useEnabledBlocks';
import { useLevel, useUpdateLevel } from '../../../services/hooks/useLevel';
import { Button } from '@/components/ui/button';
import PageLoader from '@/components/shared/Loading/PageLoader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';
import PageError from '@/components/shared/Error/PageError';
import AlertDialog from '@/components/shared/dialog/AlertDialog';
import { useAlertDialog } from '@/components/shared/dialog/useAlertDialog';

const StarterCreateEdit = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();

  // Refs สำหรับ 2 workspaces
  const blocklyRef = useRef(null);       // Main blocks
  const blocklyRef2 = useRef(null);      // Floating blocks
  const isFirstXmlLoad = useRef(true);

  // TanStack Query Hooks
  const {
    data: levelData,
    isLoading: loading,
    error,
    isError
  } = useLevel(levelId);

  const { alertDialog, showAlert } = useAlertDialog();
  const updateLevelMutation = useUpdateLevel();
  const enabledBlocks = useEnabledBlocks(levelData);

  // Main Workspace
  const {
    workspaceRef,
    blocklyLoaded,
    error: blocklyInitError
  } = useBlocklyWorkspace({
    blocklyRef,
    enabledBlocks
  });

  // Floating Workspace
  const [selectedPatternId, setSelectedPatternId] = useState('');

  const {
    workspaceRef: workspaceRef2,
    blocklyLoaded: blocklyLoaded2,
    error: blocklyInitError2
  } = useBlocklyWorkspace({
    blocklyRef: blocklyRef2,
    enabledBlocks
  });

  useSuppressBlocklyWarnings();
  const isSaving = updateLevelMutation.isPending;

  // โหลด XML เมื่อ workspace พร้อม
  useEffect(() => {
    if (!workspaceRef.current || !blocklyLoaded || !levelData || loading) return;
    if (!isFirstXmlLoad.current) return;

    const loadInitialXml = async () => {
      try {
        // --- Main Workspace ---
        const starter_xml = levelData?.starter_xml;
        const hasStarterXml = starter_xml && typeof starter_xml === 'string' && starter_xml.trim() && starter_xml.includes('<block');

        if (hasStarterXml) {
          await new Promise(r => setTimeout(r, 100));
          workspaceRef.current.clear();
          const xmlDom = Blockly.utils.xml.textToDom(starter_xml);
          setXmlLoading(true);
          Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
          setXmlLoading(false);
        }

        // --- Floating Workspace ---
        const floating_xml = levelData?.floating_xml;
        const hasFloatingXml = floating_xml && typeof floating_xml === 'string' && floating_xml.trim() && floating_xml.includes('<block');

        if (hasFloatingXml && workspaceRef2.current) {
          workspaceRef2.current.clear();
          const xmlDom2 = Blockly.utils.xml.textToDom(floating_xml);
          setXmlLoading(true);
          
          Blockly.Events.disable();
          try {
            Blockly.Xml.domToWorkspace(xmlDom2, workspaceRef2.current);
            
            // Cleanup auto-spawned procedure definitions during load
            // since this is floating workspace, definitions shouldn't be here unless in xml
            const allBlocks = workspaceRef2.current.getAllBlocks(false);
            const originalBlocks = Blockly.utils.xml.textToDom(floating_xml).getElementsByTagName('block');
            const originalIds = new Set(Array.from(originalBlocks).map(b => b.getAttribute('id')));

            for (const b of allBlocks) {
              if (b.type.startsWith('procedures_def') && !originalIds.has(b.id)) {
                b.dispose(false);
              }
            }
          } finally {
            Blockly.Events.enable();
            setXmlLoading(false);
          }
        }
      } catch (err) {
        console.error("XML Load failed:", err);
        setXmlLoading(false);
      } finally {
        isFirstXmlLoad.current = false;
      }
    };

    loadInitialXml();
  }, [blocklyLoaded, blocklyLoaded2, levelData, loading]);

  // ─── Auto-Fill Floating Blocks ──────────────────────────────
  const handleAutoFillFloating = (patternXml) => {
    if (!workspaceRef.current || !workspaceRef2.current || !patternXml) {
      showAlert('ข้อผิดพลาด', 'ไม่มี Pattern XML หรือ Workspace ไม่พร้อม');
      return;
    }

    try {
      // 1. วิเคราะห์ Main Workspace (starter blocks ปัจจุบัน)
      const mainAnalysis = analyzeWorkspace(workspaceRef.current);

      // 2. วิเคราะห์ Pattern XML ด้วย headless workspace
      const tempWs = new Blockly.Workspace();
      const patternDom = Blockly.utils.xml.textToDom(patternXml);
      Blockly.Xml.domToWorkspace(patternDom, tempWs);
      const targetAnalysis = analyzeWorkspace(tempWs);

      // 3. Two-Pass diff หา missing blocks
      const targetMatched = new Array(targetAnalysis.length).fill(-1);
      const mainUsed = new Array(mainAnalysis.length).fill(false);

      // Pass 1: Strict (type + varName + ancestorStr)
      let mi = 0;
      for (let ti = 0; ti < targetAnalysis.length; ti++) {
        const t = targetAnalysis[ti];
        for (let j = mi; j < mainAnalysis.length; j++) {
          if (!mainUsed[j] && mainAnalysis[j].type === t.type &&
            (t.varName === undefined || mainAnalysis[j].varName === t.varName) &&
            (!t.ancestorStr || mainAnalysis[j].ancestorStr === t.ancestorStr)) {
            targetMatched[ti] = j; mainUsed[j] = true; mi = j + 1; break;
          }
        }
      }
      // Pass 2: Loose (type + varName)
      mi = 0;
      for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti] >= 0) continue;
        const t = targetAnalysis[ti];
        for (let j = mi; j < mainAnalysis.length; j++) {
          if (!mainUsed[j] && mainAnalysis[j].type === t.type &&
            (t.varName === undefined || mainAnalysis[j].varName === t.varName)) {
            targetMatched[ti] = j; mainUsed[j] = true; mi = j + 1; break;
          }
        }
      }

      // 4. สร้าง missing blocks ใน floating workspace
      const floatingWs = workspaceRef2.current;
      floatingWs.clear();
      let count = 0;
      const intentionallyCreated = new Set();
      
      Blockly.Events.disable();
      try {

      for (let ti = 0; ti < targetAnalysis.length; ti++) {
        if (targetMatched[ti] >= 0) continue; // block นี้มีแล้วใน main

        const missingBlock = targetAnalysis[ti];
        const sourceBlock = tempWs.getBlockById(missingBlock.id);
        if (!sourceBlock) continue;

        // สร้าง block ใหม่ใน floating workspace (เฉพาะตัวเดี่ยว ไม่เอาลูก)
        const newBlock = floatingWs.newBlock(sourceBlock.type);
        intentionallyCreated.add(newBlock.id);

        // Copy mutation / extra state (สำคัญมากสำหรับ function call, if/else)
        if (sourceBlock.mutationToDom && newBlock.domToMutation) {
          const mutationDom = sourceBlock.mutationToDom();
          if (mutationDom) newBlock.domToMutation(mutationDom);
        }
        if (sourceBlock.getExtraState && newBlock.setExtraState) {
          newBlock.setExtraState(sourceBlock.getExtraState());
        }

        // Copy ค่า field ทั้งหมด (เช่น variable name, operator, number value)
        for (const input of sourceBlock.inputList) {
          for (const field of input.fieldRow) {
            if (field.name) {
              try {
                let finalValue = field.getValue();

                // อิมพอร์ตตัวแปรข้าม Workspace ก่อนค่าจะถูกเซ็ต
                if (typeof field.getVariable === 'function') {
                  const varModel = field.getVariable();
                  if (varModel) {
                    // หาด้วย "ชื่อ" จาก floatingWs ว่ามีอยู่แล้วหรือยัง
                    let targetVar = floatingWs.getVariable(varModel.name, varModel.type);
                    
                    if (!targetVar) {
                      try {
                        // พยายามสร้างด้วย ID เดิม
                        targetVar = floatingWs.createVariable(varModel.name, varModel.type, varModel.getId());
                      } catch (err) {
                        // ถ้าติด Error ID ชนอีก ให้สร้างใหม่โดยปล่อยให้ Blockly สุ่ม ID ให้เลย
                        targetVar = floatingWs.createVariable(varModel.name, varModel.type);
                      }
                    }

                    if (targetVar) {
                      finalValue = targetVar.getId(); 
                    }
                  }
                }

                if (finalValue !== undefined && finalValue !== null) {
                  newBlock.getField(field.name)?.setValue(finalValue);
                }
              } catch (e) {
                  console.error(`[Diff] Failed to set field ${field.name}:`, e);
              }
            }
          }
        }

        newBlock.initSvg();
        newBlock.render();

        // วางตำแหน่ง (เรียงจากซ้ายไปขวา)
        newBlock.moveBy(20 + (count % 4) * 120, 20 + Math.floor(count / 4) * 60);
        count++;
      }

      } finally {
        Blockly.Events.enable();
      }

      tempWs.dispose();

      if (count > 0) {
        showAlert('✅ สำเร็จ', `สร้าง Floating Blocks ${count} ชิ้น จากบล็อกที่ขาดใน Main Workspace`);
      } else {
        showAlert('✨ ครบแล้ว', 'Main Workspace ไม่มีบล็อกที่ขาด — ไม่ต้องเพิ่ม Floating Blocks');
      }

    } catch (e) {
      console.error('Auto-fill failed:', e);
      showAlert('ข้อผิดพลาด', `Auto-fill ล้มเหลว: ${e.message}`);
    }
  };

  const handleSave = async () => {
    if (!workspaceRef.current) {
      showAlert('ข้อผิดพลาด', 'Workspace ไม่พร้อม');
      return;
    }

    try {
      // Export Main XML
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      // Export Floating XML
      let floatingXmlText = null;
      if (workspaceRef2.current) {
        const xml2 = Blockly.Xml.workspaceToDom(workspaceRef2.current);
        const text2 = Blockly.Xml.domToText(xml2);
        // เช็คว่ามี block จริงๆ ไม่ใช่แค่ <xml></xml> ว่างๆ
        if (text2 && text2.includes('<block')) {
          floatingXmlText = text2;
        }
      }

      const updateData = {
        starter_xml: xmlText || null,
        floating_xml: floatingXmlText,
      };

      await updateLevelMutation.mutateAsync({
        levelId: levelId,
        levelData: updateData
      });

      showAlert('สำเร็จ', 'บันทึก Starter XML + Floating Blocks สำเร็จ');
      navigate(`/admin/levels/${levelId}/edit`);
    } catch (error) {
      showAlert('ข้อผิดพลาด', `เกิดข้อผิดพลาดในการบันทึก: ` + (error.message || 'ไม่ทราบสาเหตุ'));
    }
  };

  const patterns = levelData?.patterns || [];

  if (loading) {
    return <PageLoader message="Loading starter blocks..." />;
  }

  if (isError || blocklyInitError || blocklyInitError2) {
    const errorMsg = error?.message || blocklyInitError || blocklyInitError2 || 'Something went wrong';
    return <PageError message={errorMsg} title="Failed to load starter blocks" />;
  }

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <AdminPageHeader
          title="เพิ่ม Starter Blocks"
          subtitle={levelData?.level_name || 'Loading...'}
          backPath={`/admin/levels/${levelId}/edit`}
          rightContent={
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="ml-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0 min-w-[140px] font-bold tracking-wide"
              size="default"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          }
        />

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Left: Main Blocks Workspace */}
          <div className="col-span-7 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
            <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-black uppercase tracking-wider">🏗️ Main Blocks — โครงสร้างหลัก</span>
              {patterns.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 max-w-[160px]"
                    value={selectedPatternId}
                    onChange={(e) => setSelectedPatternId(e.target.value)}
                  >
                    <option value="" disabled>เลือก Pattern...</option>
                    {patterns.map(p => (
                      <option key={p.pattern_id} value={p.pattern_id}>
                        {p.pattern_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-400 text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      if (!selectedPatternId) {
                        showAlert('ข้อผิดพลาด', 'กรุณาเลือก Pattern ก่อน');
                        return;
                      }
                      const pattern = patterns.find(p => p.pattern_id === parseInt(selectedPatternId));
                      if (!pattern?.xmlpattern) {
                        showAlert('ข้อผิดพลาด', 'Pattern นี้ไม่มี XML');
                        return;
                      }
                      showAlert('ยืนยัน', 'การโหลดจะทับบล็อกทั้งหมดใน Main Workspace\nต้องการดำเนินการต่อหรือไม่?', () => {
                        try {
                          workspaceRef.current.clear();
                          const xmlDom = Blockly.utils.xml.textToDom(pattern.xmlpattern);
                          setXmlLoading(true);
                          Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
                          setXmlLoading(false);
                        } catch (e) {
                          setXmlLoading(false);
                          showAlert('ข้อผิดพลาด', 'โหลด Pattern ล้มเหลว');
                        }
                      }, { showCancel: true });
                    }}
                  >
                    📥 1. โหลด Pattern
                  </Button>
                </div>
              )}
            </div>
            <PatternBlocklyWorkspace
              ref={blocklyRef}
              currentStepIndex={0}
              blocklyLoaded={blocklyLoaded}
            />
          </div>

          {/* Right: Floating Blocks Workspace */}
          <div className="col-span-5 flex flex-col h-full bg-white border-2 border-dashed border-indigo-300 rounded-xl shadow-xl overflow-hidden relative">
            <div className="h-12 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">🧩 Floating Blocks</span>

              {patterns.length > 0 && selectedPatternId && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-indigo-400 text-indigo-700 hover:bg-indigo-100 font-bold"
                    onClick={() => {
                      const pattern = patterns.find(p => p.pattern_id === parseInt(selectedPatternId));
                      if (pattern?.xmlpattern) {
                        handleAutoFillFloating(pattern.xmlpattern);
                      }
                    }}
                  >
                    🔮 2. เทียบหาชิ้นที่ขาด
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-red-400 text-red-700 hover:bg-red-50"
                    onClick={() => workspaceRef2.current?.clear()}
                  >
                    🗑️ ล้างฝั่งขวา
                  </Button>
                </div>
              )}
            </div>
            <PatternBlocklyWorkspace
              ref={blocklyRef2}
              currentStepIndex={0}
              blocklyLoaded={blocklyLoaded2}
            />
          </div>
        </div>
      </div>
      <AlertDialog {...alertDialog} />
    </div>
  );
};

export default StarterCreateEdit;