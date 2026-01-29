import { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly/core';
import {
    createToolboxConfig,
    defineAllBlocks,
    ensureStandardBlocks,
    ensureCommonVariables,
    initializeImprovedVariableHandling
} from '../../../../gameutils/blockly';

export const useBlocklyWorkspace = ({
    blocklyRef,
    enabledBlocks,
    refReady = true, // Optional trigger to force re-run when ref is ready
    initialData, // Optional: for future use
    readOnly = false // ← เพิ่ม
}) => {
    const workspaceRef = useRef(null);
    const [blocklyLoaded, setBlocklyLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!blocklyRef.current || !enabledBlocks || Object.keys(enabledBlocks).length === 0) {
            return;
        }

        if (workspaceRef.current) {
            return;
        }

        try {
            ensureStandardBlocks();
            ensureCommonVariables();
            initializeImprovedVariableHandling();
            defineAllBlocks();

            const toolboxConfig = createToolboxConfig(enabledBlocks);

            const workspaceConfig = {
                toolbox: toolboxConfig,
                collapse: true,
                comments: true,
                disable: false, // Allow editing
                maxBlocks: Infinity,
                trashcan: true,
                horizontalLayout: false,
                toolboxPosition: 'start',
                css: true,
                media: 'https://blockly-demo.appspot.com/static/media/',
                rtl: false,
                scrollbars: true,
                sounds: false,
                oneBasedIndex: true,
                readOnly: readOnly, // ← เพิ่ม
                variables: enabledBlocks['variables_get'] ||
                    enabledBlocks['variables_set'] ||
                    enabledBlocks['var_math'] ||
                    enabledBlocks['get_var_value'] || false,
                grid: {
                    spacing: 20,
                    length: 3,
                    colour: '#ccc',
                    snap: true,
                },
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 0.8,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2,
                },
            };

            const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
            workspaceRef.current = workspace;
            setBlocklyLoaded(true);

        } catch (err) {
            console.error('Error initializing Blockly:', err);
            setError('เกิดข้อผิดพลาดในการโหลด Blockly: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
        }

        return () => {
            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
                setBlocklyLoaded(false);
            }
        };
    }, [enabledBlocks, blocklyRef, refReady]); // Added refReady to dependencies

    return {
        workspaceRef,
        blocklyLoaded,
        error
    };
};
