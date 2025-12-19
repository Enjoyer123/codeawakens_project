/**
 * Hook for Blockly workspace initialization
 */

import React, { useEffect } from 'react';
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
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
          // First, try to fix the procedure name if it's invalid
          const nameField = this.getField('NAME');
          if (nameField) {
            const currentName = nameField.getValue();
            const blockWorkspace = this.workspace;
            
            if (blockWorkspace) {
              // Get all definition blocks
              const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));
              
              // Get valid procedure names
              const validProcedureNames = new Set();
              definitionBlocks.forEach(defBlock => {
                try {
                  const name = defBlock.getFieldValue('NAME');
                  if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                    validProcedureNames.add(name);
                  }
                } catch (e) {
                  // Ignore errors
                }
              });
              
              // If current name doesn't match any definition, fix it
              if (currentName && !validProcedureNames.has(currentName) && validProcedureNames.size > 0) {
                // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                  const baseName = validName.replace(/\d+$/, '');
                  const currentBaseName = currentName.replace(/\d+$/, '');
                  return baseName === currentBaseName && currentName !== validName;
                });
                
                if (isNumberedVariant) {
                  // Find the matching base procedure
                  const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                    const baseName = validName.replace(/\d+$/, '');
                    const currentBaseName = currentName.replace(/\d+$/, '');
                    return baseName === currentBaseName;
                  });
                  
                  if (matchingProcedure) {
                    console.log(`🔧 Fixing call block name in getProcedureDef: "${currentName}" -> "${matchingProcedure}"`);
                    nameField.setValue(matchingProcedure);
                  }
                } else {
                  // Use the first valid procedure name
                  const firstValidName = Array.from(validProcedureNames)[0];
                  console.log(`🔧 Fixing call block name in getProcedureDef: "${currentName}" -> "${firstValidName}"`);
                  nameField.setValue(firstValidName);
                }
              }
            }
          }
          
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
        const blockWorkspace = this.workspace;
        if (!blockWorkspace) {
          // Call original if workspace not available
          if (originalOnchange) {
            try {
              originalOnchange.call(this, changeEvent);
            } catch (e) {
              console.warn(`[${blockType}] onchange error:`, e);
            }
          }
          return;
        }
        
        try {
          const nameField = this.getField('NAME');
          if (nameField) {
            const currentName = nameField.getValue();
            
            // Get all definition blocks to find valid procedure names
            const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
              .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));
            
            const validProcedureNames = new Set();
            definitionBlocks.forEach(defBlock => {
              try {
                const name = defBlock.getFieldValue('NAME');
                if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                  validProcedureNames.add(name);
                }
              } catch (e) {
                // Ignore errors
              }
            });
            
            // Fix procedure name if needed
            if (validProcedureNames.size > 0) {
              if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                // Invalid name - use first valid procedure
                const firstValidName = Array.from(validProcedureNames)[0];
                nameField.setValue(firstValidName);
                console.log(`[${blockType}] Fixed invalid name to: ${firstValidName}`);
              } else if (!validProcedureNames.has(currentName)) {
                // Current name doesn't match any definition
                // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                  const baseName = validName.replace(/\d+$/, '');
                  const currentBaseName = currentName.replace(/\d+$/, '');
                  return baseName === currentBaseName && currentName !== validName;
                });
                
                if (isNumberedVariant) {
                  // Find the matching base procedure
                  const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                    const baseName = validName.replace(/\d+$/, '');
                    const currentBaseName = currentName.replace(/\d+$/, '');
                    return baseName === currentBaseName;
                  });
                  
                  if (matchingProcedure) {
                    console.log(`[${blockType}] Fixed numbered variant: "${currentName}" -> "${matchingProcedure}"`);
                    nameField.setValue(matchingProcedure);
                  }
                } else {
                  // Use the first valid procedure name
                  const firstValidName = Array.from(validProcedureNames)[0];
                  console.log(`[${blockType}] Fixed non-matching name: "${currentName}" -> "${firstValidName}"`);
                  nameField.setValue(firstValidName);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`[${blockType}] Error in onchange:`, e);
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
                  const definitionBlocks = blockWorkspace.getBlocksByType('procedures_defreturn', false)
                    .concat(blockWorkspace.getBlocksByType('procedures_defnoreturn', false));
                  if (definitionBlocks.length > 0) {
                    const firstDefName = definitionBlocks[0].getFieldValue('NAME');
                    if (firstDefName && firstDefName !== 'unnamed' && firstDefName !== 'undefined') {
                      nameField.setValue(firstDefName);
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
  initPhaserGame,
  starter_xml = null,
  blocklyLoaded = false
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
  
  // Helper: ensure variables/args have IDs (for malformed starter XML without ids/varids)
  const ensureVariableIds = (xmlString) => {
    if (!xmlString || typeof xmlString !== 'string') return xmlString;
    let counter = 0;
    // Add id to <variable> if missing
    let result = xmlString.replace(/<variable(?![^>]*\sid=")([^>]*)>([^<]+)<\/variable>/g, (_m, attrs, name) => {
      const newId = `auto_var_${counter++}`;
      return `<variable id="${newId}"${attrs}>${name}</variable>`;
    });
    // Add varid to <arg> in mutation if missing
    result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")([^>]*)>/g, (_m, name, attrs) => {
      const newId = `auto_arg_${counter++}_${name}`;
      const extra = attrs && attrs.trim() ? ` ${attrs.trim()}` : '';
      return `<arg name="${name}" varid="${newId}"${extra}>`;
    });
    // Handle self-closing arg without varid
    result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")[^>]*\/>/g, (_m, name) => {
      const newId = `auto_arg_${counter++}_${name}`;
      return `<arg name="${name}" varid="${newId}"></arg>`;
    });
    return result;
  };

  // Debug: Log starter_xml prop
  console.log('🔍 [useBlocklySetup] starter_xml prop:', {
    has_starter_xml: !!starter_xml,
    starter_xml_type: typeof starter_xml,
    starter_xml_length: starter_xml ? starter_xml.length : 0,
    starter_xml_preview: starter_xml ? starter_xml.substring(0, 100) : null,
    lastLoadedXml: lastLoadedXmlRef.current ? lastLoadedXmlRef.current.substring(0, 100) : null
  });
  
  // Load starter XML when workspace is ready
  useEffect(() => {
    console.log('🔍 [useBlocklySetup] useEffect triggered for starter XML:', {
      has_starter_xml: !!starter_xml,
      has_workspace: !!workspaceRef.current,
      blocklyLoaded,
      lastLoadedXml: lastLoadedXmlRef.current ? 'exists' : 'null',
      starter_xml_preview: starter_xml ? starter_xml.substring(0, 100) : null
    });
    
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
          const ensureVariableIds = (xmlString) => {
            if (!xmlString || typeof xmlString !== 'string') return xmlString;
            let counter = 0;
            // Add id to <variable> if missing
            let result = xmlString.replace(/<variable(?![^>]*\sid=")([^>]*)>([^<]+)<\/variable>/g, (_m, attrs, name) => {
              const newId = `auto_var_${counter++}`;
              return `<variable id="${newId}"${attrs}>${name}</variable>`;
            });
            // Add varid to <arg> in mutation if missing
            result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")([^>]*)>/g, (_m, name, attrs) => {
              const newId = `auto_arg_${counter++}_${name}`;
              const extra = attrs && attrs.trim() ? ` ${attrs.trim()}` : '';
              return `<arg name="${name}" varid="${newId}"${extra}>`;
            });
            // Handle self-closing arg without varid
            result = result.replace(/<arg\s+name="([^"]+)"(?![^>]*\svarid=")[^>]*\/>/g, (_m, name) => {
              const newId = `auto_arg_${counter++}_${name}`;
              return `<arg name="${name}" varid="${newId}"></arg>`;
            });
            return result;
          };
          
          // Helper function: Add mutation to procedure definition blocks that don't have it
          // This fixes the issue where starter XML has call blocks with parameters but definition blocks don't
          // Use string manipulation instead of DOM to avoid serialization issues
          const addMutationToProcedureDefinitions = (xmlString) => {
            if (!xmlString) return xmlString;
            
            try {
              // First, extract parameters from call blocks using regex
              const callBlockRegex = /<block[^>]*type="procedures_call(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g;
              const callBlocks = xmlString.match(callBlockRegex) || [];
              const procedureParams = new Map();
              
              callBlocks.forEach(callBlockXml => {
                try {
                  const nameMatch = callBlockXml.match(/<field name="NAME">([^<]+)<\/field>/);
                  const name = nameMatch ? nameMatch[1] : null;
                  
                  if (name) {
                    const mutationMatch = callBlockXml.match(/<mutation[^>]*>([\s\S]*?)<\/mutation>/);
                    if (mutationMatch) {
                      const mutationContent = mutationMatch[1];
                      const argsMatch = mutationContent.match(/<arg[^>]*name="([^"]+)"/g);
                      if (argsMatch && argsMatch.length > 0) {
                        const paramNames = argsMatch.map(m => {
                          const nameMatch = m.match(/name="([^"]+)"/);
                          return nameMatch ? nameMatch[1] : null;
                        }).filter(Boolean);
                        if (paramNames.length > 0) {
                          procedureParams.set(name, paramNames);
                          console.log(`🔍 Found parameters for ${name} from call block in XML:`, paramNames);
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.warn('Error extracting parameters from call block:', e);
                }
              });
              
              console.log(`🔍 Total procedures with parameters found: ${procedureParams.size}`);
              
              if (procedureParams.size === 0) {
                return xmlString; // No parameters to add
              }
              
              // Now find definition blocks and add mutations using string replacement
              let result = xmlString;
              
              procedureParams.forEach((params, name) => {
                // Find definition block for this procedure
                const defBlockRegex = new RegExp(
                  `(<block[^>]*type="procedures_def(return|noreturn)"[^>]*>\\s*<field name="NAME">${name}<\\/field>)`,
                  'g'
                );
                
                result = result.replace(defBlockRegex, (match, fieldPart) => {
                  // Check if mutation already exists
                  if (match.includes('<mutation')) {
                    console.log(`⚠️ Function ${name} already has mutation, skipping`);
                    return match;
                  }
                  
                  // Build mutation XML string
                  const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                  const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;
                  
                  // Insert mutation after NAME field
                  const newBlock = fieldPart + mutationXml;
                  console.log(`✅ Added mutation to function definition ${name} with ${params.length} params:`, params);
                  
                  return newBlock;
                });
              });
              
              // Verify mutations were added
              console.log('🔍 Checking processed XML for mutations...');
              const defBlocksAfter = result.match(/<block[^>]*type="procedures_def(return|noreturn)"[^>]*>[\s\S]*?<\/block>/g);
              if (defBlocksAfter) {
                defBlocksAfter.forEach(blockXml => {
                  const hasMutation = blockXml.includes('<mutation');
                  const nameMatch = blockXml.match(/<field name="NAME">([^<]+)<\/field>/);
                  const name = nameMatch ? nameMatch[1] : 'unknown';
                  if (hasMutation) {
                    const mutationMatch = blockXml.match(/<mutation[^>]*>([\s\S]*?)<\/mutation>/);
                    if (mutationMatch) {
                      const mutationContent = mutationMatch[1];
                      const argsMatch = mutationContent.match(/<arg[^>]*name="([^"]+)"/g);
                      const paramNames = argsMatch ? argsMatch.map(m => {
                        const nameMatch = m.match(/name="([^"]+)"/);
                        return nameMatch ? nameMatch[1] : null;
                      }).filter(Boolean) : [];
                      console.log(`✅ Function ${name} in processed XML has mutation with ${paramNames.length} params:`, paramNames);
                    }
                  } else {
                    console.log(`❌ Function ${name} in processed XML has NO mutation`);
                  }
                });
              }
              
              return result;
            } catch (e) {
              console.error('Error processing XML to add mutations:', e);
              return xmlString; // Return original if error
            }
          };
          
          // Use starter_xml as-is; assume ids/mutations already present
          let cleanedStarterXml = starter_xml;
          
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
            Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
            lastLoadedXmlRef.current = starter_xml;
          } catch (primaryErr) {
            console.warn('⚠️ Failed to load processed starter XML, retrying raw starter_xml:', primaryErr);
            try {
              const xmlRaw = Blockly.utils.xml.textToDom(starter_xml);
              workspaceRef.current.clear();
              Blockly.Xml.domToWorkspace(xmlRaw, workspaceRef.current);
              lastLoadedXmlRef.current = starter_xml;
            } catch (rawErr) {
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
          // This prevents Blockly from auto-creating new procedure definitions with wrong names
          // Use multiple attempts with increasing delays to catch all cases
          const fixCallBlocks = (attempt = 1, maxAttempts = 3) => {
            setTimeout(() => {
              try {
                const definitionBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                  .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));
                
                const callBlocks = workspaceRef.current.getBlocksByType('procedures_callreturn', false)
                  .concat(workspaceRef.current.getBlocksByType('procedures_callnoreturn', false));
                
                // CRITICAL: Extract parameters from call blocks to add to definition blocks
                // This fixes the issue where starter XML has call blocks with parameters but definition blocks don't
                const procedureParams = new Map(); // procedureName -> array of parameter names
                callBlocks.forEach(callBlock => {
                  try {
                    const callName = callBlock.getFieldValue('NAME');
                    if (callName && callName !== 'unnamed' && callName !== 'undefined') {
                      // Get parameters from call block's mutation
                      const mutation = callBlock.mutationToDom ? callBlock.mutationToDom() : null;
                      if (mutation) {
                        const args = mutation.querySelectorAll('arg');
                        const paramNames = Array.from(args).map(arg => arg.getAttribute('name')).filter(Boolean);
                        if (paramNames.length > 0) {
                          procedureParams.set(callName, paramNames);
                          console.log(`🔍 Found parameters for ${callName} from call block:`, paramNames);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('Error extracting parameters from call block:', e);
                  }
                });
                
                // Get valid procedure names from definitions
                const validProcedureNames = new Set();
                definitionBlocks.forEach(defBlock => {
                  try {
                    const name = defBlock.getFieldValue('NAME');
                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                      validProcedureNames.add(name);
                      
                      // CRITICAL: Check if function definition has parameters
                      // Priority: Use parameters from call blocks if available, otherwise check function body
                      const vars = defBlock.getVars();
                      console.log(`🔍 Function ${name} has ${vars.length} parameters:`, vars);
                      
                      let paramsToAdd = [];
                      
                      // First, try to get parameters from call blocks
                      if (procedureParams.has(name)) {
                        paramsToAdd = procedureParams.get(name);
                        console.log(`🔍 Found parameters for ${name} from call blocks:`, paramsToAdd);
                      } else if (vars.length === 0) {
                        // If no parameters from call blocks, check function body
                        const allBlocks = defBlock.getDescendants(false);
                        const usedVars = new Set();
                        
                        allBlocks.forEach(block => {
                          try {
                            // Check for variables_get blocks
                            if (block.type === 'variables_get') {
                              const varName = block.getFieldValue('VAR');
                              if (varName && ['start', 'goal', 'garph', 'graph'].includes(varName)) {
                                usedVars.add(varName);
                              }
                            }
                          } catch (e) {
                            // Ignore errors
                          }
                        });
                        
                        if (usedVars.size > 0) {
                          // Add parameters to function definition
                          // Order: garph/graph, start, goal
                          if (usedVars.has('garph') || usedVars.has('graph')) {
                            paramsToAdd.push('garph');
                          }
                          if (usedVars.has('start')) {
                            paramsToAdd.push('start');
                          }
                          if (usedVars.has('goal')) {
                            paramsToAdd.push('goal');
                          }
                          console.log(`🔍 Function ${name} uses variables but has no parameters:`, Array.from(usedVars));
                        }
                      }
                      
                      // Add parameters if needed
                      if (paramsToAdd.length > 0 && vars.length === 0) {
                        console.log(`🔧 Adding parameters to function ${name}:`, paramsToAdd);
                        
                        // Add parameters using Blockly's mutation API
                        try {
                          // Get current mutation or create new one
                          let mutation = null;
                          if (defBlock.mutationToDom) {
                            mutation = defBlock.mutationToDom();
                          }
                          
                          // Create new mutation if needed
                          if (!mutation) {
                            const parser = new DOMParser();
                            mutation = parser.parseFromString(`<mutation name="${name}"></mutation>`, 'text/xml').documentElement;
                          } else {
                            // Update name in existing mutation
                            mutation.setAttribute('name', name);
                          }
                          
                          // Remove existing arg elements
                          const existingArgs = mutation.querySelectorAll('arg');
                          existingArgs.forEach(arg => arg.remove());
                          
                          // Add new arg elements for each parameter
                          paramsToAdd.forEach(paramName => {
                            const arg = mutation.ownerDocument.createElement('arg');
                            arg.setAttribute('name', paramName);
                            mutation.appendChild(arg);
                          });
                          
                          // Apply mutation to block
                          if (defBlock.domToMutation) {
                            defBlock.domToMutation(mutation);
                          }
                          
                          // Update function shape
                          if (defBlock.updateShape_) {
                            defBlock.updateShape_();
                          }
                          
                          console.log(`✅ Added parameters to function ${name}:`, paramsToAdd);
                          console.log(`✅ Function ${name} now has ${defBlock.getVars().length} parameters:`, defBlock.getVars());
                        } catch (e) {
                          console.error(`Error adding parameters to function ${name}:`, e);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('Error processing definition block:', e);
                  }
                });
                
                console.log(`🔧 Fixing call blocks after starter XML load (attempt ${attempt}):`, {
                  validProcedures: Array.from(validProcedureNames),
                  callBlocksCount: callBlocks.length,
                  definitionNames: definitionBlocks.map(b => {
                    try {
                      return b.getFieldValue('NAME');
                    } catch (e) {
                      return 'error';
                    }
                  }),
                  callBlockNames: callBlocks.map(b => {
                    try {
                      return b.getFieldValue('NAME');
                    } catch (e) {
                      return 'error';
                    }
                  })
                });
                
                let fixedCount = 0;
                
                // Fix each call block to use a valid procedure name
                callBlocks.forEach(callBlock => {
                  try {
                    const nameField = callBlock.getField('NAME');
                    if (nameField) {
                      const currentName = nameField.getValue();
                      
                      // If call block name doesn't match any definition, fix it
                      if (!validProcedureNames.has(currentName)) {
                        if (validProcedureNames.size > 0) {
                          // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                          const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                            const baseName = validName.replace(/\d+$/, '');
                            const currentBaseName = currentName.replace(/\d+$/, '');
                            return baseName === currentBaseName && currentName !== validName;
                          });
                          
                          if (isNumberedVariant) {
                            // Find the matching base procedure
                            const matchingProcedure = Array.from(validProcedureNames).find(validName => {
                              const baseName = validName.replace(/\d+$/, '');
                              const currentBaseName = currentName.replace(/\d+$/, '');
                              return baseName === currentBaseName;
                            });
                            
                            if (matchingProcedure) {
                              nameField.setValue(matchingProcedure);
                              console.log(`✅ Fixed call block (numbered variant): "${currentName}" -> "${matchingProcedure}"`);
                              fixedCount++;
                            }
                          } else {
                            // Use the first valid procedure name (should be "DFS" from starter XML)
                            const firstValidName = Array.from(validProcedureNames)[0];
                            nameField.setValue(firstValidName);
                            console.log(`✅ Fixed call block: "${currentName}" -> "${firstValidName}"`);
                            fixedCount++;
                          }
                        }
                      } else {
                        console.log(`✅ Call block already uses correct name: "${currentName}"`);
                      }
                    }
                  } catch (e) {
                    console.warn('Error fixing call block:', e);
                  }
                });
                
                // Remove any auto-created procedure definitions that don't match valid names
                definitionBlocks.forEach(defBlock => {
                  try {
                    const defName = defBlock.getFieldValue('NAME');
                    if (defName && !validProcedureNames.has(defName)) {
                      // This definition doesn't match any call block - it was likely auto-created
                      // Check if it's a numbered variant (e.g., DFS2, DFS3) of a valid procedure
                      const isNumberedVariant = Array.from(validProcedureNames).some(validName => {
                        const baseName = validName.replace(/\d+$/, '');
                        const defBaseName = defName.replace(/\d+$/, '');
                        return baseName === defBaseName && defName !== validName;
                      });
                      
                      if (isNumberedVariant) {
                        console.log(`🗑️ Removing auto-created numbered variant: "${defName}"`);
                        if (!defBlock.isDisposed()) {
                          defBlock.dispose(false);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('Error checking definition block:', e);
                  }
                });
                
                // If we fixed blocks or this is the first attempt, try again with longer delay
                if (fixedCount > 0 && attempt < maxAttempts) {
                  console.log(`🔄 Fixed ${fixedCount} call blocks, retrying in case more need fixing...`);
                  fixCallBlocks(attempt + 1, maxAttempts);
                }
              } catch (e) {
                console.warn('Error fixing call blocks after starter XML:', e);
              }
            }, attempt === 1 ? 100 : attempt * 200); // Increasing delays: 100ms, 400ms, 600ms
          };
          
          fixCallBlocks(); // Start first attempt
          
          setCurrentHint('✅ โหลด starter blocks แล้ว');
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