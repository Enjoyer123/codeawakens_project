/**
 * Hook for Blockly workspace initialization
 */

import * as Blockly from "blockly/core";
import {
  createToolboxConfig,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../gameutils/utils/blocklyUtils';
import { defineAllGenerators } from '../../../gameutils/utils/blockly/blocklyGenerators';

/**
 * Override procedure blocks to prevent auto-creation of definitions
 */
function overrideProcedureBlocks(workspace = null) {
  console.debug("🔧 Overriding procedure blocks...");
  
        // Override procedure definition blocks
        ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
          const blockDef = Blockly.Blocks[blockType];
          if (!blockDef) {
            console.debug(`[useBlocklySetup] ${blockType} block not found, skipping`);
            return;
          }

          // Avoid double-overriding
    if (blockDef.__overridden) {
            return;
          }

          console.debug(`[useBlocklySetup] Overriding ${blockType}...`);
          const originalRename = blockDef.renameProcedure;
          const originalLoadExtraState = blockDef.loadExtraState;
    const originalInit = blockDef.init;

    // CRITICAL: Override init to fix call block names
    if (originalInit) {
      blockDef.init = function() {
        // Call original init first
        originalInit.call(this);
        
        // After init, fix any call blocks that were auto-created with wrong names
        setTimeout(() => {
          if (!this.workspace || this.isDisposed()) return;
          
          const definitionName = this.getFieldValue('NAME');
          if (!definitionName || definitionName === 'unnamed' || definitionName === 'undefined') {
            return;
          }
          
          console.log(`✅ Procedure definition created with name: ${definitionName}`);
          
          // Find all call blocks and fix those with "unnamed" to use this definition's name
          const allCallBlocks = this.workspace.getBlocksByType('procedures_callreturn', false)
            .concat(this.workspace.getBlocksByType('procedures_callnoreturn', false));
          
          allCallBlocks.forEach(callBlock => {
            const nameField = callBlock.getField('NAME');
            if (nameField) {
              const currentValue = nameField.getValue();
              // Fix if unnamed or undefined
              if (!currentValue || currentValue === 'unnamed' || currentValue === 'undefined' || currentValue.trim() === '') {
                nameField.setValue(definitionName);
                console.log(`✅ Fixed call block to use: ${definitionName}`);
              }
            }
          });
        }, 50);
      };
    }

          // Override renameProcedure
          blockDef.renameProcedure = function(oldName, newName) {
            if (oldName == null || newName == null) {
              return;
            }
            if (originalRename) {
              try {
                return originalRename.call(this, String(oldName).trim(), String(newName).trim());
              } catch (e) {
                console.error(`[${blockType}] renameProcedure error:`, e);
              }
            }
          };

    // Override loadExtraState
          blockDef.loadExtraState = function(state) {
            try {
              if (!state || typeof state !== 'object') {
                state = {};
              }

              let safeName = 'function';
              if (state.name && typeof state.name === 'string') {
                const trimmedName = state.name.trim();
                if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
                  safeName = trimmedName;
                }
              }

              const safeParams = Array.isArray(state.params) ? state.params : [];

              try {
                if (this.getField && typeof this.getField === 'function') {
                  const nameField = this.getField('NAME');
                  if (nameField && typeof nameField.setValue === 'function') {
                    nameField.setValue(safeName);
                  }
                }
              } catch (e) {
                console.error(`[${blockType}] loadExtraState: error setting name field:`, e);
              }

              if (originalLoadExtraState) {
                try {
                  return originalLoadExtraState.call(this, state);
                } catch (e) {
                  console.error(`[${blockType}] original loadExtraState error:`, e);
                }
              }

              return { name: safeName, params: safeParams };
            } catch (e) {
              console.error(`[${blockType}] loadExtraState error:`, e);
              return { name: 'function', params: [] };
            }
          };

    blockDef.__overridden = true;
        });
        
  // Override procedure call blocks - CRITICAL: Prevent auto-creation
        ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
    const blockDef = Blockly.Blocks[blockType];
    if (!blockDef) return;
    
    if (blockDef.__overridden) return;

    console.debug(`[useBlocklySetup] Overriding ${blockType}...`);
    
    // Store original methods
    const originalRename = blockDef.renameProcedure;
    const originalGetProcedureDef = blockDef.getProcedureDef;
    const originalOnchange = blockDef.onchange;
    
    // Override renameProcedure
            if (originalRename) {
      blockDef.renameProcedure = function(oldName, newName) {
        if (oldName == null || newName == null) return;
                try {
                  const safeOldName = String(oldName).trim();
                  const safeNewName = String(newName).trim();
          if (!safeOldName || !safeNewName) return;
                  return originalRename.call(this, safeOldName, safeNewName);
                } catch (e) {
                  console.error(`[${blockType}] renameProcedure error:`, e);
                }
              };
            }
            
    // Override getProcedureDef to return procedure if exists, null if not
    // This prevents auto-creation but allows normal operation
    if (originalGetProcedureDef) {
      blockDef.getProcedureDef = function() {
        try {
          // Call original to get procedure definition
          const def = originalGetProcedureDef.call(this);
          return def; // Return the definition if it exists, null if not
        } catch (e) {
          // If error, return null to prevent crashes
          console.warn(`[${blockType}] getProcedureDef error:`, e);
          return null;
        }
      };
    }
    
    // Override onchange to prevent auto-creating definitions when block is created
    if (originalOnchange) {
      blockDef.onchange = function(changeEvent) {
        // If this is a BLOCK_CREATE event, set procedure name BEFORE calling original
        if (changeEvent && changeEvent.type === Blockly.Events.BLOCK_CREATE) {
          const blockWorkspace = this.workspace;
          if (blockWorkspace) {
                try {
                  const nameField = this.getField('NAME');
                  if (nameField) {
                const currentName = nameField.getValue();
                
                // If value is "unnamed" or invalid, try to fix it IMMEDIATELY
                if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                  // Get available procedures
                  const procedureMap = blockWorkspace.getProcedureMap();
                  if (procedureMap) {
                    const procedures = procedureMap.getProcedures();
                    if (procedures.length > 0) {
                      // Set to first available procedure BEFORE calling original onchange
                      nameField.setValue(procedures[0].getName());
                      console.log(`[${blockType}] Fixed unnamed value to: ${procedures[0].getName()}`);
                    } else {
                      // Check definition blocks directly
                      const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                        .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));
                      if (definitionBlocks.length > 0) {
                        const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                        if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                          nameField.setValue(firstDefName);
                          console.log(`[${blockType}] Fixed unnamed value using definition block: ${firstDefName}`);
                        } else {
                          // If definition name is invalid, set a temporary value to prevent error
                          nameField.setValue('temp_procedure');
                          console.log(`[${blockType}] Set temporary name to prevent error`);
                        }
                      } else {
                        // No procedures or definitions, set temporary value to prevent error
                        nameField.setValue('temp_procedure');
                        console.log(`[${blockType}] No procedures found, set temporary name`);
                      }
                    }
                  } else {
                    // No procedure map, set temporary value
                    nameField.setValue('temp_procedure');
                    console.log(`[${blockType}] No procedure map, set temporary name`);
                  }
                }
              }
            } catch (e) {
              console.warn(`[${blockType}] Error in onchange:`, e);
            }
          }
        }
        
        // Call original onchange - it will use the name we just set
        if (originalOnchange) {
          try {
            originalOnchange.call(this, changeEvent);
          } catch (e) {
            console.warn(`[${blockType}] onchange error:`, e);
            // If error occurs, try to fix the name again
            try {
              const nameField = this.getField('NAME');
              if (nameField) {
                const blockWorkspace = this.workspace;
                if (blockWorkspace) {
                  const procedureMap = blockWorkspace.getProcedureMap();
                  if (procedureMap) {
                    const procedures = procedureMap.getProcedures();
                    if (procedures.length > 0) {
                      nameField.setValue(procedures[0].getName());
                    }
                  }
                }
              }
            } catch (fixError) {
              console.warn(`[${blockType}] Error fixing name after onchange error:`, fixError);
            }
          }
        }
      };
    }
    
    blockDef.__overridden = true;
  });
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
  initPhaserGame
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

        // Create toolbox
        console.log("🔧 Creating toolbox");
        const toolbox = createToolboxConfig(enabledBlocks);

        const workspaceConfig = {
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
          scrollbars: true,
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

        // Variable Manager
        if (workspace.getVariableMap) {
          const variableMap = workspace.getVariableMap();
          if (variableMap) {
            console.log("Variable Map available");
          }
        }

        ensureCommonVariables(workspace);

        // CRITICAL: Prevent auto-creation of procedure definitions
        let isCreatingCallBlock = false;
        
        workspace.addChangeListener((event) => {
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

        // Variable management
        workspace.addChangeListener((event) => {
          if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE) {
            const block = workspace.getBlockById(event.blockId);
            if (block && block.getField) {
              const varField = block.getField('VAR');
              if (varField && varField.getValue) {
                const varName = varField.getValue();
                const variable = workspace.getVariable(varName);
                if (!variable) {
                  console.log(`Creating variable: ${varName}`);
                  try {
                    workspace.createVariable(varName);
                  } catch (error) {
                    console.error(`Failed to create variable ${varName}:`, error);
                  }
                }
              }
            }
          }
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

  return { initBlocklyAndPhaser };
}