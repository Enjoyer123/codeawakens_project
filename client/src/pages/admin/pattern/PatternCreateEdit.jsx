import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import { fetchLevelById } from '../../../services/levelService';
import { fetchPatternById, updatePattern, createPattern } from '../../../services/patternService';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { Settings, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PatternInfoForm from '@/components/admin/pattern/PatternInfoForm';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';
import { usePatternData } from './hooks/usePatternData';
import { usePatternBlockly } from './hooks/usePatternBlockly';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PatternCreateEdit = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);

  const isEditMode = !!patternId;

  // Use Custom Hook for Data & State
  const {
    // Data States
    levelData, setLevelData,
    loading, setLoading,
    error, setError,
    enabledBlocks, setEnabledBlocks,
    patternData, setPatternData,
    patternLoaded, setPatternLoaded,
    patternTypes, setPatternTypes,

    // Form States
    patternName, setPatternName,
    patternDescription, setPatternDescription,
    weaponId, setWeaponId,
    bigO, setBigO,

    // Step States & Refs
    steps, setSteps,
    currentStepIndex, setCurrentStepIndex,
    stepsRef,
    stepsXmlCacheRef
  } = usePatternData(levelId, patternId, isEditMode, getToken);

  const {
    blocklyRef,
    workspaceRef,
    blocklyLoaded,
    blocklyProcessing,
    saveCurrentStep,
    prevStepIndexRef
  } = usePatternBlockly({
    levelData,
    enabledBlocks,
    currentStepIndex,
    setCurrentStepIndex,
    steps,
    setSteps,
    stepsRef,
    stepsXmlCacheRef,
  });

  const handleNextStep = async () => {
    if (currentStepIndex >= 2) {
      alert('จำกัดจำนวน Step สูงสุดที่ 3 ขั้นตอน');
      return;
    }
    const saved = await saveCurrentStep();
    if (!saved) { alert('ไม่สามารถบันทึก step ปัจจุบันได้'); return; }
    await new Promise(r => setTimeout(r, 50));
    prevStepIndexRef.current = currentStepIndex; // สำคัญ: ตั้งก่อนที่ effect จะรัน
    setCurrentStepIndex(currentStepIndex + 1);
  };

  const handlePreviousStep = async () => {
    if (currentStepIndex <= 0) return;
    const saved = await saveCurrentStep();
    if (!saved) return;
    await new Promise(r => setTimeout(r, 50));
    prevStepIndexRef.current = currentStepIndex; // สำคัญ
    setCurrentStepIndex(currentStepIndex - 1);
  };

  const handleFinish = async () => {
    // 1. Save current step first
    if (!workspaceRef.current) {
      alert('Workspace ไม่พร้อม');
      return;
    }

    // CRITICAL: Save current step before finishing
    const saved = await saveCurrentStep();
    if (!saved) {
      alert('ไม่สามารถบันทึก step สุดท้ายได้');
      return;
    }

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get final steps from ref (most up-to-date)
    const finalSteps = (stepsRef.current.length > 0 ? stepsRef.current : steps).slice(0, 3);

    if (finalSteps.length === 0) {
      alert('กรุณาเพิ่มอย่างน้อย 1 step');
      return;
    }

    if (!patternName.trim()) {
      alert('กรุณากรอกชื่อรูปแบบคำตอบ');
      return;
    }

    // ใช้ XML จาก step สุดท้ายที่บันทึก (ถ้ามี) เป็น pattern รวม
    const lastStepIndex = finalSteps.length - 1;
    const lastStep = finalSteps[lastStepIndex];
    let finalPatternXml = lastStep?.xmlCheck || lastStep?.xml || '';

    // Fallback มาที่ workspace ปัจจุบันถ้า step สุดท้ายไม่มี XML
    if (!finalPatternXml || !finalPatternXml.trim()) {
      const fallbackXml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      finalPatternXml = Blockly.Xml.domToText(fallbackXml);
    }

    // 4. Prepare hints array - per-step XML only (no cross-step fill). ใช้ cache ถ้าสต็ปนั้นหาย
    let lastNonEmptyForHints = '';
    const hasBlocks = (xmlString) => xmlString && (xmlString.includes('<block') || xmlString.includes('<shadow'));
    const hints = finalSteps.map((step, index) => {
      let xmlCheck = step.xmlCheck || step.xml || stepsXmlCacheRef.current[index] || '';
      if (!xmlCheck || !xmlCheck.trim() || !hasBlocks(xmlCheck)) {
        // fallback to last non-empty with blocks
        if (hasBlocks(lastNonEmptyForHints)) {
          xmlCheck = lastNonEmptyForHints;
        } else if (hasBlocks(finalPatternXml)) {
          xmlCheck = finalPatternXml;
        } else {
          console.warn(`⚠️ Step ${index + 1} has no XML. Question: ${step.question || 'N/A'}`);
          xmlCheck = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }
      }
      xmlCheck = xmlCheck.trim();
      if (hasBlocks(xmlCheck)) {
        lastNonEmptyForHints = xmlCheck;
      }
      return {
        step: index,
        trigger: "onXmlMatch",
        xmlCheck,
      };
    });
    // Log hints before sending
    // 5. Save pattern
    try {
      setSaving(true);

      const patternData = {
        level_id: parseInt(levelId),
        pattern_type_id: null, // Always auto-evaluated
        weapon_id: weaponId ? parseInt(weaponId) : null,
        pattern_name: patternName.trim(),
        description: patternDescription ? patternDescription.trim() : null,
        xmlpattern: finalPatternXml || null,
        hints: hints,
        bigO: bigO || null,
        block_keywords: null, // No longer needed - using block_key from level_category instead
      };

      // Log pattern data before sending (without full XML to avoid console spam)
      let result;
      if (isEditMode && patternId) {
        // Update existing pattern
        result = await updatePattern(getToken, patternId, patternData);
        alert('อัพเดทรูปแบบคำตอบสำเร็จ');
      } else {
        // Create new pattern
        result = await createPattern(getToken, patternData);
        alert('บันทึกรูปแบบคำตอบสำเร็จ');
      }

      const savedPatternId = result.pattern?.pattern_id || patternId;

      // Navigate to preview page with the pattern
      if (savedPatternId) {
        navigate(`/admin/levels/${levelId}/preview/${savedPatternId}`);
      } else {
        navigate(`/admin/levels/${levelId}/preview`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการ${isEditMode ? 'อัพเดท' : 'บันทึก'}: ` + (error.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">⏳ กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="mx-auto" />
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <div className="text-lg mb-2">❌ {error}</div>
          <Button onClick={() => navigate(-1)}>กลับ</Button>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <AdminPageHeader
          title={isEditMode ? "แก้ไขรูปแบบคำตอบ" : "เพิ่มรูปแบบคำตอบ"}
          subtitle={levelData?.level_name || 'Loading...'}
          backPath={`/admin/levels/${levelId ? `edit/${levelId}` : ''}`}
          rightContent={
            <Button
              onClick={handleFinish}
              disabled={saving || !patternName.trim()}
              className="ml-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0 min-w-[140px] font-bold tracking-wide"
              size="default"
            >
              {saving ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'สิ้นสุดและบันทึก')}
            </Button>
          }
        />

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar: Tools & Properties */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
            <Tabs defaultValue="settings" className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 pt-4 bg-white border-b border-gray-100">
                <TabsList className="w-full p-1 bg-white border border-gray-200 rounded-lg">
                  <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                    <Settings className="w-3 h-3 mr-2" /> Settings
                  </TabsTrigger>
                  <TabsTrigger value="steps" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                    <ListOrdered className="w-3 h-3 mr-2" /> Steps
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-gray-50/50">
                <TabsContent value="settings" className="space-y-6 mt-0">
                  <PatternInfoForm
                    patternName={patternName}
                    setPatternName={setPatternName}
                    patternDescription={patternDescription}
                    setPatternDescription={setPatternDescription}
                    weaponId={weaponId}
                    setWeaponId={setWeaponId}
                    bigO={bigO}
                    setBigO={setBigO}
                    isEditMode={isEditMode}
                    patternLoaded={patternLoaded}
                  />
                </TabsContent>

                <TabsContent value="steps" className="space-y-6 mt-0">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">
                      Step {currentStepIndex + 1}
                    </h2>
                    <div className="text-sm text-gray-600 mb-4">
                      Step ที่บันทึกแล้ว: {steps.length}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      คำใบ้ (Hints) จะถูกจัดการจากตาราง Level Hints แทน
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePreviousStep}
                        disabled={currentStepIndex === 0}
                        variant="outline"
                        className="flex-1"
                      >
                        ← ก่อนหน้า
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        disabled={currentStepIndex >= 2}
                        variant="outline"
                        className="flex-1"
                      >
                        ถัดไป →
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right: Blockly Workspace */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
            <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-black uppercase tracking-wider">Blockly Workspace</span>
              <div className="text-xs text-gray-500">
                Step {currentStepIndex + 1} of {steps.length || 1}
              </div>
            </div>
            <div className="flex-1 relative">
              {blocklyProcessing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader className="mx-auto mb-4" size="lg" />
                    <div className="text-lg text-gray-600">กำลังเตรียม workspace...</div>
                    <div className="text-sm text-gray-400 mt-2">กำลังจัดการบล็อก function และลบบล็อกที่ซ้ำซ้อน</div>
                  </div>
                </div>
              ) : null}
              <div className={blocklyProcessing ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
                <PatternBlocklyWorkspace
                  ref={blocklyRef}
                  currentStepIndex={currentStepIndex}
                  blocklyLoaded={blocklyLoaded}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternCreateEdit;