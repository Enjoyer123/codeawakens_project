/**
 * Hook for Blockly workspace initialization
 */

import React, { useEffect } from 'react';
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
import { javascriptGenerator } from "blockly/javascript";
import ModernTheme from '@blockly/theme-modern';
import {
  createToolboxConfig,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../../gameutils/blockly';
import { defineAllGenerators } from '@/gameutils/blockly';
import { registerRopePartitionBlocks } from '@/gameutils/blockly';

// Refactored State Management
import { setXmlLoading, isXmlLoading } from '@/gameutils/blockly';

// Import refactored modules
import {
  ensureVariableIds,
  addMutationToProcedureDefinitions
} from './xmlFixers';

// Register custom blocks immediately
try {
  registerRopePartitionBlocks();
} catch (e) {
  console.error('Failed to register Rope Partition blocks:', e);
}

/**
 * Hook for Blockly setup
 */
export function useBlocklySetup({
  blocklyRef,
  workspaceRef,
  enabledBlocks,
  enabledBlockKeySignature,
  setBlocklyLoaded,
  setBlocklyJavaScriptReady,
  setCurrentHint,
  initPhaserGame,
  starter_xml = null,
  blocklyLoaded = false,
  isTextCodeEnabled = false,
  onCodeGenerated = null
}) {
  const initBlocklyAndPhaser = () => {
    if (!blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    setTimeout(() => {
      try {
        // Clean up existing workspace
        setBlocklyLoaded(false);
        if (workspaceRef.current) {
          try {
            workspaceRef.current.dispose();
          } catch (disposeError) {
            console.warn("Error disposing workspace:", disposeError);
          }
          workspaceRef.current = null;
        }

        // Clear container
        if (blocklyRef.current) {
          blocklyRef.current.innerHTML = '';
          if (!blocklyRef.current.parentNode) {
            console.error("Blockly container is not attached to DOM!");
            return;
          }
        }

        // Initialize
        initializeImprovedVariableHandling();

        ensureStandardBlocks();

        defineAllGenerators();

        // Force override procedures_defreturn generator AFTER defineAllGenerators
        const customProcGen = javascriptGenerator.forBlock["procedures_defreturn"];
        if (customProcGen) {
          javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
        }

        const toolbox = createToolboxConfig(enabledBlocks);

        const workspaceConfig = {
          theme: ModernTheme,
          renderer: 'geras',
          toolbox,
          collapse: true,
          comments: true,
          disable: true,
          maxBlocks: Infinity,
          trashcan: true,
          horizontalLayout: false,
          toolboxPosition: "start",
          css: true,
          media: "https://blockly-demo.appspot.com/static/media/",
          rtl: false,
          move: {
            scrollbars: {
              horizontal: false,
              vertical: false
            },
            drag: true,
            wheel: true,
          },
          sounds: false,
          oneBasedIndex: true,
          variables: enabledBlocks["variables_get"] ||
            enabledBlocks["variables_set"] ||
            enabledBlocks["var_math"] ||
            enabledBlocks["get_var_value"] || false,
          grid: {
            spacing: 20,
            length: 3,
            colour: "#ccc",
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
        setBlocklyJavaScriptReady(true);





        ensureCommonVariables(workspace);

        // Note: Starter XML will be loaded in useEffect after workspace is ready

        // CRITICAL: Prevent auto-creation of procedure definitions
        let isCreatingCallBlock = false;

        workspace.addChangeListener((event) => {
          // ⚡ Performance: Skip all processing during XML load
          if (isXmlLoading()) {
            return;
          }

          // ⚡ Performance: Skip UI-only events that don't need processing
          if (event.type === Blockly.Events.UI ||
            event.type === Blockly.Events.SELECTED ||
            event.type === Blockly.Events.CLICK) {
            return;
          }

          // Track when call blocks are being created
          if (event.type === Blockly.Events.BLOCK_CREATE) {
            const block = workspace.getBlockById(event.blockId);

            if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
              isCreatingCallBlock = true;


              // Fix procedure name immediately to prevent getDefinition error
              setTimeout(() => {
                try {
                  const nameField = block.getField('NAME');
                  if (nameField) {
                    const currentValue = nameField.getValue();

                    // If value is invalid, fix it
                    if (!currentValue || currentValue === 'unnamed' || currentValue === 'undefined' ||
                      currentValue === 'temp_procedure' || (typeof currentValue === 'string' && currentValue.trim() === '')) {
                      const procedureMap = workspace.getProcedureMap();
                      if (procedureMap) {
                        const procedures = procedureMap.getProcedures();
                        if (procedures.length > 0) {
                          nameField.setValue(procedures[0].getName());

                        } else {
                          // Check definition blocks directly
                          const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                            .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                          if (definitionBlocks.length > 0) {
                            const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                            if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                              nameField.setValue(firstDefName);

                            }
                          }
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.warn('Error fixing call block name:', e);
                }
                isCreatingCallBlock = false;
              }, 50);
            }

            // If a definition block is created while we're creating a call block, delete it
            if (block && (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn')) {
              if (isCreatingCallBlock) {

                setTimeout(() => {
                  try {
                    if (block && !block.isDisposed()) {
                      block.dispose(false);
                    }
                  } catch (e) {
                    console.warn('Error removing auto-created procedure:', e);
                  }
                }, 10);
              }
            }
          }

          // Error handler
          if (event.type === Blockly.Events.ERROR) {
            console.warn("Blockly error event:", event);
          }
        });

        // Variable management - only create variables when user explicitly interacts with variable field
        // Don't auto-create variables when blocks are dragged from toolbox
        workspace.addChangeListener((event) => {
          // Only handle variable creation on BLOCK_CHANGE when user changes variable field explicitly
          // Skip BLOCK_CREATE events to prevent auto-creation when blocks are dragged from toolbox
          if (event.type === Blockly.Events.BLOCK_CHANGE) {
            const block = workspace.getBlockById(event.blockId);
            // Skip if block is in flyout (toolbox)
            if (block && block.isInFlyout) {
              return;
            }
            // Only create variable if the change is to the VAR field (user explicitly changed it)
            if (event.name === 'VAR' && block && block.getField) {
              const varField = block.getField('VAR');
              if (varField && varField.getValue) {
                const varName = varField.getValue();
                // Skip if varName is empty or invalid
                if (!varName || varName.trim() === '') {
                  return;
                }
                // Get variable ID from field value (could be ID or name)
                let variable;
                try {
                  // Try to get by ID first
                  variable = workspace.getVariableById(varName);
                  // If not found, try by name
                  if (!variable) {
                    variable = workspace.getVariable(varName);
                  }
                  // If still not found, create it (user explicitly set this variable name)
                  if (!variable) {

                    try {
                      workspace.createVariable(varName);
                    } catch (error) {
                      console.error(`Failed to create variable ${varName}:`, error);
                    }
                  }
                } catch (e) {
                  // Ignore errors
                }
              }
            }
          }
          // Completely skip BLOCK_CREATE events for variable creation
        });

        initPhaserGame();
      } catch (error) {
        console.error("Error initializing workspace:", error);
        setCurrentHint("❌ เกิดข้อผิดพลาดในการสร้าง workspace");
      }
    }, 100);
  };

  // Load starter XML when workspace is ready and starter_xml is available
  // Use a ref to track the last loaded XML to avoid reloading the same XML
  const lastLoadedXmlRef = React.useRef(null);

  // Load starter XML when workspace is ready
  useEffect(() => {

    // Check if workspace is ready - but don't require blocklyLoaded to be true
    // because workspace might be ready before blocklyLoaded is set
    if (!workspaceRef.current) {
      return;
    }

    // Only load if starter_xml is different from last loaded
    if (lastLoadedXmlRef.current === starter_xml) {
      return;
    }

    if (starter_xml && typeof starter_xml === 'string' && starter_xml.trim()) {
      // Add a small delay to ensure workspace is fully ready
      setTimeout(() => {
        if (!workspaceRef.current) {
          console.warn('⚠️ Workspace disappeared before loading XML');
          return;
        }

        try {

          // procedures_def* should be registered by imports above; just guard and warn
          if (!Blockly.Blocks['procedures_defreturn'] || !Blockly.Blocks['procedures_defnoreturn']) {
            console.warn('⚠️ procedures_def* not registered even after imports');
          }

          // Helper: ensure variables/args have IDs (for malformed starter XML)
          // Imported from xmlFixers
          let result = ensureVariableIds(starter_xml);

          // Helper: Add mutation to procedure definitions
          // Imported from xmlFixers
          result = addMutationToProcedureDefinitions(result);

          // Use starter_xml as-is; assume ids/mutations already present
          let cleanedStarterXml = result;

          // Check if XML contains any blocks (not just procedure definitions)
          // Starter XML can contain regular blocks without functions
          const hasBlocks = cleanedStarterXml.match(/<block[^>]*type="/);
          if (!hasBlocks) {
            console.warn('⚠️ Starter XML contains no blocks; skipping load');
            return;
          }
          try {
            const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);
            workspaceRef.current.clear();

            // ⚡ Performance: Set flag to skip event processing during XML load
            setXmlLoading(true);

            Blockly.Xml.domToWorkspace(xml, workspaceRef.current);

            setXmlLoading(false);

            lastLoadedXmlRef.current = starter_xml;
          } catch (primaryErr) {
            console.warn('⚠️ Failed to load processed starter XML, retrying raw starter_xml:', primaryErr);
            try {
              const xmlRaw = Blockly.utils.xml.textToDom(starter_xml);
              workspaceRef.current.clear();

              // ⚡ Performance: Set flag to skip event processing
              setXmlLoading(true);

              Blockly.Xml.domToWorkspace(xmlRaw, workspaceRef.current);

              setXmlLoading(false);

              lastLoadedXmlRef.current = starter_xml;
            } catch (rawErr) {
              // Re-enable event processing even on error
              setXmlLoading(false);
              console.error('❌ Failed to load starter XML (raw and processed):', rawErr);
              setCurrentHint('⚠️ ไม่สามารถโหลด starter blocks ได้: ' + (rawErr.message || 'invalid XML'));
              return;
            }
          }





          // CRITICAL: Lock starter blocks so users can't delete/move/rename them
          // This enforces "Guided Learning" where users fill in blanks
          const allBlocks = workspaceRef.current.getAllBlocks(false);
          allBlocks.forEach(block => {
            // 1. Lock movement and deletion
            block.setMovable(false);
            block.setDeletable(false);

            // 2. Lock function renaming/mutation (if it's a definition)
            if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
              block.setEditable(false);
            }
          });

          // If text code is enabled, generate code from starter XML
          if (isTextCodeEnabled && onCodeGenerated) {
            try {
              // Enable Clean Mode
              javascriptGenerator.isCleanMode = true;
              let code = javascriptGenerator.workspaceToCode(workspaceRef.current);
              javascriptGenerator.isCleanMode = false;

              if (code && code.trim()) {
                // Remove auto-generated var declarations specific to Blockly
                // e.g. "var garph, start, goal, path, container, visited, map, node, neighbor;"
                code = code.replace(/^var\s+[\w,\s]+;\n+/, '');


                onCodeGenerated(code);
              }
            } catch (genErr) {
              javascriptGenerator.isCleanMode = false;
              console.error('❌ Failed to generate starter text code:', genErr);
            }
          }

        } catch (xmlError) {
          console.error('⚠️ Error loading starter XML:', xmlError);
          setCurrentHint('⚠️ ไม่สามารถโหลด starter blocks ได้: ' + xmlError.message);
        }
      }, 200); // Small delay to ensure workspace is ready
    } else {
      if (lastLoadedXmlRef.current !== null) {
        lastLoadedXmlRef.current = null;
      }
    }
  }, [starter_xml, blocklyLoaded, setCurrentHint]);

  return { initBlocklyAndPhaser };
}