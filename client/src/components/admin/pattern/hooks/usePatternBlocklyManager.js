import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as Blockly from 'blockly/core';
import { useBlocklyWorkspace } from '../../level/hooks/useBlocklyWorkspace';
import { useBlocklyCleanup } from '../../level/hooks/useBlocklyCleanup';
import { removeVariableIdsFromXml, addMutationToProcedureDefinitions, fixWorkspaceProcedures } from '../utils/patternBlocklyUtils';
import { delay } from '../../level/utils/asyncUtils';
import { setXmlLoading as setGlobalXmlLoading } from '../../../../gameutils/blockly/core/blocklyState';

export const usePatternBlocklyManager = ({
    levelData,
    patternData,
    isViewMode
}) => {
    // Steps State
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const stepsRef = useRef([]); // Keep track of latest step data without re-renders
    const lastLoadedXmlRef = useRef(null); // Prevent redundant XML loads
    const [xmlLoading, setXmlLoading] = useState(false);
    const [blocklyRefReady, setBlocklyRefReady] = useState(false);
    const blocklyRef = useRef(null);

    // Initialize Steps when patternData loads
    useEffect(() => {
        if (patternData) {
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
                        : (patternData.starter_xml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'),
                    effect: hint.effect || ''
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

    // Calculate Enabled Blocks
    const enabledBlocks = useMemo(() => {
        if (!levelData) return {};
        const enabledBlocksObj = {};

        if (Array.isArray(levelData.level_blocks)) {
            levelData.level_blocks.forEach((blockInfo) => {
                if (blockInfo?.block?.block_key) {
                    enabledBlocksObj[blockInfo.block.block_key] = true;
                }
            });
        }

        if (Object.keys(enabledBlocksObj).length === 0) {
            if (typeof levelData.enabled_blocks === 'object') {
                Object.assign(enabledBlocksObj, levelData.enabled_blocks || {});
            } else if (typeof levelData.enabled_blocks === 'string') {
                try {
                    Object.assign(enabledBlocksObj, JSON.parse(levelData.enabled_blocks) || {});
                } catch (e) { }
            }
        }

        if (Object.keys(enabledBlocksObj).length === 0) {
            enabledBlocksObj.move_forward = true;
            enabledBlocksObj.turn_left = true;
            enabledBlocksObj.turn_right = true;
        }

        return enabledBlocksObj;
    }, [levelData]);

    // Blockly Workspace Init
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
        enabledBlocks,
        isRestricted: false,
        refReady: blocklyRefReady,
        readOnly: isViewMode
    });

    const { cleanupDuplicateProcedures } = useBlocklyCleanup({ workspaceRef });

    // XML Loading Logic
    const loadStepXml = useCallback(async (index, isForward = true) => {
        if (!workspaceRef.current || !levelData) return;
        if (lastLoadedXmlRef.current === index) return;

        // console.log(`[loadStepXml] Loading Step ${index}`);

        const targetStep = stepsRef.current[index];
        let xmlToLoad = null;

        if (!isViewMode && isForward && index > 0) {
            const prevStep = stepsRef.current[index - 1];
            const currentWorkspaceXml = getCurrentXml(); // Check if we should carry over current work

            // Logic: ถ้าเป็นการกด Next เราอาจจะอยากโหลด XML ของ Step ก่อนหน้ามาทำต่อ
            // แต่ในที่นี้ใช้ logic ดึงจาก saved step
            if (prevStep && prevStep.xml) {
                xmlToLoad = prevStep.xml;
            }
        }

        if (!xmlToLoad && targetStep && targetStep.xml) {
            xmlToLoad = targetStep.xml;
        }

        if (!xmlToLoad) {
            xmlToLoad = levelData.starter_xml;
        }

        setGlobalXmlLoading(true);

        try {
            await delay(50);
            workspaceRef.current.clear();

            let finalXml = xmlToLoad;
            if (!finalXml || !finalXml.trim()) {
                finalXml = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
            }

            try {
                finalXml = removeVariableIdsFromXml(finalXml);
                finalXml = addMutationToProcedureDefinitions(finalXml);
            } catch (e) {
                console.warn("XML Cleanup failed, using original", e);
            }

            const xmlDom = Blockly.utils.xml.textToDom(finalXml);

            // ⚡ Performance: Set flag to skip event processing during load
            setGlobalXmlLoading(true);

            Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);

            // -----------------------------------------------------------
            // ✅ FIX: เรียกใช้ Runtime Fixer ทันทีหลังจากโหลด XML ลง Workspace
            // เพื่อจัดการกับบล็อก solve1, solve2 ที่อาจเกิดขึ้น
            // -----------------------------------------------------------
            if (workspaceRef.current) {
                fixWorkspaceProcedures(workspaceRef.current);
            }
            // -----------------------------------------------------------

            setGlobalXmlLoading(false);

            if (!isViewMode && cleanupDuplicateProcedures) {
                await delay(50);
                cleanupDuplicateProcedures(true);
            }

        } catch (err) {
            console.error("Error loading XML for step", index, err);
        } finally {
            setXmlLoading(false); // Update local state
            setGlobalXmlLoading(false);
            lastLoadedXmlRef.current = index;
        }
    }, [levelData, cleanupDuplicateProcedures, isViewMode]);

    // Initial Load
    useEffect(() => {
        if (blocklyLoaded && workspaceRef.current && lastLoadedXmlRef.current === null) {
            loadStepXml(currentStepIndex, true);
        }
    }, [blocklyLoaded, loadStepXml]);
    // Note: We don't include currentStepIndex here intentionally to rely on explicit navigation

    const saveCurrentWorkspaceToRef = useCallback(() => {
        if (!workspaceRef.current) return false;
        try {
            // ก่อน Save ทำการ fix อีกรอบเพื่อความชัวร์ว่า XML ที่ออกไปสะอาด
            fixWorkspaceProcedures(workspaceRef.current);

            const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
            let xmlText = Blockly.Xml.domToText(xmlDom);
            xmlText = addMutationToProcedureDefinitions(xmlText);

            const currentRef = [...stepsRef.current];
            const stepData = currentRef[currentStepIndex] || { step: currentStepIndex, xml: '', effect: '' };

            currentRef[currentStepIndex] = { ...stepData, xml: xmlText, xmlCheck: xmlText };
            stepsRef.current = currentRef;
            setSteps(currentRef);
            return true;
        } catch (e) {
            console.error("Failed to save workspace", e);
            return false;
        }
    }, [currentStepIndex]);

    const handleNextStep = async () => {
        if (currentStepIndex >= 2) return alert('สูงสุด 3 ขั้นตอน');

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

        if (!isViewMode) {
            const confirmed = window.confirm(
                '⚠️ คำเตือน: การย้อนกลับจะทำให้ต้องเรียง Block ใหม่\n\n' +
                'เมื่อคุณกลับมาจาก Step ' + currentStepIndex + '\n\n' +
                'ต้องการย้อนกลับหรือไม่?'
            );
            if (!confirmed) return;
            saveCurrentWorkspaceToRef();
        }

        const prevIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevIndex);
        await loadStepXml(prevIndex, false);
    };

    const updateStepEffect = (effect) => {
        const newSteps = [...steps];
        if (!newSteps[currentStepIndex]) {
            newSteps[currentStepIndex] = { step: currentStepIndex, xml: '', effect: '' };
        }
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], effect: effect };
        setSteps(newSteps);
        stepsRef.current = newSteps;
    };

    // Get current XML for saving
    const getCurrentXml = () => {
        if (!workspaceRef.current) return '';
        // Fix ก่อน export เสมอ
        fixWorkspaceProcedures(workspaceRef.current);

        const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
        return Blockly.Xml.domToText(xmlDom);
    }

    return {
        steps, stepsRef,
        currentStepIndex,
        xmlLoading,
        blocklyLoaded,
        blocklyInitError,
        blocklyRefCallback,

        // Actions
        handleNextStep,
        handlePreviousStep,
        saveCurrentWorkspaceToRef,
        updateStepEffect,
        getCurrentXml,
        workspaceRef
    };
};