import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import {
  createToolboxConfig,
  defineAllBlocks,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../gameutils/blockly';
import { fetchLevelById, updateLevel } from '../../../services/levelService';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const StarterCreateEdit = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const blocklyRef = useRef(null);
  const workspaceRef = useRef(null);
  const isFirstXmlLoad = useRef(true);
  const isXmlLoadingRef = useRef(false);
  const cleanupDuplicateProceduresRef = useRef(null);
  const skipCleanupRef = useRef(false);
  const lastProcedureNameRef = useRef('');
  const defaultProcedureName = 'DFS';
  const starterXmlLoadedRef = useRef(false); // Track if starter XML has been loaded
  // Ref สำหรับ debouncing cleanup ใน event listener
  const cleanupTimeoutRef = useRef(null);

  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocklyProcessing, setBlocklyProcessing] = useState(true); // Track Blockly processing state

  // Suppress Blockly deprecation warnings
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = function (...args) {
      const message = args.join(' ');
      if (message.includes('createVariable was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().createVariable instead') ||
        message.includes('getAllVariables was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().getAllVariables instead') ||
        message.includes('Blockly.Workspace.getAllVariables was deprecated') ||
        message.includes('getVariable was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().getVariable instead') ||
        message.includes('Blockly.Workspace.getVariable was deprecated') ||
        message.includes('getVariableById was deprecated') ||
        message.includes('Use Blockly.Workspace.getVariableMap().getVariableById instead') ||
        message.includes('Blockly.Workspace.getVariableById was deprecated')) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Helper: โหลด XML เข้า workspace
  const loadXmlDomSafely = (xmlDom) => {
    if (!workspaceRef.current || !xmlDom) return;
    isXmlLoadingRef.current = true;
    try {
      Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
    } finally {
      // ใช้ polling ตรวจสอบว่า blocks พร้อมแล้ว แทนการใช้ fixed delay
      let checkCount = 0;
      const maxChecks = 30; // สูงสุด 30 ครั้ง (3 วินาที) เป็น fallback
      
      const checkAndCleanup = () => {
        checkCount++;
        
        if (!workspaceRef.current) {
          isXmlLoadingRef.current = false;
          return;
        }
        
        const allBlocks = workspaceRef.current.getAllBlocks(false);
        const callBlocks = allBlocks.filter(b => 
          (b.type === 'procedures_callreturn' || b.type === 'procedures_callnoreturn') &&
          !b.isInFlyout && !b.isDisposed()
        );
        
        // ตรวจสอบว่าทุก call block มีชื่อแล้ว
        const allReady = callBlocks.length === 0 || callBlocks.every(cb => {
          try {
            const name = cb.getFieldValue('NAME');
            const hasName = name && name !== 'unnamed' && name !== 'undefined' && name.trim();
            const hasField = cb.getField('NAME') !== null;
            return hasName && hasField && !cb.isDisposed();
          } catch (e) { 
            return false; 
          }
        });
        
        if (allReady || checkCount >= maxChecks) {
          // Blocks พร้อมแล้ว หรือถึงเวลาสูงสุดแล้ว - ทำ cleanup
          isXmlLoadingRef.current = false;
          
          if (cleanupDuplicateProceduresRef.current) {
            cleanupDuplicateProceduresRef.current();
          }
        } else {
          // ยังไม่พร้อม - ตรวจสอบอีกครั้งเร็วๆ (ลดจาก 100ms เป็น 50ms)
          setTimeout(checkAndCleanup, 50);
        }
      };
      
      // เริ่มตรวจสอบทันที (ใช้ requestAnimationFrame เพื่อให้แน่ใจว่า DOM พร้อม)
      requestAnimationFrame(() => {
        setTimeout(checkAndCleanup, 0);
      });
    }
  };

  // Load level data
  useEffect(() => {
    const loadLevelData = async () => {
      try {
        setLoading(true);
        setError(null);
        const levelResponse = await fetchLevelById(getToken, levelId);

        if (!levelResponse || !levelResponse.level_id) {
          throw new Error('ไม่พบข้อมูลด่าน');
        }

        setLevelData(levelResponse);

        // Get enabled blocks
        const enabledBlocksObj = {};
        (levelResponse.level_blocks || []).forEach((blockInfo) => {
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
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลด่าน: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
      } finally {
        setLoading(false);
      }
    };

    loadLevelData();
  }, [levelId, getToken]);

  // Initialize Blockly workspace
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

      // Helper function to clean up duplicate procedure definitions
      const cleanupDuplicateProcedures = () => {
        if (skipCleanupRef.current || isXmlLoadingRef.current) {
          return;
        }

        try {
          const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
            .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

          if (definitionBlocks.length === 0) {
            return;
          }

          const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
            .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

          // CRITICAL: Check if there are unnamed call blocks - skip cleanup if found
          // This gives time for names to be set before cleanup runs
          const hasUnnamedCall = callBlocks.some(cb => {
            try {
              const n = cb.getFieldValue('NAME');
              return !n || n === 'unnamed' || n === 'undefined' || !n.trim();
            } catch (e) {
              return false;
            }
          });

          if (hasUnnamedCall) {
            // Wait a bit more for names to be set
            return;
          }

          // Helper to check if procedure has callers using Blockly API
          const hasCallers = (name) => {
            try {
              const callers = Blockly.Procedures.getCallers(name || '', workspace) || [];
              return callers.length > 0;
            } catch (e) {
              return false;
            }
          };

          // Get names of procedures that are actually being called
          const calledProcedureNames = new Set();
          callBlocks.forEach(callBlock => {
            try {
              const name = callBlock.getFieldValue('NAME');
              if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                calledProcedureNames.add(name);
              }
            } catch (e) { }
          });

          // Group by procedure name - keep first occurrence of each name
          const validProcedures = new Map();

          definitionBlocks.forEach(defBlock => {
            try {
              const name = defBlock.getFieldValue('NAME');

              // Remove blocks with invalid names (if not being used)
              if (!name || name === 'unnamed' || name === 'undefined' || name.trim() === '') {
                const isBeingUsed = calledProcedureNames.has(name) || hasCallers(name);
                if (!isBeingUsed && !defBlock.isDisposed()) {
                  defBlock.dispose(false);
                }
                return;
              }

              // Keep track of valid procedures (first occurrence of each name)
              if (!validProcedures.has(name)) {
                validProcedures.set(name, defBlock);
              } else {
                // Duplicate with same name - check if we should remove it
                const primaryDef = validProcedures.get(name);
                const isBeingUsedByCallName = calledProcedureNames.has(name);
                const isBeingUsedByCallers = hasCallers(name);

                // If the primary one was disposed already, replace it
                if (!primaryDef || primaryDef.isDisposed()) {
                  validProcedures.set(name, defBlock);
                  return;
                }

                // If this duplicate is not being used, dispose it
                if (!isBeingUsedByCallName && !isBeingUsedByCallers && !defBlock.isDisposed()) {
                  defBlock.dispose(false);
                }
              }
            } catch (e) { }
          });
        } catch (e) {
          console.error('Error in cleanupDuplicateProcedures:', e);
        }
      };

      cleanupDuplicateProceduresRef.current = cleanupDuplicateProcedures;

      // Ref to store existing definition IDs when creating call block
      const existingDefIdsRef = { current: null };

      // Handle call block creation - set name immediately
      workspace.addChangeListener((event) => {
        if (skipCleanupRef.current || isXmlLoadingRef.current) {
          return;
        }

        let isCreatingCallBlock = false;

        // Handle CHANGE event for call blocks - faster than BLOCK_CREATE
        if (event.type === Blockly.Events.BLOCK_CHANGE) {
          const block = workspace.getBlockById(event.blockId);
          if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
            const nameField = block.getField('NAME');
            if (nameField) {
              const currentName = nameField.getValue();
              // If call block has no name or unnamed, set it immediately
              if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || !currentName.trim()) {
                const existingDefs = workspace.getBlocksByType('procedures_defreturn', false)
                  .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                if (existingDefs.length > 0) {
                  const bestDef = existingDefs[0];
                  const targetName = bestDef.getFieldValue('NAME');
                  if (targetName && targetName !== 'unnamed' && targetName !== 'undefined') {
                    nameField.setValue(targetName);
                    // Sync parameters
                    try {
                      const params = bestDef.getVars ? bestDef.getVars() : [];
                      let paramIds = [];
                      try {
                        if (bestDef.paramIds_ && bestDef.paramIds_.length === params.length) {
                          paramIds = bestDef.paramIds_;
                        } else if (bestDef.getVarModels) {
                          const models = bestDef.getVarModels();
                          if (models && models.length === params.length) {
                            paramIds = models.map(m => m.getId());
                          }
                        }
                        if ((!paramIds || paramIds.length !== params.length) && workspace && workspace.getVariable) {
                          paramIds = params.map(p => {
                            try {
                              const v = workspace.getVariable(p);
                              return v ? v.getId() : null;
                            } catch (e) {
                              return null;
                            }
                          }).filter(Boolean);
                        }
                      } catch (e) { }
                      if (block.setProcedureParameters && params.length > 0 && paramIds.length === params.length) {
                        block.setProcedureParameters(params, paramIds, true);
                      }
                    } catch (e) { }
                    if (block.render) block.render();
                  }
                } else if (lastProcedureNameRef.current) {
                  nameField.setValue(lastProcedureNameRef.current);
                  if (block.render) block.render();
                }
              }
            }
            return;
          }
        }

        // Track when call blocks are being created - same logic as PatternCreateEdit
        if (event.type === Blockly.Events.BLOCK_CREATE) {
          const block = workspace.getBlockById(event.blockId);
          if (!block) return;

          if (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn') {
            isCreatingCallBlock = true;
            skipCleanupRef.current = true;

            // Get existing definitions BEFORE Blockly potentially creates a new one
            const existingDefsBefore = workspace.getBlocksByType('procedures_defreturn', false)
              .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
            const existingDefIds = new Set(existingDefsBefore.map(d => d.id));
            existingDefIdsRef.current = existingDefIds; // Store for use in definition block handler

            // CRITICAL: Disable events to prevent Blockly from auto-creating definition
            Blockly.Events.disable();

            // CRITICAL: Fix call block name immediately (no delay) to prevent cleanup from deleting it
            // Use same logic as PatternCreateEdit
            try {
              const nameField = block.getField('NAME');
              if (nameField) {
                const currentName = nameField.getValue();

                // Get valid procedure names from EXISTING definitions only
                const existingDefs = existingDefsBefore.filter(def => existingDefIds.has(def.id));

                const validProcedureNames = new Set();
                let bestDef = null;
                existingDefs.forEach(defBlock => {
                  try {
                    const name = defBlock.getFieldValue('NAME');
                    if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                      validProcedureNames.add(name);
                      lastProcedureNameRef.current = name;
                      if (!bestDef) {
                        bestDef = defBlock;
                      }
                    }
                  } catch (e) { }
                });

                // ALWAYS set the name to the first valid procedure name if available
                if (validProcedureNames.size > 0) {
                  const firstValidName = Array.from(validProcedureNames)[0];
                  // Only set if current name is invalid or different
                  if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '' || !validProcedureNames.has(currentName)) {
                    nameField.setValue(firstValidName);
                  }
                } else if (lastProcedureNameRef.current) {
                  nameField.setValue(lastProcedureNameRef.current);
                } else if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                  nameField.setValue(defaultProcedureName);
                }

                // Sync parameters/varids on call block with its definition if available
                // Use bestDef (first valid definition) to ensure we link to existing one
                const targetDef = bestDef || existingDefs.find(def => {
                  try { return def.getFieldValue('NAME') === nameField.getValue(); } catch (e) { return false; }
                });
                if (targetDef && block.setProcedureParameters) {
                  const params = targetDef.getVars ? targetDef.getVars() : [];
                  let paramIds = [];
                  try {
                    if (targetDef.paramIds_ && targetDef.paramIds_.length === params.length) {
                      paramIds = targetDef.paramIds_;
                    } else if (targetDef.getVarModels) {
                      const models = targetDef.getVarModels();
                      if (models && models.length === params.length) {
                        paramIds = models.map(m => m.getId());
                      }
                    }
                    // fallback: resolve from workspace variable map by name
                    if ((!paramIds || paramIds.length !== params.length) && workspace && workspace.getVariable) {
                      paramIds = params.map(p => {
                        try {
                          const v = workspace.getVariable(p);
                          return v ? v.getId() : null;
                        } catch (e) {
                          return null;
                        }
                      }).filter(Boolean);
                    }
                  } catch (e) { }
                  if (params.length && paramIds && params.length === paramIds.length) {
                    block.setProcedureParameters(params, paramIds, true);
                  }
                }
              }
            } catch (e) {
            }
            
            // Re-enable events
            Blockly.Events.enable();
            
            // Double-check after a short delay to ensure call block is linked to correct definition
            setTimeout(() => {
              try {
                if (!block || block.isDisposed()) return;
                const nameField = block.getField('NAME');
                if (nameField) {
                  const currentName = nameField.getValue();
                  // Get all definitions including newly created ones
                  const allDefs = workspace.getBlocksByType('procedures_defreturn', false)
                    .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                  // Check if call block is linked to a definition that wasn't in original list
                  const linkedDef = allDefs.find(def => {
                    try {
                      return def.getFieldValue('NAME') === currentName;
                    } catch (e) {
                      return false;
                    }
                  });

                  // If linked to a newly created definition, re-link to existing one
                  if (linkedDef && existingDefIdsRef.current && !existingDefIdsRef.current.has(linkedDef.id)) {
                    // Find existing definition with same name or use first existing definition
                    const existingDef = allDefs.find(def => {
                      try {
                        return existingDefIdsRef.current && existingDefIdsRef.current.has(def.id) &&
                          def.getFieldValue('NAME') === currentName;
                      } catch (e) {
                        return false;
                      }
                    }) || allDefs.find(def => {
                      try {
                        return existingDefIdsRef.current && existingDefIdsRef.current.has(def.id);
                      } catch (e) {
                        return false;
                      }
                    });

                    if (existingDef) {
                      const existingName = existingDef.getFieldValue('NAME');
                      if (existingName && existingName !== 'unnamed' && existingName !== 'undefined') {
                        nameField.setValue(existingName);
                        // Sync parameters
                        try {
                          const params = existingDef.getVars ? existingDef.getVars() : [];
                          let paramIds = [];
                          try {
                            if (existingDef.paramIds_ && existingDef.paramIds_.length === params.length) {
                              paramIds = existingDef.paramIds_;
                            } else if (existingDef.getVarModels) {
                              const models = existingDef.getVarModels();
                              if (models && models.length === params.length) {
                                paramIds = models.map(m => m.getId());
                              }
                            }
                            if ((!paramIds || paramIds.length !== params.length) && workspace && workspace.getVariable) {
                              paramIds = params.map(p => {
                                try {
                                  const v = workspace.getVariable(p);
                                  return v ? v.getId() : null;
                                } catch (e) {
                                  return null;
                                }
                              }).filter(Boolean);
                            }
                          } catch (e) { }
                          if (block.setProcedureParameters && params.length > 0 && paramIds.length === params.length) {
                            block.setProcedureParameters(params, paramIds, true);
                          }
                        } catch (e) { }
                        if (block.render) block.render();
                      }
                    }
                  }
                }
              } catch (e) { }
            }, 50);

            // ให้เวลานานขึ้นก่อนเปิด cleanup อีกครั้ง
            setTimeout(() => {
              isCreatingCallBlock = false;
              skipCleanupRef.current = false;
            }, 3500);
          }

          // If a definition block is created while we're creating a call block, delete it
          // Use same logic as PatternCreateEdit
          if (block && (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn')) {
            setTimeout(() => {
              try {
                const defName = block.getFieldValue('NAME');
                const allDefs = workspace.getBlocksByType('procedures_defreturn', false)
                  .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                const getParamCount = (def) => {
                  try {
                    const mutation = def.mutationToDom && def.mutationToDom();
                    if (mutation && mutation.getAttribute) {
                      const attrCount = mutation.getAttribute('arguments');
                      if (attrCount) return parseInt(attrCount, 10) || 0;
                    }
                    if (mutation && mutation.childNodes) {
                      return Array.from(mutation.childNodes).filter(n => n.nodeName === 'arg').length;
                    }
                  } catch (e) { }
                  return 0;
                };
                const rebindCallers = (fromName, toName) => {
                  try {
                    const callers = Blockly.Procedures.getCallers(fromName || '', workspace) || [];
                    callers.forEach(cb => { try { cb.getField('NAME')?.setValue(toName); } catch (e) { } });
                  } catch (e) { }
                };

                // 1) If exact duplicate names exist, keep first and remove the rest
                const sameNameDefs = allDefs.filter(def => {
                  try { return def.getFieldValue('NAME') === defName; } catch (e) { return false; }
                });
                if (sameNameDefs.length > 1) {
                  // Prefer the one with more parameters
                  const keepDef = sameNameDefs.reduce((best, def) => {
                    return getParamCount(def) > getParamCount(best) ? def : best;
                  }, sameNameDefs[0]);
                  sameNameDefs.forEach(def => {
                    if (def === keepDef) return;
                    try {
                      rebindCallers(def.getFieldValue('NAME'), keepDef.getFieldValue('NAME'));
                      if (def && !def.isDisposed()) def.dispose(false);
                    } catch (e) { }
                  });
                } else {
                  // 2) If this is a numbered variant (DFS2, DFS3, ...) and a base def exists, rebind callers then remove this variant
                  const baseName = (defName || '').replace(/\d+$/, '');
                  const baseDef = allDefs.find(def => {
                    try {
                      const name = def.getFieldValue('NAME');
                      return name && name !== defName && name.replace(/\d+$/, '') === baseName;
                    } catch (e) { return false; }
                  });
                  if (baseDef) {
                    rebindCallers(defName, baseDef.getFieldValue('NAME'));
                    try { if (!block.isDisposed()) block.dispose(false); } catch (e) { }
                  } else {
                    // 3) If this new def has no params but another with same base has params, keep the richer one
                    const richerDef = allDefs.find(def => {
                      try {
                        const name = def.getFieldValue('NAME');
                        return name !== defName && name.replace(/\d+$/, '') === baseName && getParamCount(def) > getParamCount(block);
                      } catch (e) { return false; }
                    });
                    if (richerDef) {
                      rebindCallers(defName, richerDef.getFieldValue('NAME'));
                      try { if (!block.isDisposed()) block.dispose(false); } catch (e) { }
                    }
                  }
                }
              } catch (e) { }
            }, 100);
          }

          // Handle definition block creation - dispose if it's a duplicate created while setting up call block
          if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
            try {
              const name = block.getFieldValue('NAME');
              if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                lastProcedureNameRef.current = name;
              }

              // CRITICAL: If this is a newly created definition while creating a call block, dispose it immediately
              // This prevents call blocks from linking to auto-created definitions
              if (existingDefIdsRef.current && !existingDefIdsRef.current.has(block.id)) {
                // Check if it's unnamed or if there's an existing definition with same name
                const defName = name || block.getFieldValue('NAME');
                const existingDefs = workspace.getBlocksByType('procedures_defreturn', false)
                  .concat(workspace.getBlocksByType('procedures_defnoreturn', false))
                  .filter(def => existingDefIdsRef.current && existingDefIdsRef.current.has(def.id));

                const hasExistingWithSameName = existingDefs.some(def => {
                  try {
                    return def.getFieldValue('NAME') === defName;
                  } catch (e) {
                    return false;
                  }
                });

                // Dispose immediately if unnamed OR if there's an existing definition with same name
                if (!defName || defName === 'unnamed' || defName === 'undefined' || defName.trim() === '' || hasExistingWithSameName) {
                  // Dispose immediately - use setTimeout(0) for fastest execution
                  setTimeout(() => {
                    try {
                      if (!block || block.isDisposed()) return;

                      // Before disposing, rebind any call blocks that might be using this new def
                      if (hasExistingWithSameName) {
                        // Rebind callers to existing definition
                        const existingDef = existingDefs.find(def => {
                          try {
                            return def.getFieldValue('NAME') === defName;
                          } catch (e) {
                            return false;
                          }
                        });
                        if (existingDef) {
                          const existingName = existingDef.getFieldValue('NAME');
                          const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                          callers.forEach(cb => {
                            try {
                              cb.getField('NAME')?.setValue(existingName);
                              // Sync parameters
                              if (cb.setProcedureParameters && existingDef) {
                                const params = existingDef.getVars ? existingDef.getVars() : [];
                                let paramIds = [];
                                try {
                                  if (existingDef.paramIds_ && existingDef.paramIds_.length === params.length) {
                                    paramIds = existingDef.paramIds_;
                                  } else if (existingDef.getVarModels) {
                                    const models = existingDef.getVarModels();
                                    if (models && models.length === params.length) {
                                      paramIds = models.map(m => m.getId());
                                    }
                                  }
                                  if ((!paramIds || paramIds.length !== params.length) && workspace && workspace.getVariable) {
                                    paramIds = params.map(p => {
                                      try {
                                        const v = workspace.getVariable(p);
                                        return v ? v.getId() : null;
                                      } catch (e) {
                                        return null;
                                      }
                                    }).filter(Boolean);
                                  }
                                } catch (e) { }
                                if (params.length && paramIds && params.length === paramIds.length) {
                                  cb.setProcedureParameters(params, paramIds, true);
                                }
                              }
                              if (cb.render) cb.render();
                            } catch (e) { }
                          });
                        }
                      } else if (existingDefs.length > 0) {
                        // Unnamed definition - rebind to first existing definition
                        const existingDef = existingDefs[0];
                        const existingName = existingDef.getFieldValue('NAME');
                        const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                        callers.forEach(cb => {
                          try {
                            cb.getField('NAME')?.setValue(existingName);
                            // Sync parameters
                            if (cb.setProcedureParameters && existingDef) {
                              const params = existingDef.getVars ? existingDef.getVars() : [];
                              let paramIds = [];
                              try {
                                if (existingDef.paramIds_ && existingDef.paramIds_.length === params.length) {
                                  paramIds = existingDef.paramIds_;
                                } else if (existingDef.getVarModels) {
                                  const models = existingDef.getVarModels();
                                  if (models && models.length === params.length) {
                                    paramIds = models.map(m => m.getId());
                                  }
                                }
                                if ((!paramIds || paramIds.length !== params.length) && workspace && workspace.getVariable) {
                                  paramIds = params.map(p => {
                                    try {
                                      const v = workspace.getVariable(p);
                                      return v ? v.getId() : null;
                                    } catch (e) {
                                      return null;
                                    }
                                  }).filter(Boolean);
                                }
                              } catch (e) { }
                              if (params.length && paramIds && params.length === paramIds.length) {
                                cb.setProcedureParameters(params, paramIds, true);
                              }
                            }
                            if (cb.render) cb.render();
                          } catch (e) { }
                        });
                      }

                      // Now dispose the new definition
                      if (!block.isDisposed()) {
                        block.dispose(false);
                      }
                    } catch (e) {
                      console.error('Error disposing new definition:', e);
                    }
                  }, 0);
                } else {
                  // Check if any call blocks are using this new definition
                  setTimeout(() => {
                    try {
                      if (!block || block.isDisposed()) return;
                      const callers = Blockly.Procedures.getCallers(defName || '', workspace) || [];
                      // If no callers, dispose it
                      if (callers.length === 0) {
                        if (!block.isDisposed()) {
                          block.dispose(false);
                        }
                      }
                    } catch (e) { }
                  }, 10);
                }
              }
            } catch (e) { }
          }
        }

        if ((event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_DELETE) &&
          !skipCleanupRef.current && !isCreatingCallBlock) {
          // ล้าง timeout เก่าถ้ามี (debouncing)
          if (cleanupTimeoutRef.current) {
            clearTimeout(cleanupTimeoutRef.current);
          }
          
          // Debounce cleanup - รอให้ events เงียบ 300ms แทน 2500ms
          cleanupTimeoutRef.current = setTimeout(() => {
            // ตรวจสอบอีกครั้งว่ายังมี events ใหม่ไหม
            const currentCallBlocks = workspace.getBlocksByType('procedures_callreturn', false)
              .concat(workspace.getBlocksByType('procedures_callnoreturn', false));
            
            // ตรวจสอบว่าทุก call block มีชื่อแล้ว
            const allNamed = currentCallBlocks.every(cb => {
              try {
                const name = cb.getFieldValue('NAME');
                return name && name !== 'unnamed' && name !== 'undefined' && name.trim();
              } catch (e) { return false; }
            });
            
            // ทำ cleanup เฉพาะเมื่อทุกอย่างพร้อม หรือถ้าไม่มี call blocks เลย
            if (allNamed || currentCallBlocks.length === 0) {
              cleanupDuplicateProcedures();
            }
            
            cleanupTimeoutRef.current = null;
          }, 300); // ลดจาก 2500ms เป็น 300ms
        }
      });

      setBlocklyLoaded(true);
    } catch (err) {
      console.error('Error initializing Blockly:', err);
      setError('เกิดข้อผิดพลาดในการโหลด Blockly: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [enabledBlocks]);

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
      const loadXmlWithRetry = (retryCount = 0, maxRetries = 3) => {
        // Wait longer to ensure workspace and toolbox are fully initialized
        // Use requestAnimationFrame to ensure DOM is ready, then add delay
        requestAnimationFrame(() => {
          setTimeout(() => {
            requestAnimationFrame(() => {
              setTimeout(() => {
                try {
                  if (!workspaceRef.current) {
                    if (retryCount < maxRetries) {
                      // Retry if workspace not ready
                      setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                    } else {
                      starterXmlLoadedRef.current = false; // Reset if workspace is gone
                    }
                    return;
                  }

                  // Verify workspace is truly ready - check if toolbox is rendered
                  const toolbox = workspaceRef.current.getToolbox();
                  if (!toolbox || !toolbox.flyout_) {
                    if (retryCount < maxRetries) {
                      // Retry if toolbox not ready
                      setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 300);
                      return;
                    }
                  }

                  const removeVariableIdsFromXml = (xmlString) => {
                    if (!xmlString) return xmlString;
                    let cleaned = xmlString.replace(/varid="[^"]*"/g, '');
                    cleaned = cleaned.replace(/<variable[^>]*\sid="[^"]*"[^>]*>/g, (match) => {
                      return match.replace(/\sid="[^"]*"/g, '');
                    });
                    cleaned = cleaned.replace(/<variables>[\s\S]*?<\/variables>/g, '');
                    return cleaned;
                  };

                  const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
                  const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);

                  // Clear workspace before loading
                  workspaceRef.current.clear();

                  // CRITICAL: Skip cleanup and call block fixing during XML load
                  // This prevents the change listener from interfering with XML loading
                  skipCleanupRef.current = true;
                  isXmlLoadingRef.current = true;

                  // Wait additional time to ensure workspace is fully ready
                  setTimeout(() => {
                    if (!workspaceRef.current) {
                      if (retryCount < maxRetries) {
                        setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                      } else {
                        starterXmlLoadedRef.current = false;
                        skipCleanupRef.current = false;
                        isXmlLoadingRef.current = false;
                      }
                      return;
                    }

                    // Check if blocks already exist (prevent duplicate load)
                    const existingBlocks = workspaceRef.current.getAllBlocks(false);
                    if (existingBlocks.length > 0 && retryCount === 0) {
                      // Only skip on first attempt if blocks already exist
                      isFirstXmlLoad.current = false;
                      skipCleanupRef.current = false;
                      isXmlLoadingRef.current = false;
                      return;
                    }

                    // Load XML directly
                    try {
                      Blockly.Xml.domToWorkspace(xml, workspaceRef.current);
                      
                      // CRITICAL: Verify blocks were actually loaded
                      setTimeout(() => {
                        if (!workspaceRef.current) {
                          if (retryCount < maxRetries) {
                            setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                          } else {
                            starterXmlLoadedRef.current = false;
                            skipCleanupRef.current = false;
                            isXmlLoadingRef.current = false;
                          }
                          return;
                        }
                        
                        const loadedBlocks = workspaceRef.current.getAllBlocks(false);
                        // Count actual blocks (not just flyout blocks)
                        const actualBlocks = loadedBlocks.filter(block => {
                          try {
                            return !block.isInFlyout && !block.isShadow;
                          } catch (e) {
                            return true;
                          }
                        });
                        
                        // If no blocks loaded and we have retries left, try again
                        if (actualBlocks.length === 0 && retryCount < maxRetries) {
                          console.log(`No blocks loaded, retrying... (${retryCount + 1}/${maxRetries})`);
                          skipCleanupRef.current = false;
                          isXmlLoadingRef.current = false;
                          setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                          return;
                        }
                        
                        // Blocks loaded successfully - proceed with fixing procedure calls
                        // CRITICAL: Fix procedure call blocks immediately after loading starter XML
                        // This prevents Blockly from auto-creating new procedure definitions with wrong names
                        // Same logic as PatternCreateEdit
                        setTimeout(() => {
                          try {
                  const definitionBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                    .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));
                  
                  const callBlocks = workspaceRef.current.getBlocksByType('procedures_callreturn', false)
                    .concat(workspaceRef.current.getBlocksByType('procedures_callnoreturn', false));
                  
                  // Get valid procedure names from definitions
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
                  
                  // Fix each call block to use a valid procedure name
                  callBlocks.forEach(callBlock => {
                    try {
                      const nameField = callBlock.getField('NAME');
                      if (nameField) {
                        const currentName = nameField.getValue();
                        
                        // If call block name doesn't match any definition, fix it
                        if (!validProcedureNames.has(currentName)) {
                          if (validProcedureNames.size > 0) {
                            // Use the first valid procedure name (should be "DFS" from starter XML)
                            const firstValidName = Array.from(validProcedureNames)[0];
                            nameField.setValue(firstValidName);
                            
                            // Sync parameters with the definition
                            const matchedDef = definitionBlocks.find(def => {
                              try { return def.getFieldValue('NAME') === firstValidName; } catch (e) { return false; }
                            });
                            if (matchedDef && callBlock.setProcedureParameters) {
                              const params = matchedDef.getVars ? matchedDef.getVars() : [];
                              let paramIds = [];
                              try {
                                if (matchedDef.paramIds_ && matchedDef.paramIds_.length === params.length) {
                                  paramIds = matchedDef.paramIds_;
                                } else if (matchedDef.getVarModels) {
                                  const models = matchedDef.getVarModels();
                                  if (models && models.length === params.length) {
                                    paramIds = models.map(m => m.getId());
                                  }
                                }
                                if ((!paramIds || paramIds.length !== params.length) && workspaceRef.current && workspaceRef.current.getVariableMap) {
                                  const varMap = workspaceRef.current.getVariableMap();
                                  paramIds = params.map(p => {
                                    try {
                                      const v = varMap.getVariable(p);
                                      return v ? v.getId() : null;
                                    } catch (e) {
                                      return null;
                                    }
                                  }).filter(Boolean);
                                }
                              } catch (e) {}
                              if (params.length && paramIds && params.length === paramIds.length) {
                                callBlock.setProcedureParameters(params, paramIds, true);
                              }
                            }
                            if (callBlock.render) callBlock.render();
                          }
                        }
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  });
                  
                  // Remove any auto-created procedure definitions that don't match valid names
                  // These are typically created by Blockly when it can't find a matching definition
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
                          if (!defBlock.isDisposed()) {
                            defBlock.dispose(false);
                          }
                        }
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  });
                          } catch (e) {
                            // Ignore errors
                          }
                        }, 50); // Small delay to ensure blocks are fully loaded
                        
                        // Re-enable cleanup after XML is fully loaded
                        setTimeout(() => {
                          isXmlLoadingRef.current = false;
                          skipCleanupRef.current = false;
                          isFirstXmlLoad.current = false;

                          // Run cleanup once to remove any duplicates that might have been created
                          if (cleanupDuplicateProceduresRef.current) {
                            cleanupDuplicateProceduresRef.current();
                          }
                          
                          // Wait for cleanup to finish before showing workspace
                          // Cleanup ใช้เวลา ~200-400ms เพราะใช้ polling แล้ว
                          setTimeout(() => {
                            setBlocklyProcessing(false);
                          }, 400); // ลดจาก 600ms เป็น 400ms
                        }, 50); // ลดจาก 100ms เป็น 50ms
                      }, 200); // ลดจาก 300ms เป็น 200ms - Verify blocks delay
                    } catch (e) {
                      // Error loading XML - retry if possible
                      if (retryCount < maxRetries) {
                        skipCleanupRef.current = false;
                        isXmlLoadingRef.current = false;
                        setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                      } else {
                        // Max retries reached - give up
                        starterXmlLoadedRef.current = false;
                        skipCleanupRef.current = false;
                        isXmlLoadingRef.current = false;
                        isFirstXmlLoad.current = false;
                        setBlocklyProcessing(false); // Stop processing on error
                      }
                    }
                  }, 300); // Additional delay after clear to ensure workspace is ready
              } catch (err) {
                // Error in outer try - retry if possible
                if (retryCount < maxRetries) {
                  setTimeout(() => loadXmlWithRetry(retryCount + 1, maxRetries), 500);
                } else {
                  // Max retries reached - give up
                  starterXmlLoadedRef.current = false;
                  skipCleanupRef.current = false;
                  isXmlLoadingRef.current = false;
                  isFirstXmlLoad.current = false;
                  setBlocklyProcessing(false); // Stop processing on error
                }
              }
            }, 300); // Delay after second setTimeout
          }, 800); // Initial delay to ensure workspace and toolbox are fully initialized and rendered
          }); // Close second requestAnimationFrame
        }); // Close first requestAnimationFrame
      }; // Close loadXmlWithRetry
      
      // Start loading with retry mechanism
      loadXmlWithRetry();
    } else {
      // No starter XML - workspace will remain empty for admin to add blocks
      isFirstXmlLoad.current = false;
      starterXmlLoadedRef.current = true; // Mark as processed
      setBlocklyProcessing(false); // No processing needed if no starter XML
    }
  }, [blocklyLoaded, levelData, loading]);

  const handleSave = async () => {
    if (!workspaceRef.current) {
      alert('Workspace ไม่พร้อม');
      return;
    }

    try {
      setSaving(true);

      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      const updateData = {
        starter_xml: xmlText || null,
      };

      await updateLevel(getToken, levelId, updateData);
      alert('บันทึก Starter XML สำเร็จ');
      navigate(`/admin/levels/${levelId}/edit`);
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ` + (error.message || 'ไม่ทราบสาเหตุ'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">⏳ กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <div className="text-lg mb-2">❌ {error}</div>
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
          backPath={`/admin/levels`}
          rightContent={
            <Button
              onClick={handleSave}
              disabled={saving}
              className="ml-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0 min-w-[140px] font-bold tracking-wide"
              size="default"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
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
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="text-center">
                    <Loader className="mx-auto mb-4" size="lg" />
                    <div className="text-lg text-gray-600">กำลังเตรียม workspace...</div>
                    <div className="text-sm text-gray-400 mt-2">กำลังจัดการบล็อก function และลบบล็อกที่ซ้ำซ้อน</div>
                  </div>
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
