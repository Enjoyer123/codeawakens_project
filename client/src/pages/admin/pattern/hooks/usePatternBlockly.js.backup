import { useState, useRef, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly/core';
import { usePatternBlocklyXmlLogic } from './usePatternBlocklyXmlLogic';
import {
    createToolboxConfig,
    defineAllBlocks,
    ensureStandardBlocks,
    ensureCommonVariables,
    initializeImprovedVariableHandling
} from '../../../../gameutils/blockly';

export const usePatternBlockly = (params) => {
    const {
        levelData,
        enabledBlocks,
        currentStepIndex,
        setCurrentStepIndex,
        steps,
        setSteps,
        stepsRef,
        stepsXmlCacheRef,
    } = params;

    const blocklyRef = useRef(null);
    const workspaceRef = useRef(null);
    const [blocklyLoaded, setBlocklyLoaded] = useState(false);
    const [blocklyProcessing, setBlocklyProcessing] = useState(true);
    const [error, setError] = useState(null);

    const isFirstXmlLoad = useRef(true);
    const starterXmlLoadedRef = useRef(false);
    const lastLoadedXmlRef = useRef(null);
    const prevStepIndexRef = useRef(-1);
    const isLoadingFromPreviousStepRef = useRef(false);
    const isXmlLoadingRef = useRef(false);
    const cleanupDuplicateProceduresRef = useRef(null);
    const skipCleanupRef = useRef(false);
    const cleanupTimeoutRef = useRef(null);
    const lastProcedureNameRef = useRef('');

    const defaultProcedureName = 'DFS';

    const loadXmlDomSafely = useCallback((xmlDom) => {
        if (!workspaceRef.current || !xmlDom) return;
        isXmlLoadingRef.current = true;
        try {
            Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
        } finally {
            let checkCount = 0;
            const maxChecks = 30;
            const checkAndCleanup = () => {
                checkCount++;
                if (!workspaceRef.current) {
                    isXmlLoadingRef.current = false;
                    setBlocklyProcessing(false);
                    return;
                }
                const allBlocks = workspaceRef.current.getAllBlocks(false);
                const callBlocks = allBlocks.filter(b =>
                    (b.type === 'procedures_callreturn' || b.type === 'procedures_callnoreturn') &&
                    !b.isInFlyout && !b.isDisposed()
                );
                const allReady = callBlocks.length === 0 || callBlocks.every(cb => {
                    try {
                        const name = cb.getFieldValue('NAME');
                        return name && name !== 'unnamed' && name !== 'undefined' && name.trim() && cb.getField('NAME') !== null && !cb.isDisposed();
                    } catch (e) { return false; }
                });
                if (allReady || checkCount >= maxChecks) {
                    isXmlLoadingRef.current = false;
                    if (cleanupDuplicateProceduresRef.current) cleanupDuplicateProceduresRef.current();
                    setTimeout(() => setBlocklyProcessing(false), 100);
                } else {
                    // Try to clean up anyway to help blocks become ready
                    if (cleanupDuplicateProceduresRef.current) cleanupDuplicateProceduresRef.current(true);
                    setTimeout(checkAndCleanup, 100);
                }
            };
            setTimeout(checkAndCleanup, 200);
        }
    }, []);

    usePatternBlocklyXmlLogic({
        workspaceRef,
        blocklyLoaded,
        levelData,
        currentStepIndex,
        steps,
        setSteps,
        stepsRef,
        stepsXmlCacheRef,
        prevStepIndexRef,
        isLoadingFromPreviousStepRef,
        isXmlLoadingRef,
        cleanupDuplicateProceduresRef,
        starterXmlLoadedRef,
        lastLoadedXmlRef,
        isFirstXmlLoad,
        setBlocklyProcessing,
        loadXmlDomSafely
    });

    useEffect(() => {
        if (!blocklyRef.current || !levelData || Object.keys(enabledBlocks).length === 0) return;

        isFirstXmlLoad.current = true;
        starterXmlLoadedRef.current = false;

        setTimeout(() => {
            try {
                if (workspaceRef.current) { workspaceRef.current.dispose(); workspaceRef.current = null; }
                if (blocklyRef.current) blocklyRef.current.innerHTML = '';

                initializeImprovedVariableHandling();
                ensureStandardBlocks();
                defineAllBlocks();

                const toolbox = createToolboxConfig(enabledBlocks);
                const workspace = Blockly.inject(blocklyRef.current, {
                    toolbox, collapse: true, comments: true, disable: false, maxBlocks: Infinity, trashcan: true,
                    horizontalLayout: false, toolboxPosition: "start", css: true,
                    media: "https://blockly-demo.appspot.com/static/media/",
                    rtl: false, scrollbars: true, sounds: false, oneBasedIndex: true,
                    grid: { spacing: 20, length: 3, colour: "#ccc", snap: true },
                    zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
                });
                workspaceRef.current = workspace;

                let isCreatingCallBlock = false;

                const cleanupDuplicateProcedures = (force = false) => {
                    if (!force && (skipCleanupRef.current || isCreatingCallBlock || isXmlLoadingRef.current || !workspace)) return;
                    try {
                        const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false).concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                        if (definitionBlocks.length === 0) return;
                        const callBlocks = workspace.getBlocksByType('procedures_callreturn', false).concat(workspace.getBlocksByType('procedures_callnoreturn', false));

                        const hasUnnamedCall = callBlocks.some(cb => { try { const n = cb.getFieldValue('NAME'); return !n || n === 'unnamed' || n === 'undefined' || !n.trim(); } catch (e) { return false; } });
                        if (hasUnnamedCall) {
                            const bestDef = definitionBlocks.filter(def => { try { const nm = def.getFieldValue('NAME'); return nm && nm !== 'unnamed' && nm !== 'undefined' && nm.trim() !== ''; } catch (e) { return false; } }).sort((a, b) => {
                                const cnt = (d) => { try { const m = d.mutationToDom && d.mutationToDom(); if (m && m.childNodes) return Array.from(m.childNodes).filter(n => n.nodeName === 'arg').length; } catch (e) { } return 0; };
                                return cnt(b) - cnt(a);
                            })[0];
                            if (bestDef) {
                                const bestName = bestDef.getFieldValue('NAME');
                                lastProcedureNameRef.current = bestName;
                                callBlocks.forEach(cb => {
                                    try {
                                        const n = cb.getFieldValue('NAME');
                                        if (!n || n === 'unnamed' || n === 'undefined' || !n.trim()) {
                                            cb.getField('NAME')?.setValue(bestName);
                                            if (cb.setProcedureParameters) {
                                                const p = bestDef.getVars ? bestDef.getVars() : [];
                                                let pIds = bestDef.paramIds_ || (bestDef.getVarModels ? bestDef.getVarModels().map(m => m.getId()) : []);
                                                if (p.length && pIds.length === p.length) cb.setProcedureParameters(p, pIds, true);
                                            }
                                        }
                                    } catch (e) { }
                                });
                                return;
                            } else {
                                // Fallback: No valid definition found. Rename the invalid definition itself to default 'DFS'.
                                const invalidDefs = definitionBlocks.filter(def => {
                                    const nm = def.getFieldValue('NAME');
                                    return !nm || nm === 'unnamed' || nm === 'undefined' || nm.trim() === '';
                                });

                                if (invalidDefs.length > 0) {
                                    // Rename the first invalid def to default name
                                    invalidDefs[0].getField('NAME')?.setValue(defaultProcedureName);
                                    lastProcedureNameRef.current = defaultProcedureName;
                                    return; // Let next cycle handle rebind
                                }
                                // If no invalid defs to fix, proceed to cleanup loop to delete zombies
                            }
                        }

                        const validProcedures = new Map();
                        definitionBlocks.forEach(defBlock => {
                            try {
                                const name = defBlock.getFieldValue('NAME');
                                // 1. Delete invalid names
                                if (!name || name === 'unnamed' || name === 'undefined' || name.trim() === '') {
                                    if (!defBlock.isDisposed()) {
                                        defBlock.dispose(false);
                                    }
                                    return;
                                }

                                // 2. Delete duplicates (keep first found)
                                if (validProcedures.has(name)) {
                                    if (!defBlock.isDisposed()) {
                                        defBlock.dispose(false);
                                    }
                                } else {
                                    validProcedures.set(name, defBlock);
                                }
                            } catch (e) { }
                        });
                    } catch (e) { }
                };

                cleanupDuplicateProceduresRef.current = cleanupDuplicateProcedures;

                workspace.addChangeListener((event) => {
                    if (isXmlLoadingRef.current) return;

                    if (event.type === Blockly.Events.BLOCK_DELETE) {
                        let del = null;
                        try { if (event.oldXml) del = typeof event.oldXml === 'string' ? Blockly.utils.xml.textToDom(event.oldXml) : event.oldXml; } catch (e) { }
                        if (del && (del.getAttribute('type') === 'procedures_defreturn' || del.getAttribute('type') === 'procedures_defnoreturn')) {
                            setTimeout(() => {
                                const calls = workspace.getBlocksByType('procedures_callreturn', false).concat(workspace.getBlocksByType('procedures_callnoreturn', false));
                                const defs = workspace.getBlocksByType('procedures_defreturn', false).concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                                const names = new Set();
                                defs.forEach(d => { try { const n = d.getFieldValue('NAME'); if (n && n !== 'unnamed' && n !== 'undefined') names.add(n); } catch (e) { } });
                                calls.forEach(c => { try { if (!names.has(c.getFieldValue('NAME')) && names.size > 0) c.getField('NAME').setValue(Array.from(names)[0]); } catch (e) { } });
                            }, 50);
                        }
                    }

                    if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE) {
                        const b = workspace.getBlockById(event.blockId);
                        if (b && (b.type === 'procedures_defreturn' || b.type === 'procedures_defnoreturn')) {
                            try { const n = b.getFieldValue('NAME'); if (n && n.trim()) lastProcedureNameRef.current = n; } catch (e) { }
                        }
                    }

                    if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE || event.type === Blockly.Events.BLOCK_DELETE) {
                        if (skipCleanupRef.current || isCreatingCallBlock) return;
                        if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
                        cleanupTimeoutRef.current = setTimeout(() => {
                            const c = workspace.getBlocksByType('procedures_callreturn', false).concat(workspace.getBlocksByType('procedures_callnoreturn', false));
                            const allNamed = c.every(cb => { try { const n = cb.getFieldValue('NAME'); return n && n !== 'unnamed' && n !== 'undefined' && n.trim(); } catch (e) { return false; } });
                            if (allNamed || c.length === 0) cleanupDuplicateProcedures();
                            cleanupTimeoutRef.current = null;
                        }, 300);
                    }

                    if (event.type === Blockly.Events.BLOCK_CREATE) {
                        const block = workspace.getBlockById(event.blockId);
                        if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
                            isCreatingCallBlock = true; skipCleanupRef.current = true;
                            try {
                                const f = block.getField('NAME');
                                if (f) {
                                    const cur = f.getValue();
                                    const defs = workspace.getBlocksByType('procedures_defreturn', false).concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                                    const names = new Set();
                                    defs.forEach(d => { try { const n = d.getFieldValue('NAME'); if (n && n !== 'unnamed' && n !== 'undefined' && n.trim()) { names.add(n); lastProcedureNameRef.current = n; } } catch (e) { } });
                                    if (!cur || cur === 'unnamed' || cur === 'undefined' || !cur.trim() || !names.has(cur)) {
                                        f.setValue(Array.from(names)[0] || lastProcedureNameRef.current || defaultProcedureName);
                                    }
                                    const matched = defs.find(d => d.getFieldValue('NAME') === f.getValue());
                                    if (matched && block.setProcedureParameters) {
                                        const p = matched.getVars ? matched.getVars() : [];
                                        let pIds = matched.paramIds_ || (matched.getVarModels ? matched.getVarModels().map(m => m.getId()) : []);
                                        if (p.length && pIds.length === p.length) { block.setProcedureParameters(p, pIds, true); if (block.render) block.render(); }
                                    }
                                }
                            } catch (e) { }
                            setTimeout(() => { isCreatingCallBlock = false; skipCleanupRef.current = false; }, 3500);
                        }

                        if (block && (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn')) {
                            setTimeout(() => {
                                try {
                                    const name = block.getFieldValue('NAME');
                                    const all = workspace.getBlocksByType('procedures_defreturn', false).concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                                    const rebind = (f, t) => { try { (Blockly.Procedures.getCallers(f || '', workspace) || []).forEach(c => c.getField('NAME')?.setValue(t)); } catch (e) { } };
                                    const same = all.filter(d => d.getFieldValue('NAME') === name);
                                    if (same.length > 1) {
                                        const keep = same[0];
                                        same.forEach(d => { if (d !== keep) { rebind(d.getFieldValue('NAME'), keep.getFieldValue('NAME')); if (!d.isDisposed()) d.dispose(false); } });
                                    } else {
                                        const base = (name || '').replace(/\d+$/, '');
                                        const baseDef = all.find(d => d.getFieldValue('NAME') !== name && d.getFieldValue('NAME').replace(/\d+$/, '') === base);
                                        if (baseDef) { rebind(name, baseDef.getFieldValue('NAME')); if (!block.isDisposed()) block.dispose(false); }
                                    }
                                } catch (e) { }
                            }, 100);
                        }
                    }
                });

                lastLoadedXmlRef.current = null;
                setTimeout(() => setBlocklyLoaded(true), 300);
                ensureCommonVariables(workspace);
            } catch (err) { setError('เกิดข้อผิดพลาดในการสร้าง workspace'); }
        }, 100);
    }, [levelData, enabledBlocks]);

    const saveCurrentStep = useCallback(async () => {
        if (!workspaceRef.current) return false;
        try {
            const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
            const xmlText = Blockly.Xml.domToText(xml);
            const stepData = { step: currentStepIndex, xmlCheck: xmlText, xml: xmlText };
            stepsXmlCacheRef.current[currentStepIndex] = xmlText;
            const currentSteps = [...stepsRef.current];
            if (currentSteps[currentStepIndex]) currentSteps[currentStepIndex] = { ...currentSteps[currentStepIndex], ...stepData };
            else currentSteps[currentStepIndex] = stepData;
            stepsRef.current = currentSteps;
            setSteps(currentSteps);
            await new Promise(r => setTimeout(r, 50));
            return true;
        } catch (error) { return false; }
    }, [currentStepIndex, setSteps, stepsRef, stepsXmlCacheRef]);

    return {
        blocklyRef,
        workspaceRef,
        blocklyLoaded,
        blocklyProcessing,
        error,
        saveCurrentStep,
        loadXmlDomSafely,
        prevStepIndexRef,
    };
};
