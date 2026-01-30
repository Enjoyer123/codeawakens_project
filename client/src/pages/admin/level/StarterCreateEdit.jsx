import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';

import {
  syncProcedureParameters,
  removeVariableIdsFromXml,
  //   getParamCount, // Unused here, used in hook
  //   rebindCallers  // Unused here, used in hook
} from '../../../components/admin/level/utils/blocklyProcedureUtils';

import { useBlocklyCleanup } from '../../../components/admin/level/hooks/useBlocklyCleanup';
import { useSuppressBlocklyWarnings } from '../../../components/admin/level/hooks/useSuppressBlocklyWarnings';
import { useBlocklyWorkspace } from '../../../components/admin/level/hooks/useBlocklyWorkspace';
import { useBlocklyEventHandlers } from '../../../components/admin/level/hooks/useBlocklyEventHandlers';
import { delay, nextFrame, waitForCondition } from '../../../components/admin/level/utils/asyncUtils';
import { useLevel, useUpdateLevel } from '../../../services/hooks/useLevel';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import PageLoader from '@/components/shared/Loading/PageLoader';
import ContentLoader from '@/components/shared/Loading/ContentLoader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';

import { API_BASE_URL } from '../../../config/apiConfig';

const StarterCreateEdit = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const blocklyRef = useRef(null);
  const isFirstXmlLoad = useRef(true);
  const isXmlLoadingRef = useRef(false);
  const skipCleanupRef = useRef(false);
  const starterXmlLoadedRef = useRef(false);

  // Local state for blockly initialization
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [blocklyProcessing, setBlocklyProcessing] = useState(true);

  // TanStack Query Hooks
  const {
    data: levelData,
    isLoading: loading,
    error,
    isError
  } = useLevel(levelId);

  const updateLevelMutation = useUpdateLevel();

  // Blockly Workspace Hook
  const {
    workspaceRef,
    blocklyLoaded,
    error: blocklyInitError
  } = useBlocklyWorkspace({
    blocklyRef,
    enabledBlocks
  });

  // Cleanup Hook
  const { cleanupDuplicateProcedures } = useBlocklyCleanup({
    workspaceRef,
    skipCleanupRef,
    isXmlLoadingRef
  });

  // Event Handlers Hook
  useBlocklyEventHandlers({
    workspaceRef,
    cleanupDuplicateProcedures,
    blocklyLoaded,
    skipCleanupRef,
    isXmlLoadingRef
  });

  // Suppress Blockly deprecation warnings
  useSuppressBlocklyWarnings();

  // Effect to process levelData when it loads (calculate enabledBlocks)
  useEffect(() => {
    if (levelData) {
      const enabledBlocksObj = {};
      (levelData.level_blocks || []).forEach((blockInfo) => {
        if (blockInfo?.block?.block_key) {
          enabledBlocksObj[blockInfo.block.block_key] = true;
        }
      });

      if (Object.keys(enabledBlocksObj).length === 0) {
        enabledBlocksObj.move_forward = true;
        enabledBlocksObj.turn_left = true;
        enabledBlocksObj.turn_right = true;
      }
      setEnabledBlocks(enabledBlocksObj);
    }
  }, [levelData]);

  // Retrieve loading/error state from Query
  const isSaving = updateLevelMutation.isPending;

  // Load starter XML when workspace is ready
  useEffect(() => {
    // Wait until levelData is fully loaded (not loading and has data)
    if (!workspaceRef.current || !blocklyLoaded || !levelData || loading) {
      return;
    }

    // Prevent multiple loads
    if (!isFirstXmlLoad.current || starterXmlLoadedRef.current) {
      return;
    }

    const starter_xml = levelData?.starter_xml;
    const hasStarterXml = starter_xml && typeof starter_xml === 'string' && starter_xml.trim() && starter_xml.includes('<block');

    if (hasStarterXml) {
      // Mark as loading immediately to prevent duplicate loads
      starterXmlLoadedRef.current = true;

      // Helper function to load XML with retry mechanism
      const loadXmlWithRetry = async (retryCount = 0, maxRetries = 3) => {
        try {
          // Wait longer to ensure workspace and toolbox are fully initialized
          await nextFrame();
          await delay(0);
          await nextFrame();

          await delay(800);

          // Retry loop
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const isLastAttempt = attempt === maxRetries;

            // Re-check workspace
            if (!workspaceRef.current) {
              if (!isLastAttempt) {
                await delay(500);
                continue;
              } else {
                throw new Error("Workspace not ready");
              }
            }

            // Verify toolbox
            const toolbox = workspaceRef.current.getToolbox();
            if (!toolbox || !toolbox.flyout_) {
              if (!isLastAttempt) {
                await delay(300);
                continue;
              }
            }

            const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
            const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);

            workspaceRef.current.clear();

            skipCleanupRef.current = true;
            isXmlLoadingRef.current = true;

            await delay(300);

            if (!workspaceRef.current) {
              if (!isLastAttempt) { await delay(500); continue; }
              throw new Error("Workspace gone during prep");
            }

            // Check if blocks already exist (prevent duplicate load on retry 0)
            const existingBlocks = workspaceRef.current.getAllBlocks(false);
            if (existingBlocks.length > 0 && attempt === 0) {
              isFirstXmlLoad.current = false;
              skipCleanupRef.current = false;
              isXmlLoadingRef.current = false;
              return;
            }

            // Load XML
            try {
              Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
            } catch (loadErr) {
              if (!isLastAttempt) {
                await delay(500);
                continue;
              }
              throw loadErr;
            }

            // Verify blocks loaded
            await delay(200);

            if (!workspaceRef.current) {
              if (!isLastAttempt) { await delay(500); continue; }
              throw new Error("Workspace gone after load");
            }

            const loadedBlocks = workspaceRef.current.getAllBlocks(false);
            const actualBlocks = loadedBlocks.filter(block => {
              try { return !block.isInFlyout && !block.isShadow; } catch (e) { return true; }
            });

            if (actualBlocks.length === 0 && !isLastAttempt) {
              console.log(`No blocks loaded, retrying... (${attempt + 1}/${maxRetries})`);
              skipCleanupRef.current = false;
              isXmlLoadingRef.current = false;
              await delay(500);
              continue; // Retry loop
            }

            // Blocks loaded successfully. Fix procedure calls.
            await delay(50);

            try {
              const definitionBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));

              const callBlocks = workspaceRef.current.getBlocksByType('procedures_callreturn', false)
                .concat(workspaceRef.current.getBlocksByType('procedures_callnoreturn', false));

              const validProcedureNames = new Set();
              definitionBlocks.forEach(defBlock => {
                try {
                  const name = defBlock.getFieldValue('NAME');
                  if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                    validProcedureNames.add(name);
                  }
                } catch (e) { }
              });

              // Fix call blocks
              callBlocks.forEach(callBlock => {
                try {
                  const nameField = callBlock.getField('NAME');
                  if (nameField) {
                    const currentName = nameField.getValue();
                    if (!validProcedureNames.has(currentName)) {
                      if (validProcedureNames.size > 0) {
                        const firstValidName = Array.from(validProcedureNames)[0];
                        nameField.setValue(firstValidName);
                        // Sync
                        const matchedDef = definitionBlocks.find(def => {
                          try { return def.getFieldValue('NAME') === firstValidName; } catch (e) { return false; }
                        });
                        if (matchedDef && callBlock.setProcedureParameters) {
                          syncProcedureParameters(callBlock, matchedDef, workspaceRef.current);
                        }
                        if (callBlock.render) callBlock.render();
                      }
                    }
                  }
                } catch (e) { }
              });

              // Remove bad definitions
              definitionBlocks.forEach(defBlock => {
                try {
                  const defName = defBlock.getFieldValue('NAME');
                  if (defName && !validProcedureNames.has(defName)) {
                    const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                      const baseName = validName.replace(/\d+$/, '');
                      const defBaseName = defName.replace(/\d+$/, '');
                      return baseName === defBaseName && defName !== validName;
                    });
                    if (isNumberedVariant && !defBlock.isDisposed()) {
                      defBlock.dispose(false);
                    }
                  }
                } catch (e) { }
              });
            } catch (fixErr) {
              // Ignore fixing errors
            }

            // Success! Finish up.
            await delay(50);
            isXmlLoadingRef.current = false;
            skipCleanupRef.current = false;
            isFirstXmlLoad.current = false;

            if (cleanupDuplicateProcedures) {
              cleanupDuplicateProcedures();
            }

            await delay(400);
            setBlocklyProcessing(false);
            return; // Exit function successfully
          }

          // Loop finished = retries exhausted
          throw new Error("Max retries reached");

        } catch (err) {
          console.error("XML Load failed:", err);
          starterXmlLoadedRef.current = false;
          skipCleanupRef.current = false;
          isXmlLoadingRef.current = false;
          isFirstXmlLoad.current = false;
          setBlocklyProcessing(false);
        }
      };

      // Start loading
      loadXmlWithRetry();
    } else {
      // No starter XML
      isFirstXmlLoad.current = false;
      starterXmlLoadedRef.current = true;
      setBlocklyProcessing(false);
    }
  }, [blocklyLoaded, levelData, loading, cleanupDuplicateProcedures]);

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

      // Use updating mutation instead of direct API call
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <div className="text-lg mb-2">❌ {errorMsg}</div>
          <Button onClick={() => navigate(-1)}>กลับ</Button>
        </div>
      </div>
    );
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
            <div className="flex-1 relative">
              {blocklyProcessing ? (
                <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center">
                  <ContentLoader
                    message="Preparing workspace..."
                    height="h-auto"
                    className="w-full"
                  />
                </div>
              ) : null}
              <div className={blocklyProcessing ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
                <PatternBlocklyWorkspace
                  ref={blocklyRef}
                  currentStepIndex={0}
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

export default StarterCreateEdit;
