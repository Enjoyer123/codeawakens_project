import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Blockly from 'blockly';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader } from '@/components/ui/loader';
import { Info } from 'lucide-react';
import PageLoader from '@/components/shared/Loading/PageLoader';
import ContentLoader from '@/components/shared/Loading/ContentLoader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PseudocodeEditor from '../../../components/admin/pattern/PseudocodeEditor';
// Hooks
import { useLevel } from '../../../services/hooks/useLevel';
import { usePattern, usePatternTypes } from '../../../services/hooks/usePattern';
import { usePatternForm } from '../../../components/admin/pattern/hooks/usePatternForm';
import { usePatternBlocklyManager } from '../../../components/admin/pattern/hooks/usePatternBlocklyManager';
import { useSuppressBlocklyWarnings } from '@/components/admin/level/hooks/useSuppressBlocklyWarnings';
import { setXmlLoading } from "@/gameutils/blockly/core/state";
import AlertDialog from '@/components/shared/dialog/AlertDialog';
import { useAlertDialog } from '@/components/shared/dialog/useAlertDialog';

const PatternCreateEdit = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!patternId;

  useSuppressBlocklyWarnings();

  const { data: levelData, isLoading: isLevelLoading, error: levelError } = useLevel(levelId);
  const { data: patternData, isLoading: isPatternLoading, error: patternError } = usePattern(patternId);

  const [isViewMode, setIsViewMode] = useState(false);
  const { alertDialog, showAlert } = useAlertDialog();

  const blocklyManager = usePatternBlocklyManager({
    levelData,
    patternData,
    isViewMode,
    showAlert
  });

  const patternForm = usePatternForm({
    levelId,
    patternId,
    patternData,
    patternTypes: [],
    onSaveSuccess: () => {
      navigate(`/admin/levels/${levelId}/preview/${patternId}`);
    },
    isEditMode,
    showAlert
  });

  const handleSaveLogic = () => {
    blocklyManager.saveCurrentWorkspaceToRef();
    const finalSteps = blocklyManager.stepsRef.current.slice(0, blocklyManager.currentStepIndex + 1);

    // ✨ THE FIX: เคลียร์ Pseudocode ของ Part ก่อนหน้าออก ให้เหลือแค่ Part สุดท้ายที่เราถือว่าเป็นคำตอบ
    const processedSteps = finalSteps.map((step, idx) => {
      if (idx === finalSteps.length - 1) {
        return step; // Part สุดท้าย (ที่กดบันทึก) ให้เก็บข้อมูลไว้ตามปกติ
      } else {
        return { ...step, pseudocode: [] }; // Part ก่อนหน้า ล้าง pseudocode ทิ้ง ป้องกันการโชว์ซ้ำซ้อน
      }
    });

    const workspaceXml = blocklyManager.getCurrentXml();
    patternForm.handleSave(processedSteps, workspaceXml);
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
      showAlert('❌ Export ไม่สำเร็จ', 'เกิดข้อผิดพลาดในการ Export');
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
        showAlert(
          '📥 Import XML?',
          'Block จากไฟล์จะถูกเพิ่มเข้าไปใน Workspace\n(ไม่ทับ Block เดิม)\n\nต้องการดำเนินการต่อหรือไม่?',
          () => {
            if (blocklyManager.workspaceRef.current) {
              try {
                const xmlDom = Blockly.utils.xml.textToDom(xmlText);
                setXmlLoading(true);
                Blockly.Xml.domToWorkspace(xmlDom, blocklyManager.workspaceRef.current);
                setXmlLoading(false);
              } catch (innerErr) {
                console.error('[Import XML] Inner Error:', innerErr);
                showAlert('❌ Import ไม่สำเร็จ', 'เกิดข้อผิดพลาดในการ Import กรุณาตรวจสอบไฟล์ XML');
              }
            }
          },
          { showCancel: true }
        );
      } catch (e) {
        console.error('[Import XML File Read] Error:', e);
        showAlert('❌ อ่านไฟล์ไม่สำเร็จ', 'ไม่สามารถอ่านไฟล์ XML ได้');
      }
    };
    input.click();
  };

  const isLoading = isLevelLoading || isPatternLoading;
  const errorObj = levelError || patternError || blocklyManager.blocklyInitError;

  if (isLoading) return <PageLoader message="Loading logic editor..." />;
  if (errorObj) return <div className="p-8 text-center text-red-500">เกิดข้อผิดพลาด: {errorObj.message || errorObj}</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex-none p-4 bg-white shadow-sm z-10">
        <AdminPageHeader
          title={`แก้ไข Logic: ${patternData?.pattern_name || 'Pattern'}`}
          backPath={`/admin/levels`}
          rightContent={
            <div className="flex gap-2">
              <Button variant={isViewMode ? "default" : "outline"} onClick={() => setIsViewMode(!isViewMode)}>
                {isViewMode ? 'Edit Mode' : 'View Mode'}
              </Button>
              <Button onClick={handleSaveLogic} disabled={patternForm.isSaving || isViewMode}>
                {patternForm.isSaving && <Loader size="sm" className="mr-2" />}
                บันทึก Logic
              </Button>
            </div>
          }
        />
      </div>

      <div className="px-4 pb-2">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-3 text-blue-800 text-sm shadow-sm">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">คำแนะนำการบันทึก Logic</p>
            <p>
              ระบบจะบันทึก Pattern ตามจำนวน Step ที่คุณทำเสร็จสิ้น ณ ขณะที่กดบันทึก <br />
              เช่น หากคุณกดบันทึกที่ <strong>Step 1</strong> ระบบจะถือว่า Pattern นี้มีแค่ <strong>1 Part</strong> (ข้อมูลใน Step 2 และ 3 จะถูกตัดออก)
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-gray-100">
        <div className="flex-1 flex flex-col relative bg-white border-r border-gray-200">
          <div className="bg-white p-2 border-b flex justify-between items-center px-4">
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-700">Step {blocklyManager.currentStepIndex + 1} / 3</span>
              {blocklyManager.currentStepIndex < 2 && (
                <div className="flex items-center gap-2 border-l pl-4">
                  <span className="text-sm text-gray-500">Effect:</span>
                  <Select
                    value={(blocklyManager.steps[blocklyManager.currentStepIndex] && blocklyManager.steps[blocklyManager.currentStepIndex].effect) || ''}
                    onValueChange={(value) => blocklyManager.updateStepEffect(value)}
                  >
                    <SelectTrigger className="w-[200px] h-[40px]">
                      <SelectValue placeholder="-- No Effect --" />
                    </SelectTrigger>
                    <SelectContent className="z-[1000] max-h-[300px]">
                      <SelectItem value="none">-- No Effect --</SelectItem>
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
            <div className="space-x-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleCopyToBuffer}>Export XML</Button>
              <Button variant="outline" size="sm" onClick={handleImportFromFile}>Import XML</Button>
              <Button variant="outline" size="sm" onClick={blocklyManager.handlePreviousStep} disabled={blocklyManager.currentStepIndex === 0}>← Prev</Button>
              <Button variant="outline" size="sm" onClick={blocklyManager.handleNextStep} disabled={blocklyManager.currentStepIndex >= 2}>Next →</Button>
            </div>
          </div>

          <div className="flex-1 relative">
            {!blocklyManager.blocklyLoaded && (
              <div className="absolute inset-0 z-20 bg-white/90">
                <ContentLoader message="Loading Workspace..." height="h-full" />
              </div>
            )}
            <div ref={blocklyManager.blocklyRefCallback} className="absolute inset-0" />
          </div>
        </div>

        <div className="w-[450px] shrink-0 flex flex-col bg-gray-50 overflow-y-auto">
          <div className="p-4 h-full">
            <PseudocodeEditor
              stepIndex={blocklyManager.currentStepIndex}
              value={blocklyManager.steps[blocklyManager.currentStepIndex]?.pseudocode || []}
              onChange={(newLines) => blocklyManager.updateStepPseudocode(newLines)}
              workspaceRef={blocklyManager.workspaceRef}
            />
          </div>
        </div>
      </div>

      <Dialog open={blocklyManager.confirmDialog?.isOpen} onOpenChange={(isOpen) => { if (!isOpen) blocklyManager.setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{blocklyManager.confirmDialog?.title}</DialogTitle></DialogHeader>
          <DialogDescription className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed mt-4">{blocklyManager.confirmDialog?.message}</DialogDescription>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => blocklyManager.setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>ยกเลิก</Button>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide" onClick={() => { if (blocklyManager.confirmDialog?.onConfirm) blocklyManager.confirmDialog.onConfirm(); }}>
              ดำเนินการต่อ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog {...alertDialog} />
    </div>
  );
};

export default PatternCreateEdit;