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
import AdminPageHeader from '@/components/admin/headers/AdminPageHeader';
import { Settings, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import new components
import PatternInfoForm from '@/components/admin/pattern/PatternInfoForm';
import StepEditor from '@/components/admin/pattern/StepEditor';
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

  const [levelData, setLevelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabledBlocks, setEnabledBlocks] = useState({});
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);
  const [patternData, setPatternData] = useState(null); // Store loaded pattern data
  const [patternLoaded, setPatternLoaded] = useState(false); // Track if pattern data has been loaded

  // Pattern form states
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');
  const [weaponId, setWeaponId] = useState('');
  const [patternTypes, setPatternTypes] = useState([]);

  // Step management
  const [steps, setSteps] = useState([]);

  // Debug log after all states are declared
  console.log('🔍 PatternCreateEdit component render:', {
    levelId,
    patternId,
    isEditMode,
    patternName,
    patternDescription,
    weaponId,
    stepsLength: steps.length,
    patternLoaded,
    allParams: { levelId, patternId }
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepQuestion, setCurrentStepQuestion] = useState('');
  const [currentStepReasoning, setCurrentStepReasoning] = useState('');
  const [currentStepSuggestion, setCurrentStepSuggestion] = useState('');
  const [currentStepDifficulty, setCurrentStepDifficulty] = useState('basic');
  const [currentStepHighlightBlocks, setCurrentStepHighlightBlocks] = useState('');
  const [saving, setSaving] = useState(false);

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
        console.error('Error loading pattern types:', err);
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
        console.error('Error loading level data:', err);
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
      console.log('🔍 Loading pattern data:', { isEditMode, patternId, patternLoaded });

      if (!isEditMode || !patternId || patternLoaded) {
        console.log('⏸️ Skipping pattern load - not in edit mode, no patternId, or already loaded');
        return;
      }

      try {
        setLoading(true);
        console.log('📡 Fetching pattern data for patternId:', patternId);
        const fetchedPatternData = await fetchPatternById(getToken, patternId);
        console.log('📦 Fetched pattern data:', fetchedPatternData);

        // Backend returns pattern directly, not wrapped in { pattern: ... }
        const pattern = fetchedPatternData?.pattern || fetchedPatternData;

        if (pattern && pattern.pattern_id) {
          console.log('✅ Pattern found:', pattern);

          // Store pattern data
          setPatternData(pattern);
          setPatternLoaded(true);

          // Set form fields
          setPatternName(pattern.pattern_name || '');
          setPatternDescription(pattern.description || '');
          setWeaponId(pattern.weapon_id ? pattern.weapon_id.toString() : '');


          // Parse hints if it's a string
          let hintsArray = pattern.hints;
          if (typeof pattern.hints === 'string') {
            try {
              hintsArray = JSON.parse(pattern.hints);
            } catch (e) {
              console.error('Error parsing hints JSON:', e);
              hintsArray = [];
            }
          }

          // Load steps from hints
          if (hintsArray && Array.isArray(hintsArray) && hintsArray.length > 0) {
            console.log('📚 Loading steps from hints:', hintsArray.length);
            const loadedSteps = hintsArray.map((hint, index) => ({
              // ใช้ 'step' แทน 'stepNumber' ให้ตรงกับที่บันทึก
              step: index,
              question: hint.content?.question || '',
              reasoning: hint.content?.reasoning || '',
              suggestion: hint.content?.suggestion || '',
              difficulty: hint.difficulty || 'basic',
              highlightBlocks: hint.visualGuide?.highlightBlocks || [],
              xml: hint.xmlCheck || ''
            }));
            console.log('📚 Loaded steps:', loadedSteps.map(s => ({ index: s.step, hasXml: !!s.xml })));
            setSteps(loadedSteps);
            // อัปเดต ref ด้วย
            stepsRef.current = loadedSteps;
            // Reset to first step index (0) if not already set or invalid
            setCurrentStepIndex(0);

          } else {
            console.log('⚠️ No hints found in pattern, creating initial empty step.');
            setSteps([]);
            setCurrentStepIndex(0);
          }
        } else {
          console.warn('⚠️ Pattern data not found in response');
        }
      } catch (err) {
        console.error('❌ Error loading pattern data:', err);
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
        console.log('⚠️ currentStepIndex out of bounds, resetting to steps.length');
        setCurrentStepIndex(steps.length > 0 ? steps.length - 1 : 0);
      }
    }
  }, [steps, currentStepIndex]);

  // Populate form data when currentStepIndex or steps change (ทำงานก่อนการโหลด XML)
  useEffect(() => {
    console.log('🔄 Step sync effect triggered (Form Population):', {
      currentStepIndex,
      stepsLength: steps.length
    });

    // 1. กรณีเป็น Step ใหม่ หรือไม่มี Steps เลย
    if (currentStepIndex >= steps.length || steps.length === 0) {
      console.log('📝 New step / No steps - resetting form');
      setCurrentStepQuestion('');
      setCurrentStepReasoning('');
      setCurrentStepSuggestion('');
      setCurrentStepDifficulty('basic');
      setCurrentStepHighlightBlocks('');
      return;
    }

    // 2. กรณีเป็น Step ที่มีอยู่แล้ว
    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      console.warn('⚠️ Current step data not found at index:', currentStepIndex);
      return;
    }

    console.log('📝 Populating form data for step:', currentStepIndex, {
      hasHighlightBlocks: !!currentStep.highlightBlocks
    });

    // Populate form data
    setCurrentStepQuestion(currentStep.question || '');
    setCurrentStepReasoning(currentStep.reasoning || '');
    setCurrentStepSuggestion(currentStep.suggestion || '');
    setCurrentStepDifficulty(currentStep.difficulty || 'basic');

    // Handle highlightBlocks
    const highlightBlocksValue = currentStep.highlightBlocks;
    if (Array.isArray(highlightBlocksValue)) {
      setCurrentStepHighlightBlocks(highlightBlocksValue.join(', '));
    } else if (typeof highlightBlocksValue === 'string') {
      setCurrentStepHighlightBlocks(highlightBlocksValue);
    } else {
      setCurrentStepHighlightBlocks('');
    }

    console.log('✅ Form data populated successfully for step:', currentStepIndex);
  }, [currentStepIndex, steps]);

  // Load XML into workspace when workspace is ready and step changes
  useEffect(() => {
    // Only load XML if workspace is ready
    if (!workspaceRef.current || !blocklyLoaded) {
      return;
    }

    console.log('📦 XML Load Effect Triggered (Workspace Load):', {
      currentStepIndex,
      stepsLength: steps.length,
      isFirstXmlLoad: isFirstXmlLoad.current // Debug check
    });

    // 1. ตรวจสอบว่ามี Step ที่ถูกต้องหรือไม่
    if (currentStepIndex < 0 || currentStepIndex > steps.length) {
      console.log('⚠️ Invalid step index - clearing workspace');
      workspaceRef.current.clear();
      return;
    }

    // 2. สำหรับ Step ใหม่ (Index = steps.length) ให้เคลียร์ Workspace เท่านั้น
    if (currentStepIndex === steps.length) {
      console.log('📝 Currently on a NEW step - clearing workspace');
      workspaceRef.current.clear();
      return;
    }

    // 3. โหลด Step XML สำหรับ Step ที่มีอยู่แล้ว
    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      console.warn('⚠️ Current step not found at index:', currentStepIndex);
      workspaceRef.current.clear();
      return;
    }

    const xmlToLoad = currentStep.xml;

    // กำหนด Delay: 200ms สำหรับ Initial load (Step 0) เพื่อให้ Blockly มีเวลาในการสร้างตัวเองให้เสร็จ
    // 50ms สำหรับการเปลี่ยน Step ทั่วไป
    let delay = 50;
    if (isFirstXmlLoad.current && currentStepIndex === 0) {
      delay = 200;
      console.log(`📦 Initial load detected for Step 1, using ${delay}ms delay.`);
    }

    console.log('📦 Step XML check:', {
      stepIndex: currentStepIndex,
      hasStepXml: !!xmlToLoad,
      xmlLength: xmlToLoad ? xmlToLoad.length : 0,
      delay
    });

    // ... existing code ...

    if (xmlToLoad && xmlToLoad.trim()) {
      try {
        console.log('📝 Loading XML into workspace for step:', currentStepIndex);

        // เคลียร์ workspace ก่อน
        workspaceRef.current.clear();

        setTimeout(() => {
          try {
            if (!workspaceRef.current) {
              console.warn('⚠️ Workspace no longer available');
              return;
            }

            // ใช้ xmlToLoad ที่จับมานอก setTimeout เพื่อความปลอดภัย
            if (steps[currentStepIndex]?.xml !== xmlToLoad) {
              console.log('⏸️ State changed during delay, skipping XML load.');
              return;
            }

            // Clear workspace อีกครั้งใน setTimeout เพื่อให้แน่ใจว่า workspace ว่างก่อนโหลด XML
            workspaceRef.current.clear();

            // รอสักครู่เพื่อให้ clear() ทำงานเสร็จ
            setTimeout(() => {
              try {
                if (!workspaceRef.current) {
                  console.warn('⚠️ Workspace no longer available in nested setTimeout');
                  return;
                }

                if (steps[currentStepIndex]?.xml !== xmlToLoad) {
                  console.log('⏸️ State changed during nested delay, skipping XML load.');
                  return;
                }

                const xmlDom = Blockly.utils.xml.textToDom(xmlToLoad);
                Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);

                const allBlocks = workspaceRef.current.getAllBlocks(false);
                console.log('✅ Step XML loaded successfully. Blocks in workspace:', allBlocks.length);

                // Mark first load as completed
                if (isFirstXmlLoad.current) {
                  isFirstXmlLoad.current = false;
                }
              } catch (innerErr2) {
                console.error('❌ Error in nested setTimeout XML load:', innerErr2);
                if (workspaceRef.current) {
                  workspaceRef.current.clear();
                }
              }
            }, 10); // รอ 10ms เพื่อให้ clear() ทำงานเสร็จ

          } catch (innerErr) {
            console.error('❌ Error in setTimeout XML load:', innerErr);
            if (workspaceRef.current) {
              workspaceRef.current.clear();
            }
          }
        }, delay);

      } catch (err) {
        console.error('❌ Error loading step XML:', err);
        if (workspaceRef.current) {
          workspaceRef.current.clear();
        }
        alert('เกิดข้อผิดพลาดในการโหลด XML สำหรับ Step นี้: ' + (err.message || 'รูปแบบไม่ถูกต้อง'));
      }
    } else {
      console.log('⚠️ No XML available for step - clearing workspace');
      workspaceRef.current.clear();

      // Mark first load as completed แม้จะไม่มี XML ก็ตาม
      if (isFirstXmlLoad.current) {
        isFirstXmlLoad.current = false;
      }
    }
  }, [currentStepIndex, steps, blocklyLoaded]);

  // Initialize Blockly
  useEffect(() => {
    console.log('🔧 Blockly initialization check:', {
      hasBlocklyRef: !!blocklyRef.current,
      hasLevelData: !!levelData,
      enabledBlocksCount: Object.keys(enabledBlocks).length,
      enabledBlocks: Object.keys(enabledBlocks)
    });

    if (!blocklyRef.current || !levelData || Object.keys(enabledBlocks).length === 0) {
      console.log('⏸️ Blockly initialization skipped - missing requirements');
      return;
    }

    // รีเซ็ต ref การโหลดครั้งแรกทุกครั้งที่มีการ inject ใหม่
    isFirstXmlLoad.current = true;

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
        setBlocklyLoaded(true);
        console.log('✅ Blockly workspace initialized');

        ensureCommonVariables(workspace);

      } catch (error) {
        console.error('Error initializing workspace:', error);
        setError('เกิดข้อผิดพลาดในการสร้าง workspace');
      }
    }, 100);
  }, [levelData, enabledBlocks]); // ✅ ลบ currentStepIndex ออกจาก dependencies

  const saveCurrentStep = useCallback(async () => {
    if (!workspaceRef.current) {
      console.warn('⚠️ Cannot save step - workspace not ready');
      return false;
    }

    try {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);

      console.log('💾 Saving step:', {
        stepIndex: currentStepIndex,
        xmlLength: xmlText.length,
      });

      // Parse highlightBlocks from comma-separated string
      const highlightBlocks = currentStepHighlightBlocks
        .split(',')
        .map(block => block.trim())
        .filter(block => block.length > 0);

      // สร้าง step data
      const stepData = {
        step: currentStepIndex,
        xmlCheck: xmlText,
        xml: xmlText, // เก็บไว้ใน xml ด้วย
        question: currentStepQuestion,
        reasoning: currentStepReasoning,
        suggestion: currentStepSuggestion,
        difficulty: currentStepDifficulty,
        highlightBlocks: highlightBlocks,
      };

      // อัปเดต ref ก่อน (ให้ effect อื่นเห็นค่าใหม่ทันที)
      const currentSteps = [...stepsRef.current];
      if (currentSteps[currentStepIndex]) {
        currentSteps[currentStepIndex] = {
          ...currentSteps[currentStepIndex],
          ...stepData
        };
        console.log('✅ Updated existing step in ref:', currentStepIndex);
      } else {
        currentSteps[currentStepIndex] = stepData;
        console.log('✅ Created new step in ref:', currentStepIndex);
      }
      stepsRef.current = currentSteps;
      
      // แล้วค่อยอัปเดต state
      setSteps(currentSteps);

      console.log('💾 Step saved successfully. Total steps:', currentSteps.length);

      // รอให้ React update cycle เสร็จ
      await new Promise(resolve => setTimeout(resolve, 50));

      return true;
    } catch (error) {
      console.error('❌ Error saving step:', error);
      return false;
    }
  }, [currentStepIndex, currentStepQuestion, currentStepReasoning, currentStepSuggestion, currentStepDifficulty, currentStepHighlightBlocks]);

  const handleNextStep = async () => {
    console.log('➡️ Next step clicked. Current step:', currentStepIndex);

    // 1. Save current step first (รอให้เสร็จ)
    const saved = await saveCurrentStep();
    if (!saved) {
      alert('ไม่สามารถบันทึก step ปัจจุบันได้');
      return;
    }

    const nextIndex = currentStepIndex + 1;
    console.log('➡️ Moving to next step:', { from: currentStepIndex, to: nextIndex, totalSteps: stepsRef.current.length });

    // 2. เปลี่ยน index
    setCurrentStepIndex(nextIndex);
  };

  const handlePreviousStep = async () => {
    if (currentStepIndex > 0) {
      console.log('⬅️ Previous step clicked. Current step:', currentStepIndex);

      // 1. Save current step first (รอให้เสร็จ)
      await saveCurrentStep();

      const prevIndex = currentStepIndex - 1;
      console.log('⬅️ Moving to previous step:', { from: currentStepIndex, to: prevIndex });

      // 2. เปลี่ยน index
      setCurrentStepIndex(prevIndex);
    }
  };

  const handleFinish = async () => {
    // 1. Save current step first - get XML from current workspace
    if (!workspaceRef.current) {
      alert('Workspace ไม่พร้อม');
      return;
    }

    // ใช้วิธี saveCurrentStep ก่อนเพื่อเก็บข้อมูลฟอร์มล่าสุดและ XML ของ Step ปัจจุบัน
    const saved = saveCurrentStep();
    if (!saved) {
      alert('ไม่สามารถบันทึก step สุดท้ายได้');
      return;
    }

    // รอให้ state update และใช้ ref เพื่อเก็บ steps ล่าสุด
    await new Promise(resolve => setTimeout(resolve, 150));

    // ใช้ steps จาก ref (ซึ่งถูกอัปเดตใน saveCurrentStep) หรือจาก state
    const finalSteps = stepsRef.current.length > 0 ? stepsRef.current : steps;

    if (finalSteps.length === 0) {
      alert('กรุณาเพิ่มอย่างน้อย 1 step');
      return;
    }

    if (!patternName.trim()) {
      alert('กรุณากรอกชื่อรูปแบบคำตอบ');
      return;
    }

    // 3. Get the final pattern XML from the current workspace (ซึ่งเป็น XML เต็มรูปแบบของ Step สุดท้าย)
    const finalXml = Blockly.Xml.workspaceToDom(workspaceRef.current);
    const finalPatternXml = Blockly.Xml.domToText(finalXml);

    // 4. Prepare hints array in the required format
    const hints = finalSteps.map((step, index) => {
      const highlightBlocks = Array.isArray(step.highlightBlocks)
        ? step.highlightBlocks
        : (step.highlightBlocks ? step.highlightBlocks.split(',').map(b => b.trim()).filter(b => b) : []);

      // ตรวจสอบและเตรียม xmlCheck - ต้องมี XML สำหรับแต่ละ step
      const xmlCheck = step.xmlCheck || step.xml || '';
      if (!xmlCheck || !xmlCheck.trim()) {
        console.warn(`⚠️ Step ${index + 1} has no XML. Question: ${step.question || 'N/A'}`);
        // ถ้าไม่มี XML ให้ใช้ XML จาก workspace ปัจจุบัน (สำหรับ step สุดท้าย)
        if (index === finalSteps.length - 1 && workspaceRef.current) {
          try {
            const currentXml = Blockly.Xml.workspaceToDom(workspaceRef.current);
            const currentXmlText = Blockly.Xml.domToText(currentXml);
            if (currentXmlText && currentXmlText.trim()) {
              console.log(`✅ Using current workspace XML for step ${index + 1}`);
              return {
                step: index,
                content: {
                  question: step.question || '',
                  reasoning: step.reasoning || '',
                  suggestion: step.suggestion || '',
                },
                trigger: "onXmlMatch",
                hintType: "guidance",
                xmlCheck: currentXmlText.trim(),
                difficulty: step.difficulty || 'basic',
                visualGuide: {
                  highlightBlocks: highlightBlocks || [],
                },
              };
            }
          } catch (err) {
            console.error('Error getting XML from workspace:', err);
          }
        }
      }

      return {
        step: index,
        content: {
          question: step.question || '',
          reasoning: step.reasoning || '',
          suggestion: step.suggestion || '',
        },
        trigger: "onXmlMatch",
        hintType: "guidance",
        xmlCheck: xmlCheck.trim() || '', // ใช้ trim และ fallback เป็น empty string
        difficulty: step.difficulty || 'basic',
        visualGuide: {
          highlightBlocks: highlightBlocks || [],
        },
      };
    });

    // Log hints before sending
    console.log('📤 Prepared hints for saving:', {
      hintsCount: hints.length,
      hints: hints.map((h, i) => ({
        step: h.step,
        hasXmlCheck: !!h.xmlCheck && h.xmlCheck.trim().length > 0,
        xmlCheckLength: h.xmlCheck ? h.xmlCheck.length : 0,
        hasQuestion: !!h.content.question,
        hasHighlightBlocks: h.visualGuide.highlightBlocks.length > 0
      }))
    });

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
        block_keywords: null, // No longer needed - using block_key from level_category instead
      };

      // Log pattern data before sending (without full XML to avoid console spam)
      console.log('📤 Pattern data to save:', {
        level_id: patternData.level_id,
        pattern_name: patternData.pattern_name,
        hasXmlPattern: !!patternData.xmlpattern,
        xmlPatternLength: patternData.xmlpattern ? patternData.xmlpattern.length : 0,
        hintsCount: patternData.hints.length,
      });

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
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} pattern:`, error);
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
                            isEditMode={isEditMode}
                            patternLoaded={patternLoaded}
                          />
                      </TabsContent>

                      <TabsContent value="steps" className="space-y-6 mt-0">
                         <StepEditor
                            currentStepIndex={currentStepIndex}
                            question={currentStepQuestion}
                            setQuestion={setCurrentStepQuestion}
                            reasoning={currentStepReasoning}
                            setReasoning={setCurrentStepReasoning}
                            suggestion={currentStepSuggestion}
                            setSuggestion={setCurrentStepSuggestion}
                            difficulty={currentStepDifficulty}
                            setDifficulty={setCurrentStepDifficulty}
                            highlightBlocks={currentStepHighlightBlocks}
                            setHighlightBlocks={setCurrentStepHighlightBlocks}
                            onPrev={handlePreviousStep}
                            onNext={handleNextStep}
                            stepsCount={steps.length}
                          />
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
  );
};

export default PatternCreateEdit;
