import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/javascript';

import { setXmlLoading } from "@/gameutils/blockly/core/state";

import { useSuppressBlocklyWarnings } from '../../../components/admin/level/hooks/useSuppressBlocklyWarnings';
import { useBlocklyWorkspace } from '../../../components/admin/level/hooks/useBlocklyWorkspace';
import { useEnabledBlocks } from '@/gameutils/blockly/hooks/useEnabledBlocks';
// asyncUtils import removed
import { useLevel, useUpdateLevel } from '../../../services/hooks/useLevel';
import { Button } from '@/components/ui/button';
import PageLoader from '@/components/shared/Loading/PageLoader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';
import { API_BASE_URL } from '../../../config/apiConfig';
import PageError from '@/components/shared/Error/PageError';

const StarterCreateEdit = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const blocklyRef = useRef(null);
  const isFirstXmlLoad = useRef(true);

  // TanStack Query Hooks
  const {
    data: levelData,
    isLoading: loading,
    error,
    isError
  } = useLevel(levelId);

  const updateLevelMutation = useUpdateLevel();

  // Replaced enabledBlocks useEffect with useEnabledBlocks hook
  const enabledBlocks = useEnabledBlocks(levelData);

  // Blockly Workspace Hook
  const {
    workspaceRef,
    blocklyLoaded,
    error: blocklyInitError
  } = useBlocklyWorkspace({
    blocklyRef,
    enabledBlocks
  });

  // Suppress Blockly deprecation warnings
  useSuppressBlocklyWarnings();

  // Retrieve loading/error state from Query
  const isSaving = updateLevelMutation.isPending;

  // Load starter XML when workspace is ready
  useEffect(() => {
    // Wait until levelData is fully loaded (not loading and has data) and Blockly is ready
    if (!workspaceRef.current || !blocklyLoaded || !levelData || loading) {
      return;
    }

    // Prevent multiple loads
    if (!isFirstXmlLoad.current) {
      return;
    }

    const loadInitialXml = async () => {
      try {
        const starter_xml = levelData?.starter_xml;
        const hasStarterXml = starter_xml && typeof starter_xml === 'string' && starter_xml.trim() && starter_xml.includes('<block');

        if (hasStarterXml) {
          // Add a small delay so UI settles before injection (preventing sizing bugs)
          await new Promise(r => setTimeout(r, 100));

          // Clear any default blocks and prepare for injection
          workspaceRef.current.clear();

          const cleanedStarterXml = starter_xml; // Procedure fix removed, Native handles it
          const xmlDom = Blockly.utils.xml.textToDom(cleanedStarterXml);

          setXmlLoading(true);
          Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
          setXmlLoading(false);
        }
      } catch (err) {
        console.error("XML Load failed:", err);
        setXmlLoading(false);
      } finally {
        isFirstXmlLoad.current = false;
      }
    };

    loadInitialXml();

  }, [blocklyLoaded, levelData, loading]);

  const handleSave = async () => {
    if (!workspaceRef.current) {
      alert('Workspace ไม่พร้อม');
      return;
    }

    try {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      const updateData = {
        starter_xml: xmlText || null,
      };

      await updateLevelMutation.mutateAsync({
        levelId: levelId,
        levelData: updateData
      });

      alert('บันทึก Starter XML สำเร็จ');
      navigate(`/admin/levels/${levelId}/edit`);
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ` + (error.message || 'ไม่ทราบสาเหตุ'));
    }
  };

  if (loading) {
    return (
      <PageLoader message="Loading starter blocks..." />
    );
  }

  // Combined error check
  if (isError || blocklyInitError) {
    const errorMsg = error?.message || blocklyInitError || 'Something went wrong';
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

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Right: Blockly Workspace */}
          <div className="col-span-12 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
            <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-black uppercase tracking-wider">Blockly Workspace - Starter Blocks</span>
            </div>
            <PatternBlocklyWorkspace
              ref={blocklyRef}
              currentStepIndex={0}
              blocklyLoaded={blocklyLoaded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StarterCreateEdit;