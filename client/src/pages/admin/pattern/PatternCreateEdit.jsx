import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import 'blockly/javascript';
import { javascriptGenerator } from 'blockly/javascript';
import {
  createToolboxConfig,
  defineAllBlocks,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../gameutils/utils/blocklyUtils';
import { fetchLevelById } from '../../../services/levelService';
import { fetchPatternById, updatePattern, createPattern } from '../../../services/patternService';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { Settings, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import new components
import PatternInfoForm from '@/components/admin/pattern/PatternInfoForm';
import PatternBlocklyWorkspace from '@/components/admin/pattern/PatternBlocklyWorkspace';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const PatternCreateEdit = () => {
  const { levelId, patternId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const isEditMode = !!patternId;

  const blocklyRef = useRef(null);
  const workspaceRef = useRef(null);
  // Ref สำหรับควบคุมการโหลด XML ครั้งแรก (เพื่อแก้ไข Race Condition ของ Step 1)
  const isFirstXmlLoad = useRef(true);
  // Ref สำหรับเก็บ steps ล่าสุด (เพื่อใช้ใน handleFinish)
  const stepsRef = useRef([]);
  const stepsXmlCacheRef = useRef({}); // เก็บ XML ต่อ step ที่เซฟล่าสุด ป้องกันหายระหว่างสลับ step
  // Ref สำหรับ track ว่า starter XML ถูกโหลดแล้วหรือยัง
  const starterXmlLoadedRef = useRef(false);
  // Ref สำหรับ track XML ที่โหลดล่าสุด (เพื่อป้องกันการโหลดซ้ำ)
  const lastLoadedXmlRef = useRef(null);
  // Ref สำหรับ track previous step index เพื่อบันทึกก่อนเปลี่ยน step
  const prevStepIndexRef = useRef(-1);
  // Ref สำหรับ track ว่าเรากำลังโหลดจาก step ก่อนหน้าหรือไม่ (เพื่อ skip duplicate removal)
  const isLoadingFromPreviousStepRef = useRef(false);
  // Ref สำหรับบอกว่า workspace กำลังโหลด XML อยู่ เพื่อกัน listener ลบ block ทิ้งตอนโหลด
  const isXmlLoadingRef = useRef(false);
  // Ref สำหรับเรียก cleanupDuplicateProcedures หลังโหลด XML เสร็จ
  const cleanupDuplicateProceduresRef = useRef(null);
  // Ref สำหรับข้าม cleanup ชั่วคราวเวลาสร้าง call block
  const skipCleanupRef = useRef(false);
  // Ref สำหรับ debouncing cleanup ใน event listener
  const cleanupTimeoutRef = useRef(null);
  // Ref สำหรับจำชื่อฟังก์ชันล่าสุด (ใช้เติมให้ call block ที่ยังไม่มีชื่อ)
  const lastProcedureNameRef = useRef('');
  const defaultProcedureName = 'DFS';

  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);
  const [patternData, setPatternData] = useState(null); // Store loaded pattern data
  const [patternLoaded, setPatternLoaded] = useState(false); // Track if pattern data has been loaded
  const [blocklyProcessing, setBlocklyProcessing] = useState(true); // Track Blockly processing state

  // Pattern form states
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');
  const [weaponId, setWeaponId] = useState('');
  const [bigO, setBigO] = useState(''); // Big-O complexity (enum BigO)
  const [patternTypes, setPatternTypes] = useState([]);

  // Step management
  const [steps, setSteps] = useState([]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Note: keep XML format as-is (no normalization)

  // Helper: โหลด XML เข้า workspace พร้อมตั้ง flag ป้องกัน listener ทำความสะอาดระหว่างโหลด
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
          setBlocklyProcessing(false);
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
          
          // รอ cleanup เสร็จ (cleanup ใช้เวลา ~300-500ms)
          setTimeout(() => {
            setBlocklyProcessing(false);
          }, 600);
        } else {
          // ยังไม่พร้อม - ตรวจสอบอีกครั้งเร็วๆ
          setTimeout(checkAndCleanup, 100);
        }
      };
      
      // เริ่มตรวจสอบหลังจาก 200ms (ให้ Blockly สร้าง blocks ก่อน)
      setTimeout(checkAndCleanup, 200);
    }
  };

  // Load pattern types
  useEffect(() => {
    const loadPatternTypes = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/patterns/types`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPatternTypes(data || []);
        }
      } catch (err) {
      }
    };

    loadPatternTypes();
  }, [getToken]);

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
          // Use default blocks
          enabledBlocksObj.move_forward = true;
          enabledBlocksObj.turn_left = true;
          enabledBlocksObj.turn_right = true;
          enabledBlocksObj.hit = true;
        }

        setEnabledBlocks(enabledBlocksObj);

        // Only set loading to false if not in edit mode (edit mode will set it to false after loading pattern)
        if (!isEditMode) {
          setLoading(false);
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
        setLoading(false);
      }
    };

    if (levelId) {
      loadLevelData();
    }
  }, [levelId, getToken, isEditMode]);

  // Load pattern data if in edit mode (load immediately, don't wait for workspace)
  useEffect(() => {
    const loadPatternData = async () => {
      if (!isEditMode || !patternId || patternLoaded) {
        return;
      }

      try {
        setLoading(true);
        const fetchedPatternData = await fetchPatternById(getToken, patternId);
        // Backend returns pattern directly, not wrapped in { pattern: ... }
        const pattern = fetchedPatternData?.pattern || fetchedPatternData;

        if (pattern && pattern.pattern_id) {
          // Store pattern data
          setPatternData(pattern);
          setPatternLoaded(true);

          // Set form fields
          setPatternName(pattern.pattern_name || '');
          setPatternDescription(pattern.description || '');
          setWeaponId(pattern.weapon_id ? pattern.weapon_id.toString() : '');
          setBigO(pattern.bigO || '');


          // Parse hints if it's a string
          let hintsArray = pattern.hints;
          if (typeof pattern.hints === 'string') {
            try {
              hintsArray = JSON.parse(pattern.hints);
            } catch (e) {
              hintsArray = [];
            }
          }

          // Load steps from hints - ถ้า xmlCheck ว่างให้ใส่ starter_xml
          if (hintsArray && Array.isArray(hintsArray) && hintsArray.length > 0) {
            const loadedSteps = hintsArray.map((hint, index) => {
              // ใช้ xmlCheck ถ้ามี ไม่งั้น fallback เป็น starter_xml เพื่อไม่ให้ workspace ว่างเปล่า
              const xml = (hint.xmlCheck && hint.xmlCheck.trim())
                ? hint.xmlCheck
                : (pattern.starter_xml || '<xml xmlns="https://developers.google.com/blockly/xml"></xml>');
              
              return {
                step: index,
                xml: xml
              };
            });
            setSteps(loadedSteps);
            stepsRef.current = loadedSteps;
            setCurrentStepIndex(0);
          } else {
            setSteps([]);
            setCurrentStepIndex(0);
          }
        } else {
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลรูปแบบคำตอบ: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
      } finally {
        setLoading(false);
      }
    };

    loadPatternData();
  }, [isEditMode, patternId, getToken, patternLoaded]);

  // Ensure currentStepIndex is valid when steps change
  useEffect(() => {
    if (steps.length > 0 && currentStepIndex >= steps.length) {
      // ถ้า index เกินขอบเขต ให้ไปที่ index ใหม่ (Step ใหม่) หรือ Step สุดท้ายที่บันทึกไว้
      // ในกรณีนี้ เราอนุญาตให้ไปที่ index = steps.length เพื่อสร้าง Step ใหม่
      if (currentStepIndex > steps.length) {
        setCurrentStepIndex(steps.length > 0 ? steps.length - 1 : 0);
      }
    }
  }, [steps, currentStepIndex]);

  // Populate form data when currentStepIndex or steps change (ทำงานก่อนการโหลด XML)
  useEffect(() => {
    // 1. กรณีเป็น Step ใหม่ หรือไม่มี Steps เลย
    if (currentStepIndex >= steps.length || steps.length === 0) {
      // ไม่ต้อง reset form fields อีกแล้ว เพราะไม่ใช้แล้ว
      return;
    }

    // 2. กรณีเป็น Step ที่มีอยู่แล้ว - ไม่ต้อง populate form data อีกแล้ว เพราะไม่ใช้แล้ว
    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      return;
    }
    // ไม่ต้อง populate form data อีกแล้ว เพราะไม่ใช้ question, reasoning, suggestion, difficulty, highlightBlocks
  }, [currentStepIndex, steps]);

  // Note: Starter XML will be loaded by step XML loading effect below
  // This prevents race condition where starter XML loads then gets cleared

  // Load XML into workspace when workspace is ready and step changes
  useEffect(() => {
    // Only load XML if workspace is ready
    if (!workspaceRef.current || !blocklyLoaded) {
      return;
    }

    // CRITICAL: Save current step before loading new step XML
    // This ensures that any blocks added to the current step are saved before switching
    // IMPORTANT: We need to save the PREVIOUS step, not the current one
    // Because when currentStepIndex changes, we're already on the new step
    // So we need to track the previous step index using the ref declared at top level
    // ใน useEffect โหลด XML ตรง saveBeforeSwitch
    const saveBeforeSwitch = async () => {
      try {
        const prevStepIndex = prevStepIndexRef.current;
        
        // ถ้ายังอยู่ step เดิม หรือ index ไม่ valid ไม่ต้องเซฟ
        if (prevStepIndex === currentStepIndex || prevStepIndex < 0) {
          prevStepIndexRef.current = currentStepIndex;
          return;
        }

        if (prevStepIndex <= stepsRef.current.length && workspaceRef.current) {
          const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
          let xmlText = Blockly.Xml.domToText(xml);
          const hasBlocks = xmlText && (xmlText.includes('<block') || xmlText.includes('<shadow'));

          // ถ้า workspace ว่าง ให้ลองใช้ cache หรือ xml เดิมแทน
          if (!hasBlocks) {
            const cached = stepsXmlCacheRef.current[prevStepIndex];
            const existingXml = stepsRef.current[prevStepIndex]?.xml;
            const fallbackXml = cached || existingXml;
            if (fallbackXml) {
              console.warn('💾 [saveBeforeSwitch] workspace empty; using cached/existing XML for step', prevStepIndex);
              xmlText = fallbackXml;
              // update cache with the fallback used
              stepsXmlCacheRef.current[prevStepIndex] = xmlText;
            } else {
              console.warn('💾 [saveBeforeSwitch] skip overwrite empty xml for step', prevStepIndex);
              prevStepIndexRef.current = currentStepIndex;
              return;
            }
          }

              const currentSteps = [...stepsRef.current];
          while (currentSteps.length <= prevStepIndex) currentSteps.push(null);

          const existing = currentSteps[prevStepIndex];
          const isSame = existing && existing.xml === xmlText && existing.xmlCheck === xmlText;

          // อัปเดตเฉพาะเมื่อ XML เปลี่ยนจริง ๆ
          if (!isSame) {
                currentSteps[prevStepIndex] = {
              ...(existing || { step: prevStepIndex }),
                  xml: xmlText,
              xmlCheck: xmlText,
                };
                stepsRef.current = currentSteps;
                setSteps(currentSteps);
          }
        }
        
        // อัปเดต ref สำหรับรอบถัดไป
        prevStepIndexRef.current = currentStepIndex;
      } catch (e) {
        prevStepIndexRef.current = currentStepIndex;
      }
    };
    
    // เรียกด้วย await เพื่อไม่ให้ซ้อนซ้ำ
    (async () => { await saveBeforeSwitch(); })();

    // Get starter XML from level data (for all cases) - declare at the top
    const starter_xml = levelData?.starter_xml;
    const hasStarterXml = starter_xml && typeof starter_xml === 'string' && starter_xml.trim();

    // Guard: Skip if this effect is running again too quickly (prevent race conditions)
    // BUT: Allow first load after workspace initialization (when lastLoadedXmlRef is null)
    const effectKey = `${currentStepIndex}-${steps.length}-${levelData?.id || 'no-level'}-${hasStarterXml ? 'has' : 'no'}-starter`;
    if (lastLoadedXmlRef.current === effectKey && lastLoadedXmlRef.current !== null) {
      return;
    }

    // Set effectKey immediately to prevent race conditions
    lastLoadedXmlRef.current = effectKey;
    // Guard: Check if workspace already has blocks (prevent clearing if already loaded)
    // BUT: Only skip if this is NOT the first load after workspace initialization
    const existingBlocks = workspaceRef.current.getAllBlocks(false);
    if (existingBlocks.length > 0 && !isFirstXmlLoad.current) {
      // Check if we're on a valid step
      const currentStep = steps[currentStepIndex];
      if (currentStep && currentStep.xml && currentStep.xml.trim()) {
        // Try to check if current workspace XML matches the step XML
        try {
          const currentXml = Blockly.Xml.workspaceToDom(workspaceRef.current);
          const currentXmlText = Blockly.Xml.domToText(currentXml);
          // If XML matches (check first 200 chars), skip reload
          const stepXmlPreview = currentStep.xml.substring(0, 200);
          if (currentXmlText.includes(stepXmlPreview)) {
            return;
          }
        } catch (checkErr) {
        }
      } else if (currentStepIndex === steps.length) {
        // New step - check if starter XML is already loaded
        if (hasStarterXml && starterXmlLoadedRef.current) {
          return;
        }
      }
    } else if (existingBlocks.length > 0 && isFirstXmlLoad.current) {
    }
    // 1. ตรวจสอบว่ามี Step ที่ถูกต้องหรือไม่
    if (currentStepIndex < 0 || currentStepIndex > steps.length) {
      workspaceRef.current.clear();
      
      // Clear variable map เพื่อป้องกัน variable ID conflict
      const variableMap = workspaceRef.current.getVariableMap();
      if (variableMap) {
        const allVariables = variableMap.getAllVariables();
        allVariables.forEach(variable => {
          try {
            variableMap.deleteVariable(variable);
          } catch (e) {
          }
        });
      }
      
      if (hasStarterXml) {
        setTimeout(() => {
          try {
            if (!workspaceRef.current) return;
            
            // Helper function: Remove variable IDs from XML to prevent conflicts
            const removeVariableIdsFromXml = (xmlString) => {
              if (!xmlString) return xmlString;
              // Remove all variable id attributes from XML
              return xmlString.replace(/varid="[^"]*"/g, '');
            };
            
            // Remove variable IDs from starter XML to prevent conflicts
            const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
            const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);
            loadXmlDomSafely(xml);
            } catch (err) {
            }
          }, 500); // เพิ่ม delay จาก 100ms เป็น 500ms เพื่อให้ call blocks ไม่หายไป
      }
      return;
    }

    // 2. สำหรับ Step ใหม่ (Index = steps.length) ให้โหลด XML จาก step ก่อนหน้าสุดท้าย (ถ้ามี) หรือ starter XML
    if (currentStepIndex === steps.length) {
      // หา step ก่อนหน้าสุดท้าย (ถ้ามี)
      const previousStepIndex = steps.length - 1;
      const previousStep = previousStepIndex >= 0 ? steps[previousStepIndex] : null;
      const previousStepXml = previousStep?.xml || previousStep?.xmlCheck || '';
      
      // CRITICAL: ALWAYS set flag to true for new steps to prevent cleanup
      // This ensures starter XML blocks (including call blocks) are preserved
      isLoadingFromPreviousStepRef.current = true;
      
      // ถ้ามี step ก่อนหน้า - โหลด XML จาก step ก่อนหน้า (ซึ่งมี starter + all previous steps)
      if (previousStepXml && previousStepXml.trim()) {
        try {
          // เคลียร์ workspace และ variables ก่อน
          workspaceRef.current.clear();
          
          // Clear variable map เพื่อป้องกัน variable ID conflict
          const variableMap = workspaceRef.current.getVariableMap();
          if (variableMap) {
            const allVariables = variableMap.getAllVariables();
            allVariables.forEach(variable => {
              try {
                variableMap.deleteVariable(variable);
              } catch (e) {
              }
            });
          }

          setTimeout(() => {
            // Check effectKey before proceeding
            if (lastLoadedXmlRef.current !== effectKey) {
              return;
            }

            try {
              if (!workspaceRef.current) {
                return;
              }

              // Helper function: Remove variable IDs from XML to prevent conflicts
              const removeVariableIdsFromXml = (xmlString) => {
                if (!xmlString) return xmlString;
                let cleaned = xmlString.replace(/varid="[^"]*"/g, '');
                cleaned = cleaned.replace(/<variable[^>]*\sid="[^"]*"[^>]*>/g, (match) => {
                  return match.replace(/\sid="[^"]*"/g, '');
                });
                cleaned = cleaned.replace(/<variables>[\s\S]*?<\/variables>/g, '');
                return cleaned;
              };

              // Remove variable IDs from previous step XML to prevent conflicts
              const cleanedPreviousStepXml = removeVariableIdsFromXml(previousStepXml);
              
              // ใช้ XML จาก step ก่อนหน้า (ซึ่งมี starter + all previous steps)
              const xml = Blockly.utils.xml.textToDom(cleanedPreviousStepXml);
              loadXmlDomSafely(xml);
              starterXmlLoadedRef.current = true; // Mark as loaded
              
              // CRITICAL: Fix call blocks immediately after loading to prevent auto-creation of wrong procedure names
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
                    }
                  });
                  
                  // Fix each call block to use a valid procedure name
                  callBlocks.forEach(callBlock => {
                    try {
                      const nameField = callBlock.getField('NAME');
                      if (nameField) {
                        const currentName = nameField.getValue();
                        if (!validProcedureNames.has(currentName)) {
                          if (validProcedureNames.size > 0) {
                            const firstValidName = Array.from(validProcedureNames)[0];
                            nameField.setValue(firstValidName);
                          }
                        }
                      }
                    } catch (e) {
                    }
                  });
                } catch (e) {
                }
              }, 500); // เพิ่ม delay จาก 50ms เป็น 500ms เพื่อให้ call blocks ไม่หายไป
            } catch (err) {
              console.error("Error loading previous step XML:", err);
              // Fallback to starter XML if error
              if (hasStarterXml) {
                try {
                  const removeVariableIdsFromXml = (xmlString) => {
                    if (!xmlString) return xmlString;
                    return xmlString.replace(/varid="[^"]*"/g, '');
                  };
                  const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
                  const starterXml = Blockly.utils.xml.textToDom(cleanedStarterXml);
                  loadXmlDomSafely(starterXml);
                  starterXmlLoadedRef.current = true;
                } catch (starterErr) {
                  starterXmlLoadedRef.current = false;
                }
              }
            }
          }, 150);
        } catch (err) {
          console.error("Error preparing previous step XML:", err);
        }
      } else {
        // ไม่มี step ก่อนหน้า - โหลดแค่ starter XML
        // CRITICAL: Also set flag to true when loading starter XML for first step
        // This ensures starter XML blocks are preserved
        isLoadingFromPreviousStepRef.current = true;
        
        // ถ้า starter XML ถูกโหลดแล้วและ workspace มี blocks อยู่แล้ว - ไม่ต้อง clear
        const existingBlocks = workspaceRef.current.getAllBlocks(false);
        if (!starterXmlLoadedRef.current || existingBlocks.length === 0) {
          workspaceRef.current.clear();
          
          // Clear variable map เพื่อป้องกัน variable ID conflict
          const variableMap = workspaceRef.current.getVariableMap();
          if (variableMap) {
            const allVariables = variableMap.getAllVariables();
            allVariables.forEach(variable => {
              try {
                variableMap.deleteVariable(variable);
              } catch (e) {
              }
            });
          }
        }
        
        // Load starter XML if available and not already loaded
        if (hasStarterXml && !starterXmlLoadedRef.current) {
          setTimeout(() => {
            // Check effectKey again before loading
            if (lastLoadedXmlRef.current !== effectKey) {
              return;
            }
            try {
              if (!workspaceRef.current) return;
              
              // Helper function: Remove variable IDs from XML to prevent conflicts
              const removeVariableIdsFromXml = (xmlString) => {
                if (!xmlString) return xmlString;
                // Remove all variable id attributes from XML
                return xmlString.replace(/varid="[^"]*"/g, '');
              };
              
              // Remove variable IDs from starter XML to prevent conflicts
              const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
              const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);
              loadXmlDomSafely(xml);
              starterXmlLoadedRef.current = true;
            } catch (err) {
              starterXmlLoadedRef.current = false;
            }
          }, 150);
        } else if (!hasStarterXml) {
          starterXmlLoadedRef.current = false;
        }
        // Keep flag as true for new steps to prevent cleanup
        // isLoadingFromPreviousStepRef.current remains true
      }
      return;
    }

    // 3. โหลด Step XML สำหรับ Step ที่มีอยู่แล้ว
    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      // ถ้าไม่มี step - ไม่ต้อง clear workspace ถ้า starter XML ถูกโหลดแล้ว
      // เพื่อป้องกันไม่ให้ starter XML หายไป
      // CRITICAL: Set flag to true when loading without step (new step scenario)
      isLoadingFromPreviousStepRef.current = true;
      
      if (!starterXmlLoadedRef.current) {
        workspaceRef.current.clear();
        
        // Clear variable map เพื่อป้องกัน variable ID conflict
        const variableMap = workspaceRef.current.getVariableMap();
        if (variableMap) {
          const allVariables = variableMap.getAllVariables();
          allVariables.forEach(variable => {
            try {
              variableMap.deleteVariable(variable);
            } catch (e) {
            }
          });
        }
      }
      
      if (hasStarterXml && !starterXmlLoadedRef.current) {
        setTimeout(() => {
          // Check effectKey again before loading
          if (lastLoadedXmlRef.current !== effectKey) {
            return;
          }
          try {
            if (!workspaceRef.current) return;
            
            // Helper function: Remove variable IDs from XML to prevent conflicts
            const removeVariableIdsFromXml = (xmlString) => {
              if (!xmlString) return xmlString;
              // Remove all variable id attributes from XML
              return xmlString.replace(/varid="[^"]*"/g, '');
            };
            
            // Remove variable IDs from starter XML to prevent conflicts
            const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
            const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);
            loadXmlDomSafely(xml);
            starterXmlLoadedRef.current = true;
          } catch (err) {
            starterXmlLoadedRef.current = false;
          }
        }, 150);
      } else if (!hasStarterXml) {
        starterXmlLoadedRef.current = false;
      }
      return;
    }

    // CRITICAL: Reset flag to false when editing existing step (not new step)
    // This ensures duplicate removal works correctly for existing steps
    isLoadingFromPreviousStepRef.current = false;
    
    const xmlToLoad = currentStep.xml;

    // กำหนด Delay: 250ms สำหรับ Initial load (Step 0) เพื่อให้ Blockly มีเวลาในการสร้างตัวเองให้เสร็จ
    // 100ms สำหรับการเปลี่ยน Step ทั่วไป
    let delay = 100;
    if (isFirstXmlLoad.current && currentStepIndex === 0) {
      delay = 250;
    }
    // CRITICAL: If step has saved XML, load it. Otherwise, load starter XML if available.
    // This ensures step 1 shows saved data if exists, or starter XML if not.
    if (xmlToLoad && xmlToLoad.trim()) {
      // Step has saved XML - load it (it includes starter XML + blocks from previous steps)
      try {
        // เคลียร์ workspace และ variables ก่อน (เพื่อป้องกัน variable ID conflict)
        workspaceRef.current.clear();
        
        // Clear variable map เพื่อป้องกัน variable ID conflict
        const variableMap = workspaceRef.current.getVariableMap();
        if (variableMap) {
          const allVariables = variableMap.getAllVariables();
          allVariables.forEach(variable => {
            try {
              variableMap.deleteVariable(variable);
            } catch (e) {
            }
          });
        }

        setTimeout(() => {
          // Check effectKey before proceeding
          if (lastLoadedXmlRef.current !== effectKey) {
            return;
          }

          try {
            if (!workspaceRef.current) {
              return;
            }

            // ใช้ xmlToLoad ที่จับมานอก setTimeout เพื่อความปลอดภัย
            if (steps[currentStepIndex]?.xml !== xmlToLoad) {
              return;
            }

            // รอสักครู่เพื่อให้ clear() ทำงานเสร็จ
            setTimeout(() => {
              // Check effectKey again before loading
              if (lastLoadedXmlRef.current !== effectKey) {
                return;
              }

              try {
                if (!workspaceRef.current) {
                  return;
                }

                if (steps[currentStepIndex]?.xml !== xmlToLoad) {
                  return;
                }

                // Helper function: Remove variable IDs and variable elements from XML to prevent conflicts
                const removeVariableIdsFromXml = (xmlString) => {
                  if (!xmlString) return xmlString;
                  // Remove all variable id attributes from XML (ทั้ง varid และ id ใน variable elements)
                  let cleaned = xmlString.replace(/varid="[^"]*"/g, '');
                  // Also remove id attributes from <variable> elements
                  cleaned = cleaned.replace(/<variable[^>]*\sid="[^"]*"[^>]*>/g, (match) => {
                    return match.replace(/\sid="[^"]*"/g, '');
                  });
                  // Remove entire <variables> section to let Blockly reuse existing variables
                  cleaned = cleaned.replace(/<variables>[\s\S]*?<\/variables>/g, '');
                  return cleaned;
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
                              }
                            }
                          }
                        }
                      } catch (e) {
                      }
                    });
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
                          return match;
                        }
                        
                        // Build mutation XML string
                        const argXml = params.map(paramName => `    <arg name="${paramName}"></arg>`).join('\n');
                        const mutationXml = `\n    <mutation name="${name}">\n${argXml}\n    </mutation>`;
                        
                        // Insert mutation after NAME field
                        const newBlock = fieldPart + mutationXml;
                        return newBlock;
                      });
                    });
                    
                    return result;
                  } catch (e) {
                    return xmlString; // Return original if error
                  }
                };

                    // CRITICAL: When step has saved XML, we should NOT load starter XML first
                    // because step XML already includes starter XML + blocks from previous steps
                    // Only load starter XML first if step XML doesn't exist
                    // Skip loading starter XML if step has saved XML (it's already in step XML)
                    // CRITICAL: Track if we're loading from previous step (not starter XML) to skip duplicate removal
                    // Use ref to check if we're loading from previous step
                    const isLoadingFromPreviousStep = isLoadingFromPreviousStepRef.current;
                    if (hasStarterXml && !xmlToLoad) { // Only load starter XML if step has no saved XML
                  try {
                    // Remove variable IDs from starter XML to prevent conflicts
                    let cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
                    // CRITICAL: Add mutation to procedure definition blocks that don't have it
                    cleanedStarterXml = addMutationToProcedureDefinitions(cleanedStarterXml);
                    const starterXmlDom = Blockly.utils.xml.textToDom(cleanedStarterXml);
                    loadXmlDomSafely(starterXmlDom);
                    starterXmlLoadedRef.current = true;
                    // CRITICAL: Fix procedure call blocks immediately after loading starter XML
                    // This prevents Blockly from auto-creating new procedure definitions with wrong names
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
                                }
                              } else {
                              }
                            }
                          } catch (e) {
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
                          }
                        });
                      } catch (e) {
                      }
                    }, 50); // Small delay to ensure blocks are fully loaded
                    
                    // Clear variable map หลังจากโหลด starter XML เพื่อให้ step XML สร้าง variables ใหม่
                    // แต่เก็บ variable names ไว้เพื่อให้ Blockly reuse variables ที่มีอยู่แล้ว
                    const variableMapAfterStarter = workspaceRef.current.getVariableMap();
                    if (variableMapAfterStarter) {
                      const allVariablesAfterStarter = variableMapAfterStarter.getAllVariables();
                      // Get variable names but don't delete them - Blockly will reuse them
                    }
                  } catch (starterErr) {
                    starterXmlLoadedRef.current = false;
                  }
                } else {
                  starterXmlLoadedRef.current = false;
                }

                // Load step XML directly (it already includes starter XML + blocks from previous steps)
                // If step has saved XML, load it directly without loading starter XML first
                if (xmlToLoad && xmlToLoad.trim()) {
                  // Check original XML for main code blocks
                  const originalXmlDom = Blockly.utils.xml.textToDom(xmlToLoad);
                  const originalMainCodeBlocks = Array.from(originalXmlDom.querySelectorAll('block')).filter(block => {
                    const type = block.getAttribute('type');
                    if (type === 'variables_set') {
                      const varField = block.querySelector('field[name="VAR"]');
                      const varName = varField ? varField.textContent : null;
                      if (varName === 'path') {
                        const callBlock = block.querySelector('block[type="procedures_callreturn"], block[type="procedures_callnoreturn"]');
                        if (callBlock) {
                          return true;
                        }
                      }
                    }
                    return false;
                  });
                  try {
                    // Remove variable IDs from step XML to prevent conflicts
                    let cleanedStepXml = removeVariableIdsFromXml(xmlToLoad);
                    // CRITICAL: Add mutation to procedure definition blocks in step XML too
                    cleanedStepXml = addMutationToProcedureDefinitions(cleanedStepXml);
                    const xmlDom = Blockly.utils.xml.textToDom(cleanedStepXml);
                    
                    // CRITICAL: When loading step XML directly (not loading starter XML first),
                    // we should NOT remove duplicate blocks because step XML is the complete XML
                    // that includes starter XML + blocks from previous steps
                    // Only remove duplicates if we loaded starter XML first (which we don't do when step has saved XML)
                    // CRITICAL: Don't remove duplicates if loading from previous step (to preserve call blocks)
                    // CRITICAL: Also skip duplicate removal when editing existing step (currentStepIndex < steps.length)
                    const shouldRemoveDuplicates = hasStarterXml && starterXmlLoadedRef.current && 
                      !isLoadingFromPreviousStepRef.current && 
                      currentStepIndex >= steps.length; // Only remove duplicates for new steps, not when editing
                    if (shouldRemoveDuplicates) {
                      // This should NOT happen when step has saved XML because we skip loading starter XML
                      const existingBlocks = workspaceRef.current.getAllBlocks(false);
                      
                      // Parse starter XML to get list of block types and IDs that are in starter XML
                      // We'll use this to identify which blocks in step XML are from starter XML vs previous steps
                      const starterXmlDom = Blockly.utils.xml.textToDom(starter_xml);
                      const starterBlockTypes = new Set();
                      const starterBlockIds = new Set();
                      const starterProcedureNames = new Set();
                      const starterMainCodeBlocks = new Set(); // Track main code blocks in starter XML
                      
                      starterXmlDom.querySelectorAll('block').forEach(starterBlock => {
                        const type = starterBlock.getAttribute('type');
                        const id = starterBlock.getAttribute('id');
                        if (type) starterBlockTypes.add(type);
                        if (id) starterBlockIds.add(id);
                        
                        // Track procedure names in starter XML
                        if (type === 'procedures_defreturn' || type === 'procedures_defnoreturn') {
                          const nameField = starterBlock.querySelector('field[name="NAME"]');
                          const name = nameField ? nameField.textContent : null;
                          if (name) starterProcedureNames.add(name);
                        }
                        
                        // Track main code blocks in starter XML
                        if (type === 'variables_set') {
                          const varField = starterBlock.querySelector('field[name="VAR"]');
                          const varName = varField ? varField.textContent : null;
                          if (varName === 'path') {
                            const callBlock = starterBlock.querySelector('block[type="procedures_callreturn"], block[type="procedures_callnoreturn"]');
                            if (callBlock) {
                              starterMainCodeBlocks.add('path');
                            }
                          }
                        }
                      });
                      // Get existing procedure names from workspace
                      const existingProcedureNames = new Set();
                      const existingProcedureBaseNames = new Set(); // Base names without numbers (e.g., "DFS" from "DFS2")
                      existingBlocks.forEach(block => {
                        try {
                          if (block.type === 'procedures_defreturn' || block.type === 'procedures_defnoreturn') {
                            const name = block.getFieldValue('NAME');
                            if (name && name !== 'unnamed' && name !== 'undefined') {
                              existingProcedureNames.add(name);
                              // Extract base name (remove trailing numbers)
                              const baseName = name.replace(/\d+$/, '');
                              existingProcedureBaseNames.add(baseName);
                            }
                          }
                        } catch (e) {
                          // Ignore errors
                        }
                      });
                      
                      // Check if we have main code block (path = ...) in workspace
                      // Main code block is a variables_set block with VAR="path" that contains a procedure call
                      const hasMainCodeBlock = existingBlocks.some(block => {
                        try {
                          if (block.type === 'variables_set' && block.getFieldValue('VAR') === 'path') {
                            // Check if it has a procedure call as value
                            const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                            if (valueConnection) {
                              const valueType = valueConnection.type;
                              if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                                return true;
                              }
                            }
                          }
                          return false;
                        } catch (e) {
                          return false;
                        }
                      });
                      // Parse step XML to find blocks that might duplicate starter XML blocks
                      // CRITICAL: We need to identify blocks that are EXACTLY from starter XML
                      // vs blocks that were added in previous steps
                      // Strategy: Compare block structure/content, not just type/name
                      const stepBlocks = Array.from(xmlDom.querySelectorAll('block'));
                      let removedCount = 0;
                      // Create a more detailed map of starter XML blocks for comparison
                      // We'll use block structure (type + key fields) to identify exact matches
                      const starterBlockSignatures = new Map();
                      starterXmlDom.querySelectorAll('block').forEach((starterBlock, idx) => {
                        const type = starterBlock.getAttribute('type');
                        const id = starterBlock.getAttribute('id');
                        
                        // Create a signature based on block type and key fields
                        let signature = type;
                        
                        // For procedures, use name
                        if (type === 'procedures_defreturn' || type === 'procedures_defnoreturn') {
                          const nameField = starterBlock.querySelector('field[name="NAME"]');
                          const name = nameField ? nameField.textContent : null;
                          if (name) {
                            signature = `${type}:${name}`;
                          }
                        }
                        // For variables_set, use variable name
                        else if (type === 'variables_set') {
                          const varField = starterBlock.querySelector('field[name="VAR"]');
                          const varName = varField ? varField.textContent : null;
                          if (varName) {
                            signature = `${type}:${varName}`;
                          }
                        }
                        
                        // Store signature with block index for reference
                        if (!starterBlockSignatures.has(signature)) {
                          starterBlockSignatures.set(signature, []);
                        }
                        starterBlockSignatures.get(signature).push({ block: starterBlock, id, index: idx });
                      });
                      // Also track call blocks in starter XML to remove duplicates
                      const starterCallBlocks = new Set();
                      starterXmlDom.querySelectorAll('block').forEach(starterBlock => {
                        const type = starterBlock.getAttribute('type');
                        if (type === 'procedures_callreturn' || type === 'procedures_callnoreturn') {
                          const nameField = starterBlock.querySelector('field[name="NAME"]');
                          const name = nameField ? nameField.textContent : null;
                          if (name) {
                            // Create signature for call block: type + name + parent context
                            let parentContext = 'root';
                            const parentBlock = starterBlock.parentElement;
                            if (parentBlock && parentBlock.tagName === 'block') {
                              parentContext = parentBlock.getAttribute('type') || 'root';
                            }
                            const callSignature = `${type}:${name}:${parentContext}`;
                            starterCallBlocks.add(callSignature);
                          }
                        }
                      });
                      stepBlocks.forEach((stepBlock, index) => {
                        const stepBlockType = stepBlock.getAttribute('type');

                        // Check for duplicate procedure definitions
                        // IMPORTANT: Only remove if it's EXACTLY from starter XML, not from previous steps
                        if (stepBlockType === 'procedures_defreturn' || stepBlockType === 'procedures_defnoreturn') {
                          const nameField = stepBlock.querySelector('field[name="NAME"]');
                          const stepBlockName = nameField ? nameField.textContent : null;

                          if (stepBlockName) {
                            // Create signature for this step block
                            const stepSignature = `${stepBlockType}:${stepBlockName}`;
                            
                            // Check if this exact signature exists in starter XML
                            const isExactStarterBlock = starterBlockSignatures.has(stepSignature);
                            
                            // Check if exact name exists in workspace (from starter XML)
                            const exactMatch = existingProcedureNames.has(stepBlockName);
                            // Only remove if:
                            // 1. It's EXACTLY in starter XML (same type + name)
                            // 2. AND it already exists in workspace (from starter XML we just loaded)
                            // This ensures we don't remove blocks from previous steps
                            if (isExactStarterBlock && exactMatch) {
                              try {
                                if (stepBlock.parentNode) {
                                  stepBlock.parentNode.removeChild(stepBlock);
                                  removedCount++;
                                } else {
                                }
                              } catch (e) {
                              }
                            } else {
                            }
                          }
                        }
                        // Check for duplicate main code block (path = ...)
                        // This includes both the variables_set block and the move_along_path block that follows it
                        else if (stepBlockType === 'variables_set') {
                          const varField = stepBlock.querySelector('field[name="VAR"]');
                          const varName = varField ? varField.textContent : null;
                          
                          if (varName === 'path') {
                            // Check if this is the main code block by looking for procedure call inside
                            const callBlock = stepBlock.querySelector('block[type="procedures_callreturn"], block[type="procedures_callnoreturn"]');
                            if (callBlock) {
                              // Create signature for this main code block
                              const mainCodeSignature = `variables_set:path`;
                              
                              // Check if this exact signature exists in starter XML
                              const isExactStarterMainCode = starterBlockSignatures.has(mainCodeSignature);
                              
                              // Check if this main code block is from starter XML
                              const isMainCodeInStarter = starterMainCodeBlocks.has('path');
                              // CRITICAL: Only remove if:
                              // 1. It's EXACTLY in starter XML (same signature)
                              // 2. AND it's marked as main code block in starter XML (isMainCodeInStarter)
                              // This ensures we don't remove main code blocks from previous steps
                              // Note: We don't need to check hasMainCodeBlock because starter XML was just loaded
                              if (isExactStarterMainCode && isMainCodeInStarter) {
                                try {
                                  // Find and remove the next block (move_along_path) if it exists
                                  // Look for next sibling block in XML
                                  let currentSibling = stepBlock.nextSibling;
                                  while (currentSibling) {
                                    if (currentSibling.nodeType === 1) { // Element node
                                      const siblingType = currentSibling.getAttribute('type');
                                      if (siblingType === 'move_along_path') {
                                        if (currentSibling.parentNode) {
                                          currentSibling.parentNode.removeChild(currentSibling);
                                          removedCount++;
                                        }
                                        break;
                                      }
                                    }
                                    currentSibling = currentSibling.nextSibling;
                                  }
                                  
                                  // Also check for next block using <next> element
                                  const nextElement = stepBlock.querySelector('next > block');
                                  if (nextElement && nextElement.getAttribute('type') === 'move_along_path') {
                                    if (nextElement.parentNode) {
                                      nextElement.parentNode.removeChild(nextElement);
                                      removedCount++;
                                    }
                                  }
                                  
                                  if (stepBlock.parentNode) {
                                    stepBlock.parentNode.removeChild(stepBlock);
                                    removedCount++;
                                  }
                                } catch (e) {
                                }
                              } else {
                              }
                            }
                          }
                        }
                        // Check for duplicate call blocks
                        else if (stepBlockType === 'procedures_callreturn' || stepBlockType === 'procedures_callnoreturn') {
                          const nameField = stepBlock.querySelector('field[name="NAME"]');
                          const stepBlockName = nameField ? nameField.textContent : null;
                          
                          if (stepBlockName) {
                            // Create signature for this call block
                            let parentContext = 'root';
                            const parentBlock = stepBlock.parentElement;
                            if (parentBlock && parentBlock.tagName === 'block') {
                              parentContext = parentBlock.getAttribute('type') || 'root';
                            }
                            const callSignature = `${stepBlockType}:${stepBlockName}:${parentContext}`;
                            
                            // Check if this exact call block exists in starter XML
                            const isExactStarterCallBlock = starterCallBlocks.has(callSignature);
                            
                            // Check if we already have this call block in workspace
                            const hasDuplicateCallBlock = existingBlocks.some(block => {
                              try {
                                if ((block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn') &&
                                    block.getFieldValue('NAME') === stepBlockName) {
                                  // Check if it's in the same context
                                  const blockParent = block.getParent();
                                  let blockParentContext = 'root';
                                  if (blockParent) {
                                    blockParentContext = blockParent.type;
                                  }
                                  return blockParentContext === parentContext;
                                }
                                return false;
                              } catch (e) {
                                return false;
                              }
                            });
                            // Only remove if:
                            // 1. It's EXACTLY in starter XML (same type + name + context)
                            // 2. AND it already exists in workspace (from starter XML we just loaded)
                            // 3. AND we're not loading from previous step (to preserve call blocks)
                            // 4. AND we're not editing existing step (to preserve call blocks)
                            // This ensures we don't remove call blocks from previous steps or when editing
                            const shouldRemoveThisCallBlock = isExactStarterCallBlock && hasDuplicateCallBlock &&
                              !isLoadingFromPreviousStepRef.current && 
                              currentStepIndex >= steps.length; // Only remove for new steps, not when editing
                            if (shouldRemoveThisCallBlock) {
                              try {
                                if (stepBlock.parentNode) {
                                  stepBlock.parentNode.removeChild(stepBlock);
                                  removedCount++;
                                } else {
                                }
                              } catch (e) {
                              }
                            }
                          }
                        }
                      });
                    } else {
                    }
                    
                    // Load step XML into workspace
                    // When step has saved XML, we load it directly (it includes starter XML + blocks from previous steps)
                    // We don't need to check if starter XML was loaded because we skip loading starter XML when step has saved XML
                    // Check XML before loading
                    const allBlocksInXml = xmlDom.querySelectorAll('block');
                    const mainCodeBlocksInXml = Array.from(allBlocksInXml).filter(block => {
                      const type = block.getAttribute('type');
                      if (type === 'variables_set') {
                        const varField = block.querySelector('field[name="VAR"]');
                        const varName = varField ? varField.textContent : null;
                        if (varName === 'path') {
                          // Check if it has a procedure call inside
                          const callBlock = block.querySelector('block[type="procedures_callreturn"], block[type="procedures_callnoreturn"]');
                          if (callBlock) {
                            return true;
                          }
                        }
                      }
                      return false;
                    });
                    loadXmlDomSafely(xmlDom);

                    // Check what blocks were loaded
                    const loadedBlocks = workspaceRef.current.getAllBlocks(false);
                    const callBlocksAfterLoad = loadedBlocks.filter(block => 
                      block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn'
                    );
                    
                    // CRITICAL: Store call block IDs immediately after loading to track them
                    const callBlockIdsAfterLoad = new Set(callBlocksAfterLoad.map(b => b.id));
                    
                    // Check call blocks again after a short delay to see if Blockly disposed them
                    setTimeout(() => {
                      const blocksAfterShortDelay = workspaceRef.current.getAllBlocks(false);
                      const callBlocksAfterShortDelay = blocksAfterShortDelay.filter(block => 
                        block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn'
                      );
                      const callBlockIdsAfterShortDelay = new Set(callBlocksAfterShortDelay.map(b => b.id));
                      const _ = Array.from(callBlockIdsAfterLoad).filter(id => !callBlockIdsAfterShortDelay.has(id));
                    }, 400); // เพิ่มเวลาให้ Blockly ประมวลผลก่อนตรวจซ้ำ
                    const mainCodeBlocks = loadedBlocks.filter(block => {
                      try {
                        if (block.type !== 'variables_set') return false;
                        const varField = block.getField('VAR');
                        const varModel = varField ? varField.getVariable() : null;
                        const varName = varModel ? varModel.name : block.getFieldValue('VAR');
                        if (varName === 'path') {
                          const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                          if (valueConnection) {
                            const valueType = valueConnection.type;
                            if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                              return true;
                            }
                          }
                        }
                        return false;
                      } catch (e) {
                        return false;
                      }
                    });
                    // CRITICAL: Immediately identify and protect main code blocks RIGHT AFTER loading
                    // This prevents them from being disposed by any cleanup process
                    const allBlocksAfterLoad = workspaceRef.current.getAllBlocks(false);
                    const mainCodeBlocksToProtectImmediately = allBlocksAfterLoad.filter(block => {
                      try {
                        if (block.type !== 'variables_set') return false;
                        const varField = block.getField('VAR');
                        const varModel = varField ? varField.getVariable() : null;
                        const varName = varModel ? varModel.name : block.getFieldValue('VAR');
                        if (varName === 'path') {
                          const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                          if (valueConnection) {
                            const valueType = valueConnection.type;
                            if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                              return true;
                            }
                          }
                        }
                        return false;
                      } catch (e) {
                        return false;
                      }
                    });
                    
                    // Store protected block IDs in a Set that will be accessible in the setTimeout
                    const protectedBlockIdsImmediate = new Set();
                    mainCodeBlocksToProtectImmediately.forEach(mainBlock => {
                      try {
                        protectedBlockIdsImmediate.add(mainBlock.id);
                        const valueConnection = mainBlock.getInput('VALUE')?.connection?.targetBlock();
                        if (valueConnection && (valueConnection.type === 'procedures_callreturn' || valueConnection.type === 'procedures_callnoreturn')) {
                          protectedBlockIdsImmediate.add(valueConnection.id);
                        }
                        const nextBlock = mainBlock.getNextBlock();
                        if (nextBlock && nextBlock.type === 'move_along_path') {
                          protectedBlockIdsImmediate.add(nextBlock.id);
                        }
                        // Protect all children recursively
                        const protectChildren = (b) => {
                          try {
                            const children = b.getChildren(false);
                            children.forEach(child => {
                              protectedBlockIdsImmediate.add(child.id);
                              protectChildren(child);
                            });
                          } catch (e) { }
                        };
                        protectChildren(mainBlock);
                      } catch (e) { }
                    });
                    // Get all variables_set blocks and check their details
                    const allVariablesSetBlocks = loadedBlocks.filter(b => b.type === 'variables_set');
                    const variablesSetDetails = allVariablesSetBlocks.map(b => {
                      try {
                        const varField = b.getField('VAR');
                        const varModel = varField ? varField.getVariable() : null;
                        const varName = varModel ? varModel.name : b.getFieldValue('VAR');
                        const varId = varModel ? varModel.getId() : null;
                        const valueConnection = b.getInput('VALUE')?.connection?.targetBlock();
                        const valueType = valueConnection ? valueConnection.type : 'none';
                        const isPathVar = varName === 'path' || (varId && varId.includes('path'));
                        return { 
                          id: b.id, 
                          var: varName,
                          varId: varId,
                          varFieldValue: b.getFieldValue('VAR'),
                          valueType: valueType,
                          isMainCode: isPathVar && (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn')
                        };
                      } catch (e) {
                        return { id: b.id, var: 'error', valueType: 'error', isMainCode: false, error: e.message };
                      }
                    });
                    
                    // Also check for path variables_set blocks specifically
                    // Note: getFieldValue('VAR') might return variable ID instead of name after removeVariableIdsFromXml
                    const pathVariablesSetBlocks = loadedBlocks.filter(b => {
                      try {
                        if (b.type !== 'variables_set') return false;
                        const varField = b.getField('VAR');
                        const varModel = varField ? varField.getVariable() : null;
                        const varName = varModel ? varModel.name : b.getFieldValue('VAR');
                        return varName === 'path';
                      } catch (e) {
                        return false;
                      }
                    });
                    
                    const pathVariablesSetDetails = pathVariablesSetBlocks.map(b => {
                      try {
                        const valueInput = b.getInput('VALUE');
                        const valueConnection = valueInput?.connection?.targetBlock();
                        const valueType = valueConnection ? valueConnection.type : 'none';
                        const hasConnection = !!valueConnection;
                        const nextBlock = b.getNextBlock();
                        return {
                          id: b.id,
                          var: b.getFieldValue('VAR'),
                          valueType: valueType,
                          hasConnection: hasConnection,
                          hasNextBlock: !!nextBlock,
                          nextBlockType: nextBlock ? nextBlock.type : 'none',
                          isMainCode: valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn'
                        };
                      } catch (e) {
                        return { id: b.id, var: 'error', error: e.message };
                      }
                    });
                    // Log path variables_set details separately for clarity
                    // Check ALL variables_set blocks to see what variables we have
                    // Also check all blocks to see what we have
                    const allBlockTypes = {};
                    loadedBlocks.forEach(block => {
                      const type = block.type;
                      allBlockTypes[type] = (allBlockTypes[type] || 0) + 1;
                    });
                    // Check if there are any procedures_callreturn blocks
                    const callBlocks = loadedBlocks.filter(b => b.type === 'procedures_callreturn' || b.type === 'procedures_callnoreturn');
                    const callBlocksDetails = callBlocks.map(b => {
                      try {
                        const parent = b.getParent();
                        return {
                          id: b.id,
                          name: b.getFieldValue('NAME'),
                          hasParent: !!parent,
                          parentType: parent ? parent.type : 'none',
                          parentVar: parent && parent.type === 'variables_set' ? parent.getFieldValue('VAR') : 'none',
                          parentId: parent ? parent.id : 'none'
                        };
                      } catch (e) {
                        return { id: b.id, error: e.message };
                      }
                    });
                    // Also check move_along_path blocks
                    const moveAlongPathBlocks = loadedBlocks.filter(b => b.type === 'move_along_path');
                    moveAlongPathBlocks.forEach(b => {
                      try {
                        const parent = b.getParent();
                      } catch (e) {
                      }
                    });
                    
                    // CRITICAL: Fix call blocks immediately after loading to prevent auto-creation of DFS2
                    setTimeout(() => {
                      try {
                        const allCallBlocks = workspaceRef.current.getBlocksByType('procedures_callreturn', false)
                          .concat(workspaceRef.current.getBlocksByType('procedures_callnoreturn', false));
                        
                        const allDefinitionBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                          .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));
                        
                        // Get valid procedure names
                        const validProcedureNames = new Set();
                        allDefinitionBlocks.forEach(defBlock => {
                          try {
                            const name = defBlock.getFieldValue('NAME');
                            if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                              validProcedureNames.add(name);
                            }
                          } catch (e) { }
                        });
                        // Fix call blocks with empty or invalid names
                        allCallBlocks.forEach(callBlock => {
                          try {
                            const nameField = callBlock.getField('NAME');
                            if (nameField) {
                              const currentName = nameField.getValue();
                              if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                                // Find a valid procedure name to use
                                if (validProcedureNames.size > 0) {
                                  const firstValidName = Array.from(validProcedureNames)[0];
                                  nameField.setValue(firstValidName);
                                }
                              } else if (!validProcedureNames.has(currentName)) {
                                // Name exists but procedure doesn't - use first valid name
                                if (validProcedureNames.size > 0) {
                                  const firstValidName = Array.from(validProcedureNames)[0];
                                  nameField.setValue(firstValidName);
                                }
                              }
                            }
                          } catch (e) {
                          }
                        });
                        
                        // After fix, just proceed without logging
                      } catch (e) {
                        console.error('❌ [PatternCreateEdit] Error in fix call blocks:', e);
                      }
                    }, 400); // เพิ่มเวลาเพื่อให้ Blockly สร้าง/เชื่อมชื่อ procedure ให้เสร็จก่อน
                    
                    // After loading step XML, also check for duplicate call blocks in workspace
                    // This handles cases where call blocks weren't removed from XML but are now duplicates
                    // CRITICAL: Skip duplicate removal if loading from previous step (to preserve call blocks)
                    // CRITICAL: Also skip if we're in edit mode (currentStepIndex < steps.length) to preserve call blocks
                    const shouldSkipDuplicateRemoval = isLoadingFromPreviousStepRef.current || (currentStepIndex < steps.length);
                    if (!shouldSkipDuplicateRemoval) {
                      setTimeout(() => {
                        try {
                          const allBlocks = workspaceRef.current.getAllBlocks(false);
                          const allCallBlocks = allBlocks.filter(block => 
                            block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn'
                          );
                        
                        // CRITICAL: First, identify and protect main code blocks BEFORE any cleanup
                        // Check if blocks from protectedBlockIdsImmediate still exist
                        const existingProtectedBlocks = allBlocks.filter(block => protectedBlockIdsImmediate.has(block.id));
                        
                        const mainCodeBlocksToProtect = allBlocks.filter(block => {
                          try {
                            // CRITICAL: First check if this block is already in the protected set
                            if (protectedBlockIdsImmediate.has(block.id)) {
                              return true; // Already protected, keep it
                            }
                            
                            if (block.type !== 'variables_set') return false;
                            const varField = block.getField('VAR');
                            const varModel = varField ? varField.getVariable() : null;
                            const varName = varModel ? varModel.name : block.getFieldValue('VAR');
                            if (varName === 'path') {
                              const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                              if (valueConnection) {
                                const valueType = valueConnection.type;
                                if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                                  return true;
                                }
                              }
                            }
                            return false;
                          } catch (e) {
                            return false;
                          }
                        });
                        // CRITICAL: If main code blocks were found earlier but not now, they may have been disposed
                        // In that case, we MUST use the protected IDs to prevent any further disposal
                        if (mainCodeBlocksToProtect.length === 0 && protectedBlockIdsImmediate.size > 0) {
                        }
                        
                        // CRITICAL: Create a set of ALL block IDs that are part of main code blocks
                        // This includes the variables_set block itself, the call block inside it, and the move_along_path block next to it
                        // ALWAYS start with the immediately protected IDs from before the setTimeout
                        // This ensures we protect blocks even if they were disposed between loading and cleanup
                        const protectedBlockIds = new Set(protectedBlockIdsImmediate);
                        const protectedCallBlocks = new Set();
                        
                        // Add any newly found main code blocks to the protected set
                        mainCodeBlocksToProtect.forEach(mainBlock => {
                          try {
                            // Protect the main variables_set block itself
                            protectedBlockIds.add(mainBlock.id);
                            
                            // Protect the call block inside the main code block
                            const valueConnection = mainBlock.getInput('VALUE')?.connection?.targetBlock();
                            if (valueConnection && (valueConnection.type === 'procedures_callreturn' || valueConnection.type === 'procedures_callnoreturn')) {
                              protectedCallBlocks.add(valueConnection.id);
                              protectedBlockIds.add(valueConnection.id);
                            }
                            
                            // Protect move_along_path blocks that are next to main code blocks
                            const nextBlock = mainBlock.getNextBlock();
                            if (nextBlock && nextBlock.type === 'move_along_path') {
                              protectedBlockIds.add(nextBlock.id);
                            }
                            
                            // Also protect all child blocks recursively
                            const protectChildren = (block) => {
                              try {
                                const children = block.getChildren(false);
                                children.forEach(child => {
                                  protectedBlockIds.add(child.id);
                                  protectChildren(child); // Recursively protect grandchildren
                                });
                              } catch (e) {
                                // Ignore errors
                              }
                            };
                            protectChildren(mainBlock);
                          } catch (e) {
                          }
                        });
                        const callBlocksForGrouping = allBlocks.filter(block => 
                          block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn'
                        );
                        
                        // Group call blocks by their procedure name AND their position in the workspace
                        // We want to keep call blocks that are in different contexts (e.g., inside different blocks)
                        // But remove exact duplicates (same procedure, same position)
                        const callBlocksByProcedure = new Map();
                        callBlocksForGrouping.forEach(callBlock => {
                          try {
                            const procName = callBlock.getFieldValue('NAME');
                            if (procName) {
                              // Create a key that includes the procedure name and parent block type
                              // This helps identify if call blocks are in different contexts
                              let parentContext = 'root';
                              try {
                                const parentBlock = callBlock.getParent();
                                if (parentBlock) {
                                  parentContext = parentBlock.type;
                                }
                              } catch (e) {
                                // Ignore errors
                              }
                              
                              const key = `${procName}_${parentContext}`;
                              if (!callBlocksByProcedure.has(key)) {
                                callBlocksByProcedure.set(key, []);
                              }
                              callBlocksByProcedure.get(key).push(callBlock);
                            }
                          } catch (e) {
                            // Ignore errors
                          }
                        });
                        
                        // For each procedure+context combination, if there are multiple call blocks, keep only one
                        callBlocksByProcedure.forEach((blocks, key) => {
                          if (blocks.length > 1) {
                            const procName = key.split('_')[0];
                            // CRITICAL: Check each block to see if it's part of a main code block
                            const blocksToRemove = [];
                            for (let i = 1; i < blocks.length; i++) {
                              try {
                                // CRITICAL: Check if this call block is protected
                                if (protectedCallBlocks.has(blocks[i].id)) {
                                  continue; // Don't remove protected call blocks
                                }
                                
                                // CRITICAL: Check if this call block is part of a main code block
                                const parentBlock = blocks[i].getParent();
                                if (parentBlock && parentBlock.type === 'variables_set') {
                                  try {
                                    const varField = parentBlock.getField('VAR');
                                    const varModel = varField ? varField.getVariable() : null;
                                    const varName = varModel ? varModel.name : parentBlock.getFieldValue('VAR');
                                    if (varName === 'path') {
                                      protectedCallBlocks.add(blocks[i].id); // Add to protected set
                                      continue; // Don't remove call blocks from main code blocks
                                    }
                                  } catch (e) {
                                    // Ignore errors, but still check if it's a main code block
                                  }
                                }
                                
                                // If we get here, it's safe to remove
                                blocksToRemove.push(blocks[i]);
                              } catch (e) {
                              }
                            }
                            
                            // Now remove only the blocks that are safe to remove
                            blocksToRemove.forEach(block => {
                              try {
                                // CRITICAL: Double-check that this block is not protected
                                if (protectedBlockIds.has(block.id) || protectedCallBlocks.has(block.id)) {
                                  return;
                                }
                                
                                // CRITICAL: Also check if parent is protected
                                try {
                                  const parentBlock = block.getParent();
                                  if (parentBlock) {
                                    if (protectedBlockIds.has(parentBlock.id)) {
                                      // CRITICAL: Also protect this block to prevent future disposal
                                      protectedBlockIds.add(block.id);
                                      protectedCallBlocks.add(block.id);
                                      return;
                                    }
                                    // Also check grandparent
                                    const grandParent = parentBlock.getParent();
                                    if (grandParent && protectedBlockIds.has(grandParent.id)) {
                                      protectedBlockIds.add(block.id);
                                      protectedCallBlocks.add(block.id);
                                      return;
                                    }
                                  }
                                } catch (e) {
                                  // Ignore errors
                                }
                                
                                if (!block.isDisposed()) {
                                  block.dispose(false);
                                }
                              } catch (e) {
                              }
                            });
                          }
                        });
                        
                        // CRITICAL: Also check for root-level call blocks (inside variables_set with VAR="path")
                        // These are the main code blocks that should only appear once
                        // IMPORTANT: Don't filter by procName - we need to check ALL call blocks, even if name is empty
                        const rootCallBlocks = new Map();
                        const mainCodeBlockCalls = []; // Track main code block calls separately
                        
                        callBlocks.forEach(callBlock => {
                          try {
                            // CRITICAL: Skip if this call block is protected (part of main code block)
                            if (protectedCallBlocks.has(callBlock.id)) {
                              return; // Skip this call block - it's protected
                            }
                            
                            const procName = callBlock.getFieldValue('NAME') || 'unnamed';
                            try {
                              const parentBlock = callBlock.getParent();
                              // If no parent or parent is variables_set with VAR="path", it's a root call block
                              let isRootCall = false;
                              let isMainCodeCall = false;
                              
                              if (!parentBlock) {
                                isRootCall = true;
                              } else if (parentBlock.type === 'variables_set') {
                                try {
                                  const varField = parentBlock.getField('VAR');
                                  const varModel = varField ? varField.getVariable() : null;
                                  const varName = varModel ? varModel.name : parentBlock.getFieldValue('VAR');
                                  if (varName === 'path') {
                                    isRootCall = true;
                                    isMainCodeCall = true;
                                    mainCodeBlockCalls.push(callBlock);
                                    protectedCallBlocks.add(callBlock.id); // Also add to protected set
                                  }
                                } catch (e) {
                                  // Ignore errors
                                }
                              }
                              
                              if (isRootCall) {
                                if (!rootCallBlocks.has(procName)) {
                                  rootCallBlocks.set(procName, []);
                                }
                                rootCallBlocks.get(procName).push(callBlock);
                              }
                            } catch (e) {
                              // If we can't determine parent, assume it's root
                              if (!rootCallBlocks.has(procName)) {
                                rootCallBlocks.set(procName, []);
                              }
                              rootCallBlocks.get(procName).push(callBlock);
                            }
                          } catch (e) {
                            // Ignore errors
                          }
                        });
                        // CRITICAL: Protect main code block calls from being removed
                        // If any call blocks are in main code blocks, we should NOT remove them
                        if (mainCodeBlockCalls.length > 0 || protectedCallBlocks.size > 0) {
                        }
                        
                        // For root-level call blocks, if there are multiple for the same procedure, keep only one
                        // BUT: Be careful not to remove main code blocks (variables_set with VAR="path")
                        // because they are part of the user's saved pattern
                        rootCallBlocks.forEach((blocks, procName) => {
                          if (blocks.length > 1) {
                            // Check if these are inside main code blocks (variables_set with VAR="path")
                            // Use the mainCodeBlockCalls array we built earlier
                            const blocksInMainCode = blocks.filter(callBlock => mainCodeBlockCalls.includes(callBlock));
                            if (blocksInMainCode.length === blocks.length) {
                              // All call blocks are inside main code blocks - keep all of them
                            } else if (blocksInMainCode.length > 0) {
                              // Some are main code blocks, some are not - keep all main code blocks, remove only non-main duplicates
                              // Remove only non-main code block calls
                              for (let i = 0; i < blocks.length; i++) {
                                if (!blocksInMainCode.includes(blocks[i])) {
                                  try {
                                    // CRITICAL: Check if this call block is protected
                                    if (protectedBlockIds.has(blocks[i].id) || protectedCallBlocks.has(blocks[i].id)) {
                                      continue; // Don't remove protected call blocks
                                    }
                                    
                                    // CRITICAL: Also check if parent is protected
                                    try {
                                      const parentBlock = blocks[i].getParent();
                                      if (parentBlock && protectedBlockIds.has(parentBlock.id)) {
                                        continue; // Don't remove blocks with protected parents
                                      }
                                    } catch (e) {
                                      // Ignore errors
                                    }
                                    
                                    // CRITICAL: Double-check that this is not a main code block before disposing
                                    const parentBlock = blocks[i].getParent();
                                    if (parentBlock && parentBlock.type === 'variables_set') {
                                      const varField = parentBlock.getField('VAR');
                                      const varModel = varField ? varField.getVariable() : null;
                                      const varName = varModel ? varModel.name : parentBlock.getFieldValue('VAR');
                                      if (varName === 'path') {
                                        protectedCallBlocks.add(blocks[i].id); // Add to protected set
                                        protectedBlockIds.add(blocks[i].id); // Also add to protected block IDs
                                        continue; // Don't remove call blocks from main code blocks
                                      }
                                    }
                                    if (!blocks[i].isDisposed()) {
                                      blocks[i].dispose(false);
                                    }
                                  } catch (e) {
                                  }
                                }
                              }
                            } else {
                              // No main code blocks - remove duplicates as usual
                              // BUT: Double-check that we're not removing main code blocks
                              // Keep the first one, remove the rest - but check each one first
                              for (let i = 1; i < blocks.length; i++) {
                                try {
                                  // CRITICAL: Check if this call block is protected
                                  if (protectedBlockIds.has(blocks[i].id) || protectedCallBlocks.has(blocks[i].id)) {
                                    continue; // Don't remove protected call blocks
                                  }
                                  
                                  // CRITICAL: Also check if parent is protected
                                  try {
                                    const parentBlock = blocks[i].getParent();
                                    if (parentBlock && protectedBlockIds.has(parentBlock.id)) {
                                      continue; // Don't remove blocks with protected parents
                                    }
                                  } catch (e) {
                                    // Ignore errors
                                  }
                                  
                                  // CRITICAL: Check if this call block is part of a main code block before disposing
                                  const parentBlock = blocks[i].getParent();
                                  if (parentBlock && parentBlock.type === 'variables_set') {
                                    const varField = parentBlock.getField('VAR');
                                    const varModel = varField ? varField.getVariable() : null;
                                    const varName = varModel ? varModel.name : parentBlock.getFieldValue('VAR');
                                    if (varName === 'path') {
                                      protectedCallBlocks.add(blocks[i].id); // Add to protected set
                                      protectedBlockIds.add(blocks[i].id); // Also add to protected block IDs
                                      continue; // Don't remove call blocks from main code blocks
                                    }
                                  }
                                  if (!blocks[i].isDisposed()) {
                                    blocks[i].dispose(false);
                                  }
                                } catch (e) {
                                }
                              }
                            }
                          }
                        });
                        
                        // CRITICAL: If we have main code block calls, make sure they are NOT removed
                        // Even if they appear in rootCallBlocks with empty name
                        if (mainCodeBlockCalls.length > 0) {
                          // Ensure none of the main code block calls are disposed
                          mainCodeBlockCalls.forEach(callBlock => {
                            if (callBlock.isDisposed()) {
                            }
                          });
                        }
                        
                        // After cleanup, check main code blocks again
                        const remainingBlocks = workspaceRef.current.getAllBlocks(false);
                        const remainingMainCodeBlocks = remainingBlocks.filter(block => {
                          try {
                            // CRITICAL: Check if this is the actual main code block (variables_set with VAR="path" and procedures_callreturn inside)
                            if (block.type !== 'variables_set') return false;
                            
                            const varField = block.getField('VAR');
                            const varModel = varField ? varField.getVariable() : null;
                            const varName = varModel ? varModel.name : block.getFieldValue('VAR');
                            
                            // Only count as main code block if:
                            // 1. VAR="path" AND
                            // 2. Has procedures_callreturn inside (not just any path variable)
                            // AND
                            // 3. Is in the protected set (to ensure it's the actual main code block, not just any path variable)
                            if (varName === 'path') {
                              const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                              if (valueConnection) {
                                const valueType = valueConnection.type;
                                if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                                  // This is the actual main code block
                                  // Also verify it's in the protected set (from immediately protected)
                                  // CRITICAL: If the block is in protectedBlockIdsImmediate, it's definitely a main code block
                                  if (protectedBlockIdsImmediate.has(block.id)) {
                                    return true;
                                  }
                                  // Also check if the call block inside is protected
                                  if (protectedBlockIdsImmediate.has(valueConnection.id)) {
                                    return true;
                                  }
                                }
                              }
                            }
                            return false;
                          } catch (e) {
                            return false;
                          }
                        });
                        
                        // CRITICAL: Check if any protected blocks were disposed
                        const protectedBlocksStillExist = remainingBlocks.filter(block => protectedBlockIds.has(block.id));
                        const missingProtectedBlocks = Array.from(protectedBlockIds).filter(id => {
                          return !remainingBlocks.some(block => block.id === id);
                        });
                        
                        if (missingProtectedBlocks.length > 0) {
                          // Check what types of blocks were disposed
                          const missingBlockTypes = missingProtectedBlocks.map(id => {
                            // Try to find the block type from the protected set
                            const block = allBlocks.find(b => b.id === id);
                            return block ? block.type : 'unknown';
                          });
                          // Only show error if main code blocks themselves were disposed
                          // Get main code block IDs from mainCodeBlocksBeforeCleanup (which were checked before procedure cleanup)
                          const mainCodeBlockIdsFromBeforeCleanup = expectedMainCodeBlockIds;
                          const missingMainCodeBlocks = missingProtectedBlocks.filter(id => mainCodeBlockIdsFromBeforeCleanup.includes(id));
                          
                          // Also check if remaining main code blocks match the expected ones
                          const remainingMainCodeBlockIds = remainingMainCodeBlocks.map(b => b.id);
                          const foundMainCodeBlocks = mainCodeBlockIdsFromBeforeCleanup.filter(id => remainingMainCodeBlockIds.includes(id));
                          
                          if (missingMainCodeBlocks.length > 0 || foundMainCodeBlocks.length === 0) {
                          } else {
                            // Main code blocks are still there, missing blocks are likely child blocks
                          }
                        }
                      } catch (e) {
                      }
                      }, 600); // เพิ่ม buffer ให้การลบ unnamed definitions ช้าลง ไม่ดึง call blocks ตามไปด้วย
                    } // End of if (!isLoadingFromPreviousStepRef.current)
                    
                  // XML already loaded above, no need to load again
                  // Reset flag after loading
                  isLoadingFromPreviousStepRef.current = false;
                  } catch (stepXmlErr) {
                    throw stepXmlErr; // Re-throw เพื่อให้ catch block จัดการ
                  }
                }

                // CRITICAL: Check if main code blocks still exist before procedure cleanup
                // This prevents them from being accidentally disposed
                const allBlocksBeforeProcedureCleanup = workspaceRef.current.getAllBlocks(false);
                const mainCodeBlocksBeforeCleanup = allBlocksBeforeProcedureCleanup.filter(block => {
                  try {
                    if (block.type !== 'variables_set') return false;
                    const varField = block.getField('VAR');
                    const varModel = varField ? varField.getVariable() : null;
                    const varName = varModel ? varModel.name : block.getFieldValue('VAR');
                    if (varName === 'path') {
                      const valueConnection = block.getInput('VALUE')?.connection?.targetBlock();
                      if (valueConnection) {
                        const valueType = valueConnection.type;
                        if (valueType === 'procedures_callreturn' || valueType === 'procedures_callnoreturn') {
                          return true;
                        }
                      }
                    }
                    return false;
                  } catch (e) {
                    return false;
                  }
                });
                
                // Get expected IDs from mainCodeBlocksBeforeCleanup (which are the actual main code blocks)
                const expectedMainCodeBlockIds = mainCodeBlocksBeforeCleanup.map(b => b.id);
                // Clean up ONLY invalid/duplicate procedure definitions after loading XML
                // Strategy: 
                // 1. Remove procedures with invalid names (unnamed, undefined, empty)
                // 2. Remove duplicates (same exact name) - keep only the first one
                // 3. DO NOT remove numbered variants (DFS2, DFS3) if they are from step XML
                //    - These are valid procedures that the user created
                const definitionBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                  .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));
                
                // Group by exact procedure name (not base name) to find true duplicates
                const nameToBlocks = new Map(); // exactName -> array of blocks
                
                definitionBlocks.forEach(defBlock => {
                  try {
                    const name = defBlock.getFieldValue('NAME');
                    
                    // Remove blocks with invalid names
                    if (!name || name === 'unnamed' || name === 'undefined' || name.trim() === '') {
                      if (!defBlock.isDisposed()) {
                        defBlock.dispose(false);
                      }
                      return;
                    }
                    
                    // Group by exact name (not base name)
                    if (!nameToBlocks.has(name)) {
                      nameToBlocks.set(name, []);
                    }
                    nameToBlocks.get(name).push(defBlock);
                  } catch (e) {
                  }
                });
                
                // For each exact name, keep only the first one if there are duplicates
                // This removes true duplicates (same exact name) but keeps numbered variants (DFS, DFS2, DFS3)
                nameToBlocks.forEach((blocks, exactName) => {
                  if (blocks.length === 1) {
                    // Only one procedure with this exact name, keep it
                    return;
                  }
                  
                  // Multiple procedures with the same exact name - keep the first one, remove the rest
                  for (let i = 1; i < blocks.length; i++) {
                    const toRemove = blocks[i];
                    try {
                      if (!toRemove.isDisposed()) {
                        toRemove.dispose(false);
                      }
                    } catch (e) {
                    }
                  }
                });
                
                const remainingBlocks = workspaceRef.current.getBlocksByType('procedures_defreturn', false)
                  .concat(workspaceRef.current.getBlocksByType('procedures_defnoreturn', false));

                const allBlocks = workspaceRef.current.getAllBlocks(false);
                // Mark first load as completed
                if (isFirstXmlLoad.current) {
                  isFirstXmlLoad.current = false;
                }
              } catch (innerErr2) {
                if (workspaceRef.current) {
                  workspaceRef.current.clear();
                  // Reload starter XML if error occurs
                  if (hasStarterXml) {
                    try {
                      const xml = Blockly.utils.xml.textToDom(starter_xml);
                      loadXmlDomSafely(xml);
                    } catch (err) {
                    }
                  }
                }
              }
            }, 600); // เพิ่ม buffer ให้ขั้นตอนปิดท้ายช้าลง ป้องกัน call blocks หาย

          } catch (innerErr) {
            if (workspaceRef.current) {
              workspaceRef.current.clear();
              // Reload starter XML if error occurs
              if (hasStarterXml && lastLoadedXmlRef.current === effectKey) {
                setTimeout(() => {
                  // Check effectKey again before reloading
                  if (lastLoadedXmlRef.current !== effectKey) {
                    return;
                  }
                  try {
                    if (!workspaceRef.current) return;
                    const xml = Blockly.utils.xml.textToDom(starter_xml);
                    loadXmlDomSafely(xml);
                  } catch (err) {
                  }
                }, 150);
              }
            }
          }
        }, delay);

      } catch (err) {
        if (workspaceRef.current) {
          workspaceRef.current.clear();
        }
        alert('เกิดข้อผิดพลาดในการโหลด XML สำหรับ Step นี้: ' + (err.message || 'รูปแบบไม่ถูกต้อง'));
      }
    } else {
      // Step has no saved XML - load starter XML if available
      // ถ้า starter XML ถูกโหลดแล้วและ workspace มี blocks อยู่แล้ว - ไม่ต้อง clear
      // เพื่อป้องกันไม่ให้ starter XML หายไป
      const existingBlocks = workspaceRef.current.getAllBlocks(false);
      if (!starterXmlLoadedRef.current || existingBlocks.length === 0) {
        workspaceRef.current.clear();
        
        // Clear variable map เพื่อป้องกัน variable ID conflict
        const variableMap = workspaceRef.current.getVariableMap();
        if (variableMap) {
          const allVariables = variableMap.getAllVariables();
          allVariables.forEach(variable => {
            try {
              variableMap.deleteVariable(variable);
            } catch (e) {
            }
          });
        }
      }
      
      if (hasStarterXml && !starterXmlLoadedRef.current) {
        setTimeout(() => {
          // Check effectKey again before loading
          if (lastLoadedXmlRef.current !== effectKey) {
            return;
          }
          try {
            if (!workspaceRef.current) return;
            
            // Helper function: Remove variable IDs from XML to prevent conflicts
            const removeVariableIdsFromXml = (xmlString) => {
              if (!xmlString) return xmlString;
              // Remove all variable id attributes from XML
              return xmlString.replace(/varid="[^"]*"/g, '');
            };
            
            // Clear variable map อีกครั้งก่อนโหลด (เพื่อป้องกัน variable ID conflict)
            const variableMapBeforeLoad = workspaceRef.current.getVariableMap();
            if (variableMapBeforeLoad) {
              const allVariablesBeforeLoad = variableMapBeforeLoad.getAllVariables();
              allVariablesBeforeLoad.forEach(variable => {
                try {
                  variableMapBeforeLoad.deleteVariable(variable);
                } catch (e) {
                }
              });
            }
            
            // Remove variable IDs from starter XML to prevent conflicts
            const cleanedStarterXml = removeVariableIdsFromXml(starter_xml);
            const xml = Blockly.utils.xml.textToDom(cleanedStarterXml);
            loadXmlDomSafely(xml);
            starterXmlLoadedRef.current = true;
          } catch (err) {
            starterXmlLoadedRef.current = false;
          }
        }, 150);
      } else if (!hasStarterXml) {
        starterXmlLoadedRef.current = false;
      }

      // Mark first load as completed แม้จะไม่มี XML ก็ตาม
      if (isFirstXmlLoad.current) {
        isFirstXmlLoad.current = false;
      }
    }
  }, [currentStepIndex, steps, blocklyLoaded, levelData?.starter_xml, levelData?.id]);

  // Initialize Blockly
  useEffect(() => {
    if (!blocklyRef.current || !levelData || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    // รีเซ็ต ref การโหลดครั้งแรกทุกครั้งที่มีการ inject ใหม่
    isFirstXmlLoad.current = true;
    // Reset starter XML loaded ref when workspace is reinitialized
    // But keep lastLoadedXmlRef to prevent duplicate loads
    starterXmlLoadedRef.current = false;

    setTimeout(() => {
      try {
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }

        if (blocklyRef.current) {
          blocklyRef.current.innerHTML = '';
        }

        initializeImprovedVariableHandling();
        ensureStandardBlocks();

        const toolbox = createToolboxConfig(enabledBlocks);

        const workspaceConfig = {
          toolbox,
          collapse: true,
          comments: true,
          disable: false, // Allow editing
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

        const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
        workspaceRef.current = workspace;
        // CRITICAL: Prevent auto-creation of procedure definitions when placing call blocks
        let isCreatingCallBlock = false;
        
        // Helper function to clean up ALL unwanted procedure definitions
        const cleanupDuplicateProcedures = () => {
          if (skipCleanupRef.current) {
            return;
          }
          // ถ้ากำลังสร้าง call block อยู่ ให้เลื่อน cleanup ออกไปก่อน
          if (isCreatingCallBlock) {
            return;
          }
          if (isXmlLoadingRef.current) {
            return; // Skip cleanup while loading XML
          }

          try {
            const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
              .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
            
            if (definitionBlocks.length === 0) {
              return;
            }
            
            const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
              .concat(workspace.getBlocksByType('procedures_callnoreturn', false));
            
            // Helper: ช่วยผูกชื่อให้ call ที่ยังไม่ตั้งชื่อ
            const fixUnnamedCallBlocks = () => {
              // เลือก def ที่ดีที่สุด: ชื่อไม่ว่าง และมีพารามิเตอร์มากสุด
              const bestDef = definitionBlocks
                .filter(def => {
                  try {
                    const nm = def.getFieldValue('NAME');
                    return nm && nm !== 'unnamed' && nm !== 'undefined' && nm.trim() !== '';
                  } catch (e) { return false; }
                })
                .sort((a, b) => {
                  const count = (def) => {
                    try {
                      const mut = def.mutationToDom && def.mutationToDom();
                      if (mut && mut.childNodes) {
                        return Array.from(mut.childNodes).filter(n => n.nodeName === 'arg').length;
                      }
                    } catch (e) { }
                    return 0;
                  };
                  return count(b) - count(a);
                })[0];

              if (!bestDef) return;
              const bestName = bestDef.getFieldValue('NAME');
              try { lastProcedureNameRef.current = bestName; } catch (e) { }

              callBlocks.forEach(cb => {
                try {
                  const nm = cb.getFieldValue('NAME');
                  if (!nm || nm === 'unnamed' || nm === 'undefined' || !nm.trim()) {
                    cb.getField('NAME')?.setValue(bestName);
                    // sync parameters with bestDef
                    if (cb.setProcedureParameters) {
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
                            try { return workspace.getVariable(p)?.getId() || null; } catch (e) { return null; }
                          }).filter(Boolean);
                        }
                      } catch (e) { }
                      if (params.length && paramIds && params.length === paramIds.length) {
                        cb.setProcedureParameters(params, paramIds, true);
                        if (cb.render) cb.render();
                      }
                    }
                  }
                } catch (e) { }
              });
            };

            // ถ้ามี call block ที่ยังไม่มีชื่อ ให้ข้าม cleanup เพื่อไม่ให้บล็อกหาย
            const hasUnnamedCall = callBlocks.some(cb => {
              try {
                const n = cb.getFieldValue('NAME');
                return !n || n === 'unnamed' || n === 'undefined' || !n.trim();
              } catch (e) { return false; }
            });
            if (hasUnnamedCall) {
              fixUnnamedCallBlocks();
              return;
            }
            
            // ⬇️ เพิ่มส่วนนี้: Protect call blocks from being disposed
            const protectedCallBlockIds = new Set();
            callBlocks.forEach(callBlock => {
              try {
                protectedCallBlockIds.add(callBlock.id);
              } catch (e) { }
            });

            // Get names of procedures that are actually being called
            const calledProcedureNames = new Set();
            callBlocks.forEach(callBlock => {
              try {
                const name = callBlock.getFieldValue('NAME');
                if (name && name !== 'unnamed' && name !== 'undefined') {
                  calledProcedureNames.add(name);
                }
              } catch (e) { }
            });
            
            const hasCallers = (name) => {
              try {
                const callers = Blockly.Procedures.getCallers(name || '', workspace) || [];
                return callers.length > 0;
              } catch (e) {
                return false;
              }
            };
            
            // Group by procedure name and remove invalid/duplicate ones
            const validProcedures = new Map();
            
            definitionBlocks.forEach(defBlock => {
              try {
                const name = defBlock.getFieldValue('NAME');
                
                // ⬇️ แก้ไข: Remove ONLY unnamed/undefined blocks immediately
                if (!name || name === 'unnamed' || name === 'undefined' || name.trim() === '') {
                  // ⬇️ เพิ่ม: Check if removing this will break call blocks
                  const willBreakCallBlocks = callBlocks.some(cb => {
                    try {
                      // Check if call block is connected to this definition
                      const cbName = cb.getFieldValue('NAME');
                      return cbName === name || cbName === 'unnamed' || cbName === 'undefined';
                    } catch (e) {
                      return false;
                    }
                  });

                  // ⬇️ แก้ไข: Don't remove if it would break call blocks
                  if (!willBreakCallBlocks && !hasCallers(name) && !defBlock.isDisposed()) {
                    defBlock.dispose(false);
                  }
                  return;
                }
                
                // Keep track of valid procedures (first occurrence of each name)
                if (!validProcedures.has(name)) {
                  validProcedures.set(name, defBlock);
                } else {
                  // Duplicate with same name
                  const isBeingUsedByCallName = callBlocks.some(cb => {
                    try { return cb.getFieldValue('NAME') === name; } catch (e) { return false; }
                  });
                  const isBeingUsedByCallers = hasCallers(name);
                  const keepDef = validProcedures.get(name);
                  // If the first one was disposed already, replace it
                  if (!keepDef || keepDef.isDisposed()) {
                    validProcedures.set(name, defBlock);
                    return;
                  }
                  // Disable disposing duplicates to avoid breaking callers; keep both if any usage
                  if (!isBeingUsedByCallName && !isBeingUsedByCallers) {
                    // Optionally could dispose unused duplicates, but safer to keep
                    // defBlock.dispose(false);
                  }
                }
              } catch (e) { }
            });
          } catch (e) { }
        };
        // Expose cleanup so loader can call once XML injection finishes
        cleanupDuplicateProceduresRef.current = cleanupDuplicateProcedures;
        
        workspace.addChangeListener((event) => {
          // Skip all change handling while XML is being programmatically loaded
          if (isXmlLoadingRef.current) {
            return;
          }
          // ⬇️ เพิ่ม: Track if we're disposing a definition block
          if (event.type === Blockly.Events.BLOCK_DELETE) {
            // oldXml can be a string or an Element; guard parsing to avoid DOMParser errors
            let deletedBlock = null;
            try {
              if (event.oldXml) {
                if (typeof event.oldXml === 'string') {
                  deletedBlock = Blockly.utils.xml.textToDom(event.oldXml);
                } else if (event.oldXml.nodeType === 1) {
                  deletedBlock = event.oldXml; // already an Element
                }
              }
            } catch (e) {
              deletedBlock = null;
            }

            if (deletedBlock) {
              const blockType = deletedBlock.getAttribute('type');
              if (blockType === 'procedures_defreturn' || blockType === 'procedures_defnoreturn') {
                // A definition was deleted - check if call blocks are orphaned
                setTimeout(() => {
                  const callBlocks = workspace.getBlocksByType('procedures_callreturn', false)
                    .concat(workspace.getBlocksByType('procedures_callnoreturn', false));

                  const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                    .concat(workspace.getBlocksByType('procedures_defnoreturn', false));

                  const validNames = new Set();
                  definitionBlocks.forEach(def => {
                    try {
                      const name = def.getFieldValue('NAME');
                      if (name && name !== 'unnamed' && name !== 'undefined') {
                        validNames.add(name);
                      }
                    } catch (e) { }
                  });

                  // Fix orphaned call blocks
                  callBlocks.forEach(callBlock => {
                    try {
                      const name = callBlock.getFieldValue('NAME');
                      if (!validNames.has(name) && validNames.size > 0) {
                        const firstValidName = Array.from(validNames)[0];
                        callBlock.getField('NAME').setValue(firstValidName);
                      }
                    } catch (e) { }
                  });
                }, 50);
              }
            }
          }
          // Track definition name updates for fallback naming
          if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE) {
            const blk = workspace.getBlockById(event.blockId);
            if (blk && (blk.type === 'procedures_defreturn' || blk.type === 'procedures_defnoreturn')) {
              try {
                const nm = blk.getFieldValue('NAME');
                if (nm && nm.trim()) {
                  lastProcedureNameRef.current = nm;
                }
              } catch (e) { }
            }
          }

          // Clean up duplicate procedures on any change (skip while creating call blocks)
          if (event.type === Blockly.Events.BLOCK_CREATE || 
              event.type === Blockly.Events.BLOCK_CHANGE ||
              event.type === Blockly.Events.BLOCK_DELETE) {
            if (skipCleanupRef.current || isCreatingCallBlock) {
              return;
            }
            const hasUnnamedCallNow = workspace.getBlocksByType('procedures_callreturn', false)
              .concat(workspace.getBlocksByType('procedures_callnoreturn', false))
              .some(cb => {
                try {
                  const n = cb.getFieldValue('NAME');
                  return !n || n === 'unnamed' || n === 'undefined' || !n.trim();
                } catch (e) { return false; }
              });
            if (hasUnnamedCallNow) {
              // เติมชื่อด้วย def ที่ดีที่สุดแล้วค่อยให้ cleanup รอบหน้า
              const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
              const bestDef = definitionBlocks.filter(def => {
                try {
                  const nm = def.getFieldValue('NAME');
                  return nm && nm !== 'unnamed' && nm !== 'undefined' && nm.trim() !== '';
                } catch (e) { return false; }
              }).sort((a, b) => {
                const cnt = (d) => {
                  try {
                    const mut = d.mutationToDom && d.mutationToDom();
                    if (mut && mut.childNodes) {
                      return Array.from(mut.childNodes).filter(n => n.nodeName === 'arg').length;
                    }
                  } catch (e) {}
                  return 0;
                };
                return cnt(b) - cnt(a);
              })[0];
              if (bestDef) {
                const bestName = bestDef.getFieldValue('NAME');
                workspace.getBlocksByType('procedures_callreturn', false)
                  .concat(workspace.getBlocksByType('procedures_callnoreturn', false))
                  .forEach(cb => {
                    try {
                      const n = cb.getFieldValue('NAME');
                      if (!n || n === 'unnamed' || n === 'undefined' || !n.trim()) {
                        cb.getField('NAME')?.setValue(bestName);
                        if (cb.render) cb.render();
                      }
                    } catch (e) { }
                  });
              }
              return;
            }
            
            // ล้าง timeout เก่าถ้ามี (debouncing)
            if (cleanupTimeoutRef.current) {
              clearTimeout(cleanupTimeoutRef.current);
            }
            
            // Debounce cleanup - รอให้ events เงียบ 300ms แทน 1500ms
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
            }, 300); // ลดจาก 1500ms เป็น 300ms
          }
          
          // Track when call blocks are being created
          if (event.type === Blockly.Events.BLOCK_CREATE) {
            const block = workspace.getBlockById(event.blockId);
            if (block && (block.type === 'procedures_callreturn' || block.type === 'procedures_callnoreturn')) {
              isCreatingCallBlock = true;
              skipCleanupRef.current = true;
              // CRITICAL: Fix call block name immediately (no delay) to prevent cleanup from deleting it
                try {
                  const nameField = block.getField('NAME');
                  if (nameField) {
                    const currentName = nameField.getValue();
                    
                    // Get valid procedure names
                    const definitionBlocks = workspace.getBlocksByType('procedures_defreturn', false)
                      .concat(workspace.getBlocksByType('procedures_defnoreturn', false));
                    
                    const validProcedureNames = new Set();
                    definitionBlocks.forEach(defBlock => {
                      try {
                        const name = defBlock.getFieldValue('NAME');
                        if (name && name !== 'unnamed' && name !== 'undefined' && name.trim() !== '') {
                          validProcedureNames.add(name);
                        lastProcedureNameRef.current = name;
                        }
                    } catch (e) { }
                    });
                    
                    // If call block has empty/invalid name, fix it immediately
                    if (!currentName || currentName === 'unnamed' || currentName === 'undefined' || currentName.trim() === '') {
                      if (validProcedureNames.size > 0) {
                        const firstValidName = Array.from(validProcedureNames)[0];
                        nameField.setValue(firstValidName);
                    } else if (lastProcedureNameRef.current) {
                      nameField.setValue(lastProcedureNameRef.current);
                    } else {
                      nameField.setValue(defaultProcedureName);
                      }
                    } else if (!validProcedureNames.has(currentName)) {
                      // Name exists but procedure doesn't - use first valid name
                      if (validProcedureNames.size > 0) {
                        const firstValidName = Array.from(validProcedureNames)[0];
                        nameField.setValue(firstValidName);
                    } else if (lastProcedureNameRef.current) {
                      nameField.setValue(lastProcedureNameRef.current);
                    } else {
                      nameField.setValue(defaultProcedureName);
                    }
                  }
                  
                  // Sync parameters/varids on call block with its definition if available
                  try {
                    const matchedDef = definitionBlocks.find(def => {
                      try { return def.getFieldValue('NAME') === nameField.getValue(); } catch (e) { return false; }
                    });
                    if (matchedDef && block.setProcedureParameters) {
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
                        if (block.render) block.render();
                          }
                        }
                  } catch (e) { }
                  }
                } catch (e) {
                }
              // ให้เวลานานขึ้นก่อนเปิด cleanup อีกครั้ง
              setTimeout(() => {
                isCreatingCallBlock = false;
              skipCleanupRef.current = false;
              }, 3500);
            }
          }
          
          // If a definition block is created while we're creating a call block, delete it
          if (event.type === Blockly.Events.BLOCK_CREATE) {
            const block = workspace.getBlockById(event.blockId);
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
          }
        });
        
        // Reset lastLoadedXmlRef when workspace is reinitialized to allow first load
        lastLoadedXmlRef.current = null;
        
        // Set blocklyLoaded AFTER workspace is ready to trigger XML loading
        // Use setTimeout to ensure workspace is fully initialized
        // Increased delay to 300ms to ensure workspace is fully ready before loading XML
        setTimeout(() => {
          setBlocklyLoaded(true);
        }, 300);

        ensureCommonVariables(workspace);

      } catch (error) {
        setError('เกิดข้อผิดพลาดในการสร้าง workspace');
      }
    }, 100);
  }, [levelData, enabledBlocks]); // ✅ ลบ currentStepIndex ออกจาก dependencies

  const saveCurrentStep = useCallback(async () => {
    if (!workspaceRef.current) {
      console.error('❌ [saveCurrentStep] Workspace not ready');
      return false;
    }

    try {
      // Get current workspace XML
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      // Check if XML has actual blocks (not just empty XML tag)
      const hasBlocks = xmlText.includes('<block') || xmlText.includes('<shadow');
      if (!hasBlocks) {
        console.warn('⚠️ [saveCurrentStep] Step', currentStepIndex, 'has no blocks');
      }

      // Create step data with full XML
      const stepData = {
        step: currentStepIndex,
        xmlCheck: xmlText,
        xml: xmlText,
      };

      // Update cache by step index
      stepsXmlCacheRef.current[currentStepIndex] = xmlText;

      // Update ref first (synchronous)
      const currentSteps = [...stepsRef.current];
      if (currentSteps[currentStepIndex]) {
        // Update existing step
        currentSteps[currentStepIndex] = {
          ...currentSteps[currentStepIndex],
          ...stepData
        };
      } else {
        // Add new step
        currentSteps[currentStepIndex] = stepData;
      }

      stepsRef.current = currentSteps;
      
      // Then update state (asynchronous)
      setSteps(currentSteps);

      // Wait for React to process state update
      await new Promise(resolve => setTimeout(resolve, 50));

      return true;
    } catch (error) {
      console.error('❌ [saveCurrentStep] Error:', error);
      return false;
    }
  }, [currentStepIndex]);

  const handleNextStep = async () => {
    const saved = await saveCurrentStep();
    if (!saved) { alert('ไม่สามารถบันทึก step ปัจจุบันได้'); return; }
    await new Promise(r => setTimeout(r, 50));
    prevStepIndexRef.current = currentStepIndex; // สำคัญ: ตั้งก่อนที่ effect จะรัน
    setCurrentStepIndex(currentStepIndex + 1);
  };

  const handlePreviousStep = async () => {
    if (currentStepIndex <= 0) return;
    const saved = await saveCurrentStep();
    if (!saved) return;
    await new Promise(r => setTimeout(r, 50));
    prevStepIndexRef.current = currentStepIndex; // สำคัญ
    setCurrentStepIndex(currentStepIndex - 1);
  };

  const handleFinish = async () => {
    // 1. Save current step first
    if (!workspaceRef.current) {
      alert('Workspace ไม่พร้อม');
      return;
    }

    // CRITICAL: Save current step before finishing
    const saved = await saveCurrentStep();
    if (!saved) {
      alert('ไม่สามารถบันทึก step สุดท้ายได้');
      return;
    }

    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get final steps from ref (most up-to-date)
    const finalSteps = stepsRef.current.length > 0 ? stepsRef.current : steps;

    if (finalSteps.length === 0) {
      alert('กรุณาเพิ่มอย่างน้อย 1 step');
      return;
    }

    if (!patternName.trim()) {
      alert('กรุณากรอกชื่อรูปแบบคำตอบ');
      return;
    }

    // ใช้ XML จาก step สุดท้ายที่บันทึก (ถ้ามี) เป็น pattern รวม
    const lastStepIndex = finalSteps.length - 1;
    const lastStep = finalSteps[lastStepIndex];
    let finalPatternXml = lastStep?.xmlCheck || lastStep?.xml || '';

    // Fallback มาที่ workspace ปัจจุบันถ้า step สุดท้ายไม่มี XML
    if (!finalPatternXml || !finalPatternXml.trim()) {
      const fallbackXml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      finalPatternXml = Blockly.Xml.domToText(fallbackXml);
    }

    // 4. Prepare hints array - per-step XML only (no cross-step fill). ใช้ cache ถ้าสต็ปนั้นหาย
    let lastNonEmptyForHints = '';
    const hasBlocks = (xmlString) => xmlString && (xmlString.includes('<block') || xmlString.includes('<shadow'));
    const hints = finalSteps.map((step, index) => {
      let xmlCheck = step.xmlCheck || step.xml || stepsXmlCacheRef.current[index] || '';
      if (!xmlCheck || !xmlCheck.trim() || !hasBlocks(xmlCheck)) {
        // fallback to last non-empty with blocks
        if (hasBlocks(lastNonEmptyForHints)) {
          xmlCheck = lastNonEmptyForHints;
        } else if (hasBlocks(finalPatternXml)) {
          xmlCheck = finalPatternXml;
        } else {
          console.warn(`⚠️ Step ${index + 1} has no XML. Question: ${step.question || 'N/A'}`);
          xmlCheck = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
        }
      }
      xmlCheck = xmlCheck.trim();
      if (hasBlocks(xmlCheck)) {
        lastNonEmptyForHints = xmlCheck;
      }
      return {
        step: index,
        trigger: "onXmlMatch",
        xmlCheck,
      };
    });
    // Log hints before sending
    // 5. Save pattern
    try {
      setSaving(true);

      const patternData = {
        level_id: parseInt(levelId),
        pattern_type_id: null, // Always auto-evaluated
        weapon_id: weaponId ? parseInt(weaponId) : null,
        pattern_name: patternName.trim(),
        description: patternDescription ? patternDescription.trim() : null,
        xmlpattern: finalPatternXml || null,
        hints: hints,
        bigO: bigO || null,
        block_keywords: null, // No longer needed - using block_key from level_category instead
      };

      // Log pattern data before sending (without full XML to avoid console spam)
      let result;
      if (isEditMode && patternId) {
        // Update existing pattern
        result = await updatePattern(getToken, patternId, patternData);
        alert('อัพเดทรูปแบบคำตอบสำเร็จ');
      } else {
        // Create new pattern
        result = await createPattern(getToken, patternData);
        alert('บันทึกรูปแบบคำตอบสำเร็จ');
      }

      const savedPatternId = result.pattern?.pattern_id || patternId;

      // Navigate to preview page with the pattern
      if (savedPatternId) {
        navigate(`/admin/levels/${levelId}/preview/${savedPatternId}`);
      } else {
        navigate(`/admin/levels/${levelId}/preview`);
      }
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการ${isEditMode ? 'อัพเดท' : 'บันทึก'}: ` + (error.message || 'ไม่ทราบสาเหตุ'));
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

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="mx-auto" />
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
          title={isEditMode ? "แก้ไขรูปแบบคำตอบ" : "เพิ่มรูปแบบคำตอบ"}
          subtitle={levelData?.level_name || 'Loading...'}
          backPath={`/admin/levels/${levelId ? `edit/${levelId}` : ''}`}
          rightContent={
             <Button
                onClick={handleFinish}
                disabled={saving || !patternName.trim()}
                className="ml-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-0 min-w-[140px] font-bold tracking-wide"
                size="default"
              >
                {saving ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'สิ้นสุดและบันทึก')}
              </Button>
          }
        />

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
           {/* Left Sidebar: Tools & Properties */}
           <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
               <Tabs defaultValue="settings" className="flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                   <div className="px-4 pt-4 bg-white border-b border-gray-100">
                     <TabsList className="w-full p-1 bg-white border border-gray-200 rounded-lg">
                        <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                           <Settings className="w-3 h-3 mr-2" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="steps" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-blue-600 text-xs uppercase font-bold tracking-wider py-2 shadow-sm">
                           <ListOrdered className="w-3 h-3 mr-2" /> Steps
                        </TabsTrigger>
                     </TabsList>
                   </div>

                   <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar bg-gray-50/50">
                      <TabsContent value="settings" className="space-y-6 mt-0">
                         <PatternInfoForm
                            patternName={patternName}
                            setPatternName={setPatternName}
                            patternDescription={patternDescription}
                            setPatternDescription={setPatternDescription}
                            weaponId={weaponId}
                            setWeaponId={setWeaponId}
                            bigO={bigO}
                            setBigO={setBigO}
                            isEditMode={isEditMode}
                            patternLoaded={patternLoaded}
                          />
                      </TabsContent>

                      <TabsContent value="steps" className="space-y-6 mt-0">
                         <div className="bg-white rounded-lg shadow p-6">
                           <h2 className="text-xl font-bold mb-4">
                             Step {currentStepIndex + 1}
                           </h2>
                           <div className="text-sm text-gray-600 mb-4">
                             Step ที่บันทึกแล้ว: {steps.length}
                           </div>
                           <div className="text-sm text-gray-500 mb-4">
                             คำใบ้ (Hints) จะถูกจัดการจากตาราง Level Hints แทน
                           </div>
                           <div className="flex gap-2">
                             <Button
                               onClick={handlePreviousStep}
                               disabled={currentStepIndex === 0}
                               variant="outline"
                               className="flex-1"
                             >
                               ← ก่อนหน้า
                             </Button>
                             <Button
                               onClick={handleNextStep}
                               variant="outline"
                               className="flex-1"
                             >
                               ถัดไป →
                             </Button>
                           </div>
                         </div>
                      </TabsContent>
                   </div>
               </Tabs>
           </div>

           {/* Right: Blockly Workspace */}
           <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden relative">
              <div className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
                  <span className="text-xs font-bold text-black uppercase tracking-wider">Blockly Workspace</span>
                  <div className="text-xs text-gray-500">
                    Step {currentStepIndex + 1} of {steps.length || 1}
                  </div>
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
                    currentStepIndex={currentStepIndex}
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

export default PatternCreateEdit;
