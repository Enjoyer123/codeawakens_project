/**
 * Hook for Blockly workspace initialization
 */

import React, { useEffect } from 'react';
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
import { javascriptGenerator } from "blockly/javascript";
import {
  createToolboxConfig,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../../gameutils/blockly';
import { defineAllGenerators } from '../../../../gameutils/blockly/core/blocklyGenerators';
import { registerRopePartitionBlocks } from '../../../../gameutils/blockly/algorithms/special/blocklyRopePartition';

// Import refactored modules
import { overrideProcedureBlocks } from './procedureOverrides';
import {
  ensureVariableIds,
  addMutationToProcedureDefinitions,
  fixCallBlocks
} from './xmlFixers';

// Verify and register custom blocks immediately
try {
  registerRopePartitionBlocks();
  console.log('✅ Rope Partition blocks registered');
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
    console.log("initBlocklyAndPhaser called");

    if (!blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      console.log("Early return - missing ref or no enabled blocks");
      return;
    }

    setTimeout(() => {
      try {
        // Clean up existing workspace
        setBlocklyLoaded(false);
        if (workspaceRef.current) {
          console.log("Disposing existing workspace...");
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

        console.log("🔧 Ensuring standard blocks...");
        ensureStandardBlocks();

        // Override BEFORE defining generators
        overrideProcedureBlocks();

        console.log("🔧 Defining JavaScript generators...");
        defineAllGenerators();

        // CRITICAL: Force override procedures_defreturn generator AFTER defineAllGenerators
        // This ensures our custom generator is used, not the default one
        const customProcGen = javascriptGenerator.forBlock["procedures_defreturn"];
        if (customProcGen) {
          javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
          console.log("✅ Force override procedures_defreturn generator");
        }

        // Verify that custom generator was set
        console.log("🔍 Verifying procedures_defreturn generator:", typeof javascriptGenerator.forBlock["procedures_defreturn"]);
        console.log("🔍 Generator is custom:", javascriptGenerator.forBlock["procedures_defreturn"]?.toString().includes('CUSTOM GENERATOR'));

        // Create toolbox
        console.log("🔧 Creating toolbox");
        const toolbox = createToolboxConfig(enabledBlocks);

        // Define Custom Theme (Purple & Dark Blue - Website Brand)
        const rpgTheme = Blockly.Theme.defineTheme('rpg_theme', {
          base: Blockly.Themes.Classic,
          blockStyles: {
            // Midnight Galaxy Palette (Purple/Blue tones)
            "hat_blocks": { "colourPrimary": "#a855f7", "colourSecondary": "#c084fc", "colourTertiary": "#7e22ce" }, // Purple 500/400/700 (Start)
            "logic_blocks": { "colourPrimary": "#8b5cf6", "colourSecondary": "#a78bfa", "colourTertiary": "#7c3aed" }, // Violet 500/400/600 (Logic)
            "loop_blocks": { "colourPrimary": "#6366f1", "colourSecondary": "#818cf8", "colourTertiary": "#4f46e5" }, // Indigo 500/400/600 (Loop)
            "math_blocks": { "colourPrimary": "#06b6d4", "colourSecondary": "#22d3ee", "colourTertiary": "#0891b2" }, // Cyan 500/400/600 (Math)
            "procedure_blocks": { "colourPrimary": "#d946ef", "colourSecondary": "#e879f9", "colourTertiary": "#c026d3" }, // Fuchsia 500/400/600 (Function)
            "list_blocks": { "colourPrimary": "#3b82f6", "colourSecondary": "#60a5fa", "colourTertiary": "#2563eb" }, // Blue 500/400/600 (List)
            "variable_blocks": { "colourPrimary": "#14b8a6", "colourSecondary": "#2dd4bf", "colourTertiary": "#0d9488" } // Teal 500/400/600 (Var)
          },
          componentStyles: {
            "workspaceBackgroundColour": "#1e1b4b", // Deep Indigo/Purple
            "toolboxBackgroundColour": "#2e1065", // Dark Purple 950
            "toolboxForegroundColour": "#ffffff", // White
            "flyoutBackgroundColour": "#2e1065", // Dark Purple 950
            "flyoutForegroundColour": "#ffffff",
            "flyoutOpacity": 0.95,
            "scrollbarColour": "transparent",
            "insertionMarkerColour": "#a855f7", // Purple 500
            "insertionMarkerOpacity": 0.5,
            "scrollbarOpacity": 0, // Hidden as requested
            "cursorColour": "#a855f7" // Purple 500
          },
          fontStyle: {
            "family": "'Press Start 2P', cursive", // Match game font
            "weight": "normal",
            "size": 10
          }
        });

        const workspaceConfig = {
          theme: rpgTheme,
          renderer: 'Thrasos',
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

        console.log("Creating Blockly workspace...");
        const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
        console.log("Blockly workspace created");

        // Override again after workspace creation
        overrideProcedureBlocks(workspace);

        workspaceRef.current = workspace;
        setBlocklyLoaded(true);
        setBlocklyJavaScriptReady(true);

        // Store workspace ready state for useEffect
        window.__blocklyWorkspaceReady = true;

        // Variable Manager
        if (workspace.getVariableMap) {
          const variableMap = workspace.getVariableMap();
          if (variableMap) {
            console.log("Variable Map available");
          }
        }

        ensureCommonVariables(workspace);

        // Note: Starter XML will be loaded in useEffect after workspace is ready

        // CRITICAL: Prevent auto-creation of procedure definitions
        let isCreatingCallBlock = false;

        // ⚡ Performance: Track XML loading state to skip event processing
        let isLoadingXml = false;
        // Store reference to workspace for use in XML loader
        window.__blocklyIsLoadingXml = () => isLoadingXml;
        window.__blocklySetLoadingXml = (value) => { isLoadingXml = value; };

        workspace.addChangeListener((event) => {
          // ⚡ Performance: Skip all processing during XML load
          if (isLoadingXml) {
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
              console.log('📞 Call block created:', event.blockId);

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
                          console.log(`📞 Fixed call block to: ${procedures[0].getName()}`);
                        } else {
                          // Check definition blocks directly
                          const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                            .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                          if (definitionBlocks.length > 0) {
                            const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                            if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                              nameField.setValue(firstDefName);
                              console.log(`📞 Fixed call block using definition: ${firstDefName}`);
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
                console.log('🚫 Auto-created definition detected, removing:', event.blockId);
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
                    console.log(`Creating variable: ${varName}`);
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

        // Initialize Phaser
        console.log("Initializing Phaser game...");
        initPhaserGame();

        console.log("🔍 Workspace created, triggering pattern analysis setup");
        setTimeout(() => {
          console.log("🔍 Forcing pattern analysis setup after workspace creation");
        }, 50);
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
      console.log('⏸️ Waiting for workspace to be ready...', {
        hasWorkspace: !!workspaceRef.current,
        blocklyLoaded
      });
      return;
    }

    // Only load if starter_xml is different from last loaded
    if (lastLoadedXmlRef.current === starter_xml) {
      console.log('⏸️ Starter XML already loaded, skipping...', {
        lastLoadedXml_preview: lastLoadedXmlRef.current ? lastLoadedXmlRef.current.substring(0, 100) : null,
        starter_xml_preview: starter_xml ? starter_xml.substring(0, 100) : null
      });
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
          console.log('📦 Loading starter XML after workspace ready...', {
            starter_xml_length: starter_xml.length,
            hasWorkspace: !!workspaceRef.current,
            workspaceId: workspaceRef.current.id
          });
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
            if (window.__blocklySetLoadingXml) {
              window.__blocklySetLoadingXml(true);
            }

            Blockly.Xml.domToWorkspace(xml, workspaceRef.current);

            if (window.__blocklySetLoadingXml) {
              window.__blocklySetLoadingXml(false);
            }

            lastLoadedXmlRef.current = starter_xml;
          } catch (primaryErr) {
            console.warn('⚠️ Failed to load processed starter XML, retrying raw starter_xml:', primaryErr);
            try {
              const xmlRaw = Blockly.utils.xml.textToDom(starter_xml);
              workspaceRef.current.clear();

              // ⚡ Performance: Set flag to skip event processing
              if (window.__blocklySetLoadingXml) {
                window.__blocklySetLoadingXml(true);
              }

              Blockly.Xml.domToWorkspace(xmlRaw, workspaceRef.current);

              if (window.__blocklySetLoadingXml) {
                window.__blocklySetLoadingXml(false);
              }

              lastLoadedXmlRef.current = starter_xml;
            } catch (rawErr) {
              // Re-enable event processing even on error
              if (window.__blocklySetLoadingXml) {
                window.__blocklySetLoadingXml(false);
              }
              console.error('❌ Failed to load starter XML (raw and processed):', rawErr);
              setCurrentHint('⚠️ ไม่สามารถโหลด starter blocks ได้: ' + (rawErr.message || 'invalid XML'));
              return;
            }
          }

          // Verify that function definitions have parameters after loading
          setTimeout(() => {
            const defBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
              .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));
            defBlocks.forEach(defBlock => {
              try {
                const name = defBlock.getFieldValue('NAME');
                const vars = defBlock.getVars();
                console.log(`🔍 After loading: Function ${name} has ${vars.length} parameters:`, vars);
              } catch (e) {
                console.warn('Error checking function definition:', e);
              }
            });
          }, 100);

          console.log('✅ Starter XML loaded successfully', {
            blockCount: workspaceRef.current.getAllBlocks().length
          });

          // CRITICAL: Fix procedure call blocks immediately after loading starter XML
          // Call imported fixer, passing workspace and setCurrentHint
          fixCallBlocks(workspaceRef.current, setCurrentHint);

          // If text code is enabled, generate code from starter XML
          if (isTextCodeEnabled && onCodeGenerated) {
            console.log('📝 Generating starter text code from XML...');
            try {
              // Enable Clean Mode
              javascriptGenerator.isCleanMode = true;
              let code = javascriptGenerator.workspaceToCode(workspaceRef.current);
              javascriptGenerator.isCleanMode = false;

              if (code && code.trim()) {
                // Remove auto-generated var declarations specific to Blockly
                // e.g. "var garph, start, goal, path, container, visited, map, node, neighbor;"
                code = code.replace(/^var\s+[\w,\s]+;\n+/, '');

                console.log('✅ Generated starter code length (Clean):', code.length);
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
      // Reset ref if no starter_xml
      if (lastLoadedXmlRef.current !== null) {
        lastLoadedXmlRef.current = null;
      }
      console.log('ℹ️ No starter XML provided for this level:', {
        starter_xml: starter_xml,
        isString: typeof starter_xml === 'string',
        trimmed: starter_xml && typeof starter_xml === 'string' ? starter_xml.trim() : null
      });
    }
  }, [starter_xml, blocklyLoaded, setCurrentHint]);

  return { initBlocklyAndPhaser };
}