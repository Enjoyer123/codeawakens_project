import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as Blockly from 'blockly/core';
import { useBlocklyWorkspace } from '../../level/hooks/useBlocklyWorkspace';
// const { useBlocklyCleanup } removed
import { useEnabledBlocks } from '@/gameutils/blockly/hooks/useEnabledBlocks';
import { setXmlLoading as setGlobalXmlLoading } from '@/gameutils/blockly/core/state';

export const usePatternBlocklyManager = ({
    levelData,
    patternData,
    isViewMode,
    showAlert
}) => {
    // Steps State
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const stepsRef = useRef([]); // Keep track of latest step data without re-renders
    const lastLoadedXmlRef = useRef(null); // Prevent redundant XML loads
    const [blocklyRefReady, setBlocklyRefReady] = useState(false);
    const blocklyRef = useRef(null);

    // Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

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
    const enabledBlocks = useEnabledBlocks(levelData);

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
        error: blocklyInitError
    } = useBlocklyWorkspace({
        blocklyRef,
        levelData,
        enabledBlocks,
        isRestricted: false,
        refReady: blocklyRefReady,
        readOnly: isViewMode
    });

    // const { cleanupDuplicateProcedures } removed

    // XML Loading Logic
    const loadStepXml = useCallback(async (index, isForward = true) => {
        if (!workspaceRef.current || !levelData) return;
        if (lastLoadedXmlRef.current === index) return;

        // console.log(`[loadStepXml] Loading Step ${index}`);

        const targetStep = stepsRef.current[index];
        let xmlToLoad = null;

        if (!isViewMode && isForward && index > 0) {
            const prevStep = stepsRef.current[index - 1];

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

        workspaceRef.current.clear();

        let finalXml = xmlToLoad;
        if (!finalXml || !finalXml.trim()) {
            finalXml = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }

        const xmlDom = Blockly.utils.xml.textToDom(finalXml);

        // ⚡ Performance: Set flag to skip event processing during load
        setGlobalXmlLoading(true);

        Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);

        setGlobalXmlLoading(false);
        lastLoadedXmlRef.current = index;
    }, [levelData, isViewMode]);

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
            const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
            const xmlText = Blockly.Xml.domToText(xmlDom);

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
        if (currentStepIndex >= 2) { showAlert?.('คำเตือน', 'ถึงขั้นตอนสุดท้ายแล้ว (สูงสุด 3 ขั้นตอน)'); return; }

        const proceed = async () => {
            if (!isViewMode) saveCurrentWorkspaceToRef();
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            await loadStepXml(nextIndex, true);
        };

        if (!isViewMode) {
            setConfirmDialog({
                isOpen: true,
                title: 'ยืนยันเปลี่ยน Step',
                message: '⚠️ คำเตือน: กรุณาตรวจสอบ Block ให้ดีก่อนกด Next\n\nเพราะถ้าต้องกลับมาแก้ไข Step นี้ในภายหลัง\nBlock ของ Step ถัดไปจะต้องเรียงใหม่ทั้งหมด\n\nต้องการดำเนินการต่อหรือไม่?',
                onConfirm: async () => {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    await proceed();
                }
            });
            return;
        }

        await proceed();
    };

    const handlePreviousStep = async () => {
        if (currentStepIndex <= 0) return;

        const proceed = async () => {
            if (!isViewMode) saveCurrentWorkspaceToRef();
            const prevIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevIndex);
            await loadStepXml(prevIndex, false);
        };

        if (!isViewMode) {
            setConfirmDialog({
                isOpen: true,
                title: 'ยืนยันย้อนกลับ',
                message: '⚠️ คำเตือน: การย้อนกลับจะทำให้ต้องเรียง Block ใหม่\n\nเมื่อคุณกลับมาจาก Step ' + currentStepIndex + '\n\nต้องการย้อนกลับหรือไม่?',
                onConfirm: async () => {
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    await proceed();
                }
            });
            return;
        }

        await proceed();
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


        const xmlDom = Blockly.Xml.workspaceToDom(workspaceRef.current);
        return Blockly.Xml.domToText(xmlDom);
    }

    return {
        steps, stepsRef,
        currentStepIndex,
        blocklyLoaded,
        blocklyInitError,
        blocklyRefCallback,

        // Actions
        handleNextStep,
        handlePreviousStep,
        saveCurrentWorkspaceToRef,
        updateStepEffect,
        getCurrentXml,
        workspaceRef,
        confirmDialog,
        setConfirmDialog
    };
};