import React, { useEffect } from 'react';
import * as Blockly from 'blockly/core';
import ModernTheme from '@blockly/theme-modern';

const BlocklyHistoryView = ({ blocklyRef, blocklyCode, isOpen, displayMode, selectedLevelId, workspaceRef }) => {
    useEffect(() => {
        let currentWorkspace = null;
        let timer = null;

        const injectBlockly = () => {
            if (!isOpen || displayMode !== 'blockly' || !blocklyCode || !blocklyRef.current) {
                return;
            }

            try {
                // Dispose existing workspace if any
                if (workspaceRef.current) {
                    workspaceRef.current.dispose();
                }

                // Create custom light brown theme
                // const customTheme = Blockly.Theme.defineTheme('lightBrown', {
                //     'base': Blockly.Themes.Classic,
                //     'componentStyles': {
                //         'workspaceBackgroundColour': '#E1D09F',
                //         'toolboxBackgroundColour': '#d4b896',
                //         'toolboxForegroundColour': '#2d1b0e',
                //         'flyoutBackgroundColour': '#e8d4bc',
                //         'flyoutForegroundColour': '#2d1b0e',
                //         'flyoutOpacity': 0.95,
                //         'scrollbarColour': '#8b6f47',
                //         'scrollbarOpacity': 0.6
                //     }
                // });

                // Inject Blockly
                currentWorkspace = Blockly.inject(blocklyRef.current, {
                    readOnly: true,
                    scrollbars: true,
                    move: {
                        scrollbars: true,
                        drag: true,
                        wheel: true
                    },
                    zoom: {
                        controls: true,
                        wheel: true,
                        startScale: 0.8,
                        maxScale: 3,
                        minScale: 0.3,
                        scaleSpeed: 1.2
                    },
                    theme: ModernTheme
                });

                workspaceRef.current = currentWorkspace;

                // Load blocks
                const xmlText = blocklyCode;
                if (xmlText && xmlText.trim()) {
                    const xml = Blockly.utils.xml.textToDom(xmlText);
                    Blockly.Xml.domToWorkspace(xml, currentWorkspace);
                }

                // Force resize to ensure visibility
                Blockly.svgResize(currentWorkspace);

                // One more resize after a short delay just in case container was still animating
                setTimeout(() => {
                    if (currentWorkspace) Blockly.svgResize(currentWorkspace);
                }, 100);

            } catch (e) {
                console.error("Failed to load blocks into history workspace:", e);
            }
        };

        if (isOpen && displayMode === 'blockly') {
            // Small initial delay to ensure DOM is ready and TabsContent is rendered
            timer = setTimeout(injectBlockly, 100);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (currentWorkspace) {
                currentWorkspace.dispose();
                workspaceRef.current = null;
            }
        };
    }, [isOpen, displayMode, blocklyCode, selectedLevelId, blocklyRef, workspaceRef]);

    return (
        <div ref={blocklyRef} className="flex-1 w-full h-full" />
    );
};

export default BlocklyHistoryView;
