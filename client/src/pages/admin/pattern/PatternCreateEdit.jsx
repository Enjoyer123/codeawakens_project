import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader } from '@/components/ui/loader';
import PageLoader from '@/components/shared/Loading/PageLoader';
import ContentLoader from '@/components/shared/Loading/ContentLoader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PatternInfoForm from '@/components/admin/pattern/PatternInfoForm';

// Hooks
import { useLevel } from '../../../services/hooks/useLevel';
import { usePattern, usePatternTypes } from '../../../services/hooks/usePattern';
import { useWeapons } from '../../../services/hooks/useWeapons';
import { usePatternForm } from '../../../components/admin/pattern/hooks/usePatternForm';
import { usePatternBlocklyManager } from '../../../components/admin/pattern/hooks/usePatternBlocklyManager';
import { useSuppressBlocklyWarnings } from '@/components/admin/level/hooks/useSuppressBlocklyWarnings';

const PatternCreateEdit = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!patternId;

  useSuppressBlocklyWarnings();

  // --- 1. Data Layer ---
  const { data: levelData, isLoading: isLevelLoading, error: levelError } = useLevel(levelId);
  const { data: patternData, isLoading: isPatternLoading, error: patternError } = usePattern(patternId);
  const { data: patternTypes = [] } = usePatternTypes();
  const { data: weapons = [] } = useWeapons();

  // --- 2. View Mode ---
  const [isViewMode, setIsViewMode] = useState(false);

  // --- 3. Form Management Hook ---
  const patternForm = usePatternForm({
    levelId,
    patternId,
    patternData,
    patternTypes,
    onSaveSuccess: () => navigate(`/admin/levels`),
    isEditMode
  });

  // --- 4. Blockly Manager Hook ---
  const blocklyManager = usePatternBlocklyManager({
    levelData,
    patternData,
    isViewMode
  });

  // --- 5. Handlers ---
  const handleSaveWrapper = () => {
    // Save current blocks to logic
    blocklyManager.saveCurrentWorkspaceToRef();

    // Get latest data
    const finalSteps = blocklyManager.stepsRef.current.slice(0, 3);
    const workspaceXml = blocklyManager.getCurrentXml();

    patternForm.handleSave(finalSteps, workspaceXml);
  };

  const handleCopyToBuffer = () => {
    const xmlText = blocklyManager.getCurrentXml();
    if (!xmlText) return;

    try {
      const blob = new Blob([xmlText], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buffer_step${blocklyManager.currentStepIndex + 1}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`[Export XML] Downloaded for Step ${blocklyManager.currentStepIndex}`);
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
          '📥 Import XML?\n\nBlock จากไฟล์จะถูกเพิ่มเข้าไปใน Workspace\n(ไม่ทับ Block เดิม)\n\nต้องการดำเนินการต่อหรือไม่?'
        );
        if (!confirmed) return;

        // Note: We need to access workspace via ref within hook or pass it out
        if (blocklyManager.workspaceRef.current) {
          const xmlDom = Blockly.utils.xml.textToDom(xmlText);
          Blockly.Xml.domToWorkspace(xmlDom, blocklyManager.workspaceRef.current);
        }
      } catch (e) {
        console.error('[Import XML] Error:', e);
        alert('❌ เกิดข้อผิดพลาดในการ Import\n\nกรุณาตรวจสอบไฟล์ XML');
      }
    };
    input.click();
  };

  // --- Render ---
  const isLoading = isLevelLoading || isPatternLoading;
  const errorObj = levelError || patternError || blocklyManager.blocklyInitError;

  if (isLoading) return <PageLoader message="Loading data..." />;
  if (errorObj) return <div className="p-8 text-center text-red-500">เกิดข้อผิดพลาด: {errorObj.message || errorObj}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex-none p-4 bg-white shadow-sm z-10">
        <AdminPageHeader
          title={isEditMode ? `แก้ไขรูปแบบ: ${patternForm.patternName}` : "สร้างรูปแบบคำตอบใหม่"}
          backPath={`/admin/levels`}
          rightContent={
            <div className="flex gap-2">
              <Button
                variant={isViewMode ? "default" : "outline"}
                onClick={() => setIsViewMode(!isViewMode)}
              >
                {isViewMode ? '✏️ Edit Mode' : '👁️ View Mode'}
              </Button>
              <Button
                onClick={handleSaveWrapper}
                disabled={patternForm.isSaving || isViewMode}
              >
                {patternForm.isSaving && <Loader size="sm" className="mr-2" />}
                บันทึก
              </Button>
            </div>
          }
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Settings */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <PatternInfoForm
            patternName={patternForm.patternName} setPatternName={patternForm.setPatternName}
            patternDescription={patternForm.patternDescription} setPatternDescription={patternForm.setPatternDescription}
            weaponId={patternForm.weaponId} setWeaponId={patternForm.setWeaponId}
            bigO={patternForm.bigO} setBigO={patternForm.setBigO}
            patternTypes={patternTypes}
            weapons={weapons}
            disabled={isViewMode}
            isEditMode={isEditMode}
            patternLoaded={!!patternData}
          />
        </div>

        {/* Right: Workspace */}
        <div className="w-2/3 flex flex-col relative bg-gray-100">
          {/* Step Navigation */}
          <div className="bg-white p-2 border-b flex justify-between items-center px-4">
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-700">Step {blocklyManager.currentStepIndex + 1} / 3</span>

              {/* Visual Effect Selector - Only for Step 1 & 2 */}
              {blocklyManager.currentStepIndex < 2 && (
                <div className="flex items-center gap-2 border-l pl-4">
                  <span className="text-sm text-gray-500">Effect:</span>
                  <Select
                    value={(blocklyManager.steps[blocklyManager.currentStepIndex] && blocklyManager.steps[blocklyManager.currentStepIndex].effect) || ''}
                    onValueChange={(value) => blocklyManager.updateStepEffect(value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="w-[200px] h-[40px]">
                      <SelectValue placeholder="-- No Effect --" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] max-h-[300px]">
                      <SelectItem value="none">-- No Effect --</SelectItem>

                      {/* Step 1 (Index 0): Only Aura */}
                      {blocklyManager.currentStepIndex === 0 && (
                        <>
                          <SelectItem value="aura_1">
                            <div className="flex items-center gap-2">
                              <img src="/aura/aura_1_2.png" alt="Aura 1" className="w-8 h-8 object-contain bg-black/20 rounded-sm" />
                              <span>Aura 1</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="aura_2">
                            <div className="flex items-center gap-2">
                              <img src="/aura/aura_2_2.png" alt="Aura 2" className="w-8 h-8 object-contain bg-black/20 rounded-sm" />
                              <span>Aura 2</span>
                            </div>
                          </SelectItem>
                        </>
                      )}

                      {/* Step 2 (Index 1): Only Circle */}
                      {blocklyManager.currentStepIndex === 1 && (
                        <>
                          <SelectItem value="circle_1">
                            <div className="flex items-center gap-2">
                              <img src="/aura/circle_1_2.png" alt="Circle 1" className="w-8 h-8 object-contain bg-black/20 rounded-sm" />
                              <span>Circle 1</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="circle_2">
                            <div className="flex items-center gap-2">
                              <img src="/aura/circle_2_2.png" alt="Circle 2" className="w-8 h-8 object-contain bg-black/20 rounded-sm" />
                              <span>Circle 2</span>
                            </div>
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopyToBuffer}>
                💾 Export XML
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportFromFile}>
                📥 Import XML
              </Button>
              <Button variant="outline" size="sm" onClick={blocklyManager.handlePreviousStep} disabled={blocklyManager.currentStepIndex === 0}>
                ← Previous
              </Button>
              <Button variant="outline" size="sm" onClick={blocklyManager.handleNextStep} disabled={blocklyManager.currentStepIndex >= 2}>
                Next Step →
              </Button>
            </div>
          </div>

          {/* Blockly Container */}
          <div className="flex-1 relative">
            {(blocklyManager.xmlLoading || !blocklyManager.blocklyLoaded) && (
              <div className="absolute inset-0 z-20 bg-white/90">
                <ContentLoader
                  message={blocklyManager.xmlLoading ? "Preparing Blocks..." : "Loading Workspace..."}
                  height="h-full"
                />
              </div>
            )}
            <div ref={blocklyManager.blocklyRefCallback} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternCreateEdit;