// Pattern Matching Functions for Hint System
import { getWorkspaceXml, analyzeXmlStructure } from './hintXmlUtils';
import { calculateXmlMatchScore, checkExactXmlMatch, isXmlStructureMatch } from './hintXmlComparison';

/**
 * ตรวจสอบว่า currentAnalysis มี targetAnalysis ทุก block ตามลำดับหรือไม่
 * ใช้ตรรกะคล้ายกับ three-parts matching (checkBlocksMatch) แต่เฉพาะสำหรับ step hints
 */
function checkStepBlocksMatch(currentAnalysis, targetAnalysis) {
  if (!currentAnalysis || !targetAnalysis || targetAnalysis.length === 0) {
    return false;
  }

  if (typeof currentAnalysis === 'string' || typeof targetAnalysis === 'string') {
    // ถ้าเป็น error message ให้ return false
    return false;
  }

  let currentIndex = 0;

  for (const targetBlock of targetAnalysis) {
    let found = false;

    for (let i = currentIndex; i < currentAnalysis.length; i++) {
      const currentBlock = currentAnalysis[i];
      if (!currentBlock) continue;

      // เปรียบเทียบประเภท block
      if (currentBlock.type !== targetBlock.type) {
        continue;
      }

      // เปรียบเทียบ varName (ถ้ามีใน target ต้องตรงกัน)
      if (targetBlock.varName !== undefined) {
        if (currentBlock.varName !== targetBlock.varName) {
          continue;
        }
      }

      // เปรียบเทียบ procedureName (ถ้ามีใน target ต้องตรงกัน)
      if (targetBlock.procedureName !== undefined) {
        if (currentBlock.procedureName !== targetBlock.procedureName) {
          continue;
        }
      }

      // เช็ค structure พื้นฐาน
      if (targetBlock.hasStatement && !currentBlock.hasStatement) {
        continue;
      }
      if (targetBlock.hasValue && !currentBlock.hasValue) {
        continue;
      }

      // พบ block ที่ตรงกัน
      found = true;
      currentIndex = i + 1;
      break;
    }

    if (!found) {
      console.log(
        `  - ❌ [findCurrentStep] Target block not found: ${targetBlock.type}` +
          `${targetBlock.varName ? ` (VAR: ${targetBlock.varName})` : ''}` +
          `${targetBlock.procedureName ? ` (NAME: ${targetBlock.procedureName})` : ''}`
      );
      return false;
    }
  }

  console.log('  - ✅ [findCurrentStep] All target blocks for this step found in current workspace');
  return true;
}

/**
 * หาขั้นตอนปัจจุบันจาก hints
 * @param {Document} currentXml - XML ของ workspace ปัจจุบัน
 * @param {Object} pattern - pattern object ที่มี hints
 * @param {Blockly.Workspace} workspace - (optional) workspace สำหรับ resolve variable IDs
 */
export function findCurrentStep(currentXml, pattern, workspace = null) {
  if (!pattern.hints || pattern.hints.length === 0) return 0;

  try {
    const parser = new DOMParser();
    let currentStep = 0;

    console.log(`🔍 Finding current step for pattern: ${pattern.name}`);
    console.log(`📄 Current XML:`, new XMLSerializer().serializeToString(currentXml));

    // วิเคราะห์ structure ปัจจุบัน (ใช้ workspace เพื่อ resolve ตัวแปร ถ้ามี)
    const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
    console.log(`🔍 Current structure analysis:`, currentAnalysis);

    for (let i = 0; i < pattern.hints.length; i++) {
      const hintXml = pattern.hints[i].xmlCheck;
      if (!hintXml) continue;

      const targetXml = parser.parseFromString(hintXml, 'text/xml');

      const hintText = pattern.hints[i].content?.question || pattern.hints[i].content?.suggestion || `Step ${i + 1}`;
      console.log(`\n🔍 Checking step ${i}: ${hintText}`);
      console.log(`📄 Target XML:`, hintXml);

      // วิเคราะห์ target structure (ใช้ workspace เพื่อ resolve ตัวแปร ถ้ามี)
      const targetAnalysis = analyzeXmlStructure(targetXml, workspace);
      console.log(`🔍 Target structure analysis:`, targetAnalysis);

      // ใช้การเปรียบเทียบ block ตามลำดับ แทน isXmlStructureMatch เดิมที่หลวมเกินไป
      console.log(`🔍 Checking if step ${i} blocks exist in current workspace (strict order)...`);
      const matches = checkStepBlocksMatch(currentAnalysis, targetAnalysis);
      console.log(`🔍 Step ${i} match result:`, matches);

      if (matches) {
        currentStep = i + 1; // ขั้นตอนถัดไป
        console.log(`✅ Step ${i} matches! Current step is now ${currentStep}`);
      } else {
        console.log(`❌ Step ${i} doesn't match. Stopping here.`);
        break; // หยุดที่ขั้นตอนแรกที่ไม่ตรง
      }
    }

    console.log(`\n🎯 Final current step: ${currentStep} / ${pattern.hints.length}`);
    return currentStep;
  } catch (error) {
    console.error("Error finding current step:", error);
    return 0;
  }
}

/**
 * คำนวณเปอร์เซ็นต์การตรงกับ pattern
 */
export function calculatePatternMatchPercentage(workspace, goodPatterns) {
  console.log("🔍 calculatePatternMatchPercentage called:");
  console.log("  - workspace:", !!workspace);
  console.log("  - goodPatterns:", goodPatterns?.length || 0);

  if (!workspace || !goodPatterns || goodPatterns.length === 0) {
    console.log("  - No workspace or patterns, returning 0%");
    return { percentage: 0, bestPattern: null, matchedBlocks: 0, totalBlocks: 0 };
  }

  // 🎯 เรียงลำดับ patterns ตาม pattern_type_id จากน้อยไปมาก (1 = ดีที่สุด)
  const sortedPatterns = [...goodPatterns].sort((a, b) => {
    const typeA = a.pattern_type_id || 999;
    const typeB = b.pattern_type_id || 999;
    return typeA - typeB;
  });

  console.log("🔍 Patterns sorted by pattern_type_id:", sortedPatterns.map(p => ({
    name: p.name,
    pattern_type_id: p.pattern_type_id
  })));

  const currentXml = getWorkspaceXml(workspace);
  console.log("  - currentXml:", currentXml);

  if (!currentXml) {
    console.log("  - No current XML, returning 0%");
    return { percentage: 0, bestPattern: null, matchedBlocks: 0, totalBlocks: 0 };
  }

  let bestMatch = null;
  let bestPercentage = 0;
  let bestMatchedBlocks = 0;
  let bestTotalBlocks = 0;

  for (const pattern of sortedPatterns) {
    const patternName = pattern.name || pattern.pattern_name || 'Unknown Pattern';
    console.log(`🔍 Checking pattern: ${patternName} (type_id: ${pattern.pattern_type_id})`);
    const patternXml = pattern.xmlPattern || pattern.xmlpattern;
    console.log(`  - xmlPattern:`, patternXml);

    if (!patternXml) {
      console.log(`  - No xmlPattern, skipping`);
      continue;
    }

    try {
      const parser = new DOMParser();
      const targetXml = parser.parseFromString(patternXml, 'text/xml');

      // วิเคราะห์ structure ของทั้งสอง
      // CRITICAL: ส่ง workspace เพื่อ resolve variable IDs (ถ้ามี)
      const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
      const targetAnalysis = analyzeXmlStructure(targetXml, workspace);

      console.log(`  - currentAnalysis:`, currentAnalysis);
      console.log(`  - targetAnalysis:`, targetAnalysis);

      // คำนวณเปอร์เซ็นต์การตรงกัน
      const currentBlocks = currentAnalysis.length;
      const targetBlocks = targetAnalysis.length;

      console.log(`  - currentBlocks: ${currentBlocks}, targetBlocks: ${targetBlocks}`);

      if (targetBlocks === 0) {
        console.log(`  - No target blocks, skipping`);
        continue;
      }

      // นับ blocks ที่ตรงกันแบบ flexible (รองรับ starter XML)
      // เปรียบเทียบโดยหาว่า target blocks แต่ละตัวมีอยู่ใน current blocks หรือไม่
      // CRITICAL: ใช้ flexible matching - หา blocks ที่ match ได้ใน current blocks (ไม่ต้องตามลำดับ)
      // เพื่อให้ได้ percentage ที่ถูกต้องแม้จะขาดบาง blocks
      let matchedBlocks = 0;
      const usedCurrentIndices = new Set(); // เก็บ index ของ current blocks ที่ match แล้ว (เพื่อไม่ให้ match ซ้ำ)
      
      console.log(`  - 🔍 Starting block matching: currentBlocks=${currentBlocks}, targetBlocks=${targetBlocks}`);
      console.log(`  - 🔍 Current blocks summary:`, currentAnalysis.map((b, i) => `${i}:${b.type}${b.varName ? `(${b.varName})` : ''}`).slice(0, 10));
      console.log(`  - 🔍 Target blocks summary:`, targetAnalysis.map((b, i) => `${i}:${b.type}${b.varName ? `(${b.varName})` : ''}`).slice(0, 10));
      
      // สำหรับแต่ละ target block ให้หา current block ที่ตรงกัน (ไม่ต้องตามลำดับ)
      for (let targetIdx = 0; targetIdx < targetAnalysis.length; targetIdx++) {
        const targetBlock = targetAnalysis[targetIdx];
        let foundMatch = false;
        
        // หา current block ที่ตรงกับ target block (ไม่ต้องตามลำดับ - หาทั้งหมด)
        console.log(`  - 🔍 Searching for target block ${targetIdx} (${targetBlock?.type}${targetBlock?.procedureName ? ` "${targetBlock.procedureName}"` : ''}${targetBlock?.varName ? ` VAR:${targetBlock.varName}` : ''}) in all current blocks`);
        
        // หา current block ที่ตรงกัน (ไม่ต้องตามลำดับ - หาทั้งหมด)
        for (let currentIdx = 0; currentIdx < currentAnalysis.length; currentIdx++) {
          // ข้าม current blocks ที่ match แล้ว (เพื่อไม่ให้ match ซ้ำ)
          if (usedCurrentIndices.has(currentIdx)) {
            continue;
          }
          const currentBlock = currentAnalysis[currentIdx];
          
          // Log ทุก block ที่เช็ค
          if (currentBlock && targetBlock && currentBlock.type === targetBlock.type) {
            console.log(`  - 🔍 Found matching type at index ${currentIdx}: ${currentBlock.type}${currentBlock.procedureName ? ` "${currentBlock.procedureName}"` : ''}${currentBlock.varName ? ` VAR:${currentBlock.varName}` : ''}`);
          } else if (currentBlock && targetBlock) {
            // Log block ที่ type ไม่ตรง (เฉพาะ block แรกๆ เพื่อไม่ให้ log เยอะเกินไป)
            if (currentIdx < 3) {
              console.log(`  - 🔍 Index ${currentIdx}: type mismatch (${currentBlock.type} vs ${targetBlock.type})`);
            }
          }
          
          if (currentBlock && targetBlock && currentBlock.type === targetBlock.type) {
            // CRITICAL: สำหรับ controls_if และ procedures - ถ้า type ตรงกันแล้ว ให้ match ได้เลย (ไม่ต้องเช็ค condition/parameters)
            const isControlIf = currentBlock.type === 'controls_if' || currentBlock.type === 'controls_ifelse';
            const isProcedureDef = currentBlock.type === 'procedures_defreturn' || currentBlock.type === 'procedures_defnoreturn';
            
            // CRITICAL: เช็ค field values สำหรับ blocks ที่สำคัญ
            // สำหรับ variables_set และ variables_get: เช็ค VAR field
            let fieldsMatch = true;
            
            // สำหรับ controls_if - ถ้า type ตรงกันแล้ว ให้ match ได้เลย (ไม่ต้องเช็ค condition)
            if (isControlIf) {
              fieldsMatch = true; // ให้ match ได้เลย
              console.log(`  - ℹ️ If block type matches - allowing match without checking condition`);
            } else {
              // สำหรับ blocks อื่นๆ - เช็ค field values
              if (currentBlock.type === 'variables_set' || currentBlock.type === 'variables_get') {
                const targetVarName = targetBlock.varName;
                const currentVarName = currentBlock.varName;
              
                console.log(`  - 🔍 [VAR CHECK] Block type: ${currentBlock.type}`);
                console.log(`  - 🔍 [VAR CHECK] Target varName: ${targetVarName !== undefined ? `"${targetVarName}"` : 'undefined'}`);
                console.log(`  - 🔍 [VAR CHECK] Current varName: ${currentVarName !== undefined ? `"${currentVarName}"` : 'undefined'}`);
                
                // CRITICAL: ถ้าทั้งสองมี VAR field ต้องตรงกัน
                if (targetVarName !== undefined && currentVarName !== undefined) {
                  // เปรียบเทียบ variable names (case-sensitive, exact match)
                  if (targetVarName !== currentVarName) {
                    fieldsMatch = false;
                    console.log(`  - ❌ [VAR CHECK] VAR field doesn't match: "${currentVarName}" !== "${targetVarName}"`);
                  } else {
                    console.log(`  - ✅ [VAR CHECK] VAR field matches: "${currentVarName}" === "${targetVarName}"`);
                  }
                } else if (targetVarName !== undefined && currentVarName === undefined) {
                  // ถ้า target มี VAR แต่ current ไม่มี แสดงว่าไม่ตรงกัน
                  fieldsMatch = false;
                  console.log(`  - ❌ [VAR CHECK] VAR field missing in current: target has "${targetVarName}", current has none`);
                } else if (targetVarName === undefined && currentVarName !== undefined) {
                  // ถ้า target ไม่มี VAR แต่ current มี - สำหรับ variables_set/variables_get ควรจะมี VAR field
                  // ถ้า target ไม่มี VAR field แสดงว่าอาจเป็น block ที่ไม่สมบูรณ์ หรือเป็น block อื่น
                  // แต่เพื่อความปลอดภัย ถ้า current มี VAR แล้ว target ควรมีด้วย
                  fieldsMatch = false;
                  console.log(`  - ❌ [VAR CHECK] VAR field missing in target: current has "${currentVarName}", target has none`);
                } else {
                  // ถ้าทั้งสองไม่มี VAR field - อาจเป็น block อื่นที่ไม่ใช่ variables หรือ block ที่ไม่สมบูรณ์
                  console.log(`  - ⚠️ [VAR CHECK] Both blocks have no VAR field - this is unusual for ${currentBlock.type}`);
                  // สำหรับ variables_set/variables_get ควรจะมี VAR field ถ้าไม่มีแสดงว่าไม่สมบูรณ์
                  // แต่เพื่อความปลอดภัย ให้ยืดหยุ่น - ถ้าทั้งสองไม่มี VAR field ก็ให้ match
                  // (อาจเป็น block ที่ไม่สมบูรณ์หรือเป็น block อื่น)
                }
                
                console.log(`  - 🔍 [VAR CHECK] fieldsMatch result: ${fieldsMatch}`);
              }
              
              // สำหรับ procedures: เช็ค NAME field
              if (fieldsMatch && (currentBlock.type === 'procedures_defreturn' || currentBlock.type === 'procedures_defnoreturn' ||
                  currentBlock.type === 'procedures_callreturn' || currentBlock.type === 'procedures_callnoreturn')) {
                const targetProcedureName = targetBlock.procedureName;
                const currentProcedureName = currentBlock.procedureName;
                
                console.log(`  - 🔍 [PROC CHECK] Block type: ${currentBlock.type}`);
                console.log(`  - 🔍 [PROC CHECK] Target procedureName: ${targetProcedureName !== undefined ? `"${targetProcedureName}"` : 'undefined'}`);
                console.log(`  - 🔍 [PROC CHECK] Current procedureName: ${currentProcedureName !== undefined ? `"${currentProcedureName}"` : 'undefined'}`);
                
                if (targetProcedureName !== undefined && currentProcedureName !== undefined) {
                  if (targetProcedureName !== currentProcedureName) {
                    fieldsMatch = false;
                    console.log(`  - ❌ [PROC CHECK] NAME field doesn't match: "${currentProcedureName}" !== "${targetProcedureName}"`);
                  } else {
                    console.log(`  - ✅ [PROC CHECK] NAME field matches: "${currentProcedureName}" === "${targetProcedureName}"`);
                  }
                } else if (targetProcedureName !== undefined || currentProcedureName !== undefined) {
                  fieldsMatch = false;
                  console.log(`  - ❌ [PROC CHECK] NAME field presence mismatch: target has ${targetProcedureName !== undefined ? `"${targetProcedureName}"` : 'none'}, current has ${currentProcedureName !== undefined ? `"${currentProcedureName}"` : 'none'}`);
                } else {
                  console.log(`  - ⚠️ [PROC CHECK] Both blocks have no NAME field - this is unusual for ${currentBlock.type}`);
                }
                
                console.log(`  - 🔍 [PROC CHECK] fieldsMatch result: ${fieldsMatch}`);
              }
              
              // CRITICAL: สำหรับ procedures_defreturn/procedures_defnoreturn - ไม่ต้องเช็ค value blocks อย่างเข้มงวด
              // เพราะ value blocks ใน procedure definition คือ parameters ซึ่งอาจแตกต่างกันได้
              // และ body ของ procedure จะถูกเช็คแยกใน statement blocks
              // (isProcedureDef ถูก define แล้วที่ด้านบน)
              
              if (!isProcedureDef) {
                // สำหรับ blocks อื่นๆ - เช็ค value blocks อย่างยืดหยุ่น
                if (targetBlock.valueBlocks && currentBlock.valueBlocks) {
                  console.log(`  - 🔍 Checking value blocks: target has ${targetBlock.valueBlocks.length}, current has ${currentBlock.valueBlocks.length}`);
                  
                  // เปรียบเทียบ value blocks แต่ละตัว - ใช้ min เพื่อไม่ให้ error ถ้า current มีน้อยกว่า
                  const minValueBlocks = Math.min(targetBlock.valueBlocks.length, currentBlock.valueBlocks.length);
                  
                  for (let i = 0; i < minValueBlocks; i++) {
                  const targetValueBlock = targetBlock.valueBlocks[i];
                  const currentValueBlock = currentBlock.valueBlocks[i];
                  
                  console.log(`  - 🔍 Value block ${i}: target=${targetValueBlock?.type || 'undefined'}, current=${currentValueBlock?.type || 'undefined'}`);
                  
                  // ถ้าเป็น variables_get ให้เช็ค VAR field
                  if (targetValueBlock && typeof targetValueBlock === 'object' && targetValueBlock.type === 'variables_get' &&
                      currentValueBlock && typeof currentValueBlock === 'object' && currentValueBlock.type === 'variables_get') {
                    const targetVarName = targetValueBlock.varName;
                    const currentVarName = currentValueBlock.varName;
                    
                    console.log(`  - 🔍 Checking value block VAR field: target=${targetVarName}, current=${currentVarName}`);
                    
                    if (targetVarName !== undefined && currentVarName !== undefined) {
                      if (targetVarName !== currentVarName) {
                        fieldsMatch = false;
                        console.log(`  - ❌ Value block VAR field doesn't match: ${currentVarName} vs ${targetVarName}`);
                        break;
                      } else {
                        console.log(`  - ✅ Value block VAR field matches: ${currentVarName}`);
                      }
                    } else if (targetVarName !== undefined && currentVarName === undefined) {
                      // ถ้า target มี VAR แต่ current ไม่มี - อาจยังไม่วางครบ แต่ไม่ควรทำให้ fieldsMatch = false
                      // เพราะ current อาจมี value blocks น้อยกว่า target
                      console.log(`  - ⚠️ Value block VAR field missing in current: target has ${targetVarName}, current has none (but current has fewer value blocks, so this is OK)`);
                      // ไม่ set fieldsMatch = false เพราะ current อาจยังไม่วางครบ
                    }
                  } else if (targetValueBlock && typeof targetValueBlock === 'object' && targetValueBlock.type === 'variables_get') {
                    // ถ้า target เป็น variables_get แต่ current ไม่ใช่
                    // แต่ถ้า current มี value blocks น้อยกว่า target ก็ได้ (อาจยังไม่วางครบ)
                    if (currentBlock.valueBlocks.length < targetBlock.valueBlocks.length) {
                      console.log(`  - ⚠️ Value block type mismatch: target is variables_get but current is ${currentValueBlock?.type || 'undefined'} (but current has fewer value blocks, so this is OK)`);
                      // ไม่ set fieldsMatch = false เพราะ current อาจยังไม่วางครบ
                    } else {
                      fieldsMatch = false;
                      console.log(`  - ❌ Value block type mismatch: target is variables_get but current is ${currentValueBlock?.type || 'undefined'}`);
                      break;
                    }
                  } else if (currentValueBlock && typeof currentValueBlock === 'object' && currentValueBlock.type === 'variables_get') {
                    // ถ้า current เป็น variables_get แต่ target ไม่ใช่ (ยืดหยุ่น - ไม่ต้องเช็ค)
                    console.log(`  - ℹ️ Value block type: current is variables_get but target is ${targetValueBlock?.type || 'undefined'} - allowing match`);
                  }
                }
                
                  // ถ้า current มี value blocks น้อยกว่า target - ไม่ควรทำให้ fieldsMatch = false
                  // เพราะอาจยังไม่วางครบ (เช่น starter XML อาจมี value blocks น้อยกว่า pattern)
                  if (currentBlock.valueBlocks.length < targetBlock.valueBlocks.length) {
                    console.log(`  - ℹ️ Current has fewer value blocks (${currentBlock.valueBlocks.length} < ${targetBlock.valueBlocks.length}) - this is OK, may be incomplete`);
                  }
                } else if (targetBlock.valueBlocks && !currentBlock.valueBlocks) {
                  // ถ้า target มี value blocks แต่ current ไม่มี - อาจยังไม่วางครบ
                  console.log(`  - ⚠️ Target has value blocks but current doesn't - may be incomplete`);
                  // ไม่ set fieldsMatch = false เพราะ current อาจยังไม่วางครบ
                }
              } else {
                // สำหรับ procedure definition - ไม่ต้องเช็ค value blocks (parameters)
                console.log(`  - ℹ️ Skipping value blocks check for procedure definition (${currentBlock.type}) - parameters may differ`);
              }
            }
            
            if (!fieldsMatch) {
              console.log(`  - ⚠️ Block type matches but fields don't: ${targetBlock.type} (targetIdx: ${targetIdx}, currentIdx: ${currentIdx})`);
              continue; // ไปหา block ถัดไป
            } else {
              console.log(`  - ✅ Fields match for block type: ${targetBlock.type}`);
            }
            
            // เปรียบเทียบ structure เพิ่มเติม (statement, value, next)
            // แต่ยืดหยุ่น - ถ้า block type ตรงกันแล้ว ให้ match เลย (ไม่ต้องเช็ค structure มากนัก)
            // เพราะ structure อาจจะแตกต่างกันได้ถ้ามี nested blocks หรือ blocks เพิ่มเติม
            let structureMatch = true;
            
            // CRITICAL: สำหรับ procedure definition และ controls_if - ยืดหยุ่นมากกว่า
            // เพราะ body ของ procedure หรือ statement ใน if อาจยังไม่ครบ
            if (isProcedureDef) {
              // สำหรับ procedure definition - ถ้า type และ name ตรงกันแล้ว ให้ match ได้เลย
              // ไม่ต้องเช็ค statement หรือ value อย่างเข้มงวด เพราะ body อาจยังไม่ครบ
              console.log(`  - ℹ️ Procedure definition - skipping strict structure check (body may be incomplete)`);
              structureMatch = true; // ให้ match ได้เลย
            } else if (isControlIf) {
              // สำหรับ controls_if - ถ้า type ตรงกันแล้ว ให้ match ได้เลย
              // ไม่ต้องเช็ค statement หรือ value อย่างเข้มงวด เพราะ condition และ statement อาจยังไม่ครบ
              console.log(`  - ℹ️ If block - skipping strict structure check (condition and statement may be incomplete)`);
              structureMatch = true; // ให้ match ได้เลย
            } else {
              // สำหรับ blocks อื่นๆ - เช็ค structure อย่างยืดหยุ่น
              // เช็ค statement blocks - ถ้า target มี statement แล้ว current ต้องมี statement ด้วย
              // แต่ถ้า target ไม่มี statement แล้ว current มี statement ก็ได้ (เพราะอาจจะมี nested blocks)
              if (targetBlock.hasStatement && !currentBlock.hasStatement) {
                structureMatch = false;
                console.log(`  - ⚠️ Structure mismatch: target has statement but current doesn't`);
              }
              // เช็ค value blocks - ถ้า target มี value แล้ว current ต้องมี value ด้วย
              // แต่ถ้า target ไม่มี value แล้ว current มี value ก็ได้ (เพราะอาจจะมี nested blocks)
              // CRITICAL: ถ้า current มี value blocks น้อยกว่า target (เพราะยังไม่วางครบ) ก็ไม่ควรทำให้ structureMatch = false
              if (targetBlock.hasValue && !currentBlock.hasValue) {
                // แต่ถ้า target มี value blocks และ current ก็มี value blocks (แม้จะน้อยกว่า) ก็ถือว่า OK
                if (!currentBlock.valueBlocks || currentBlock.valueBlocks.length === 0) {
                  structureMatch = false;
                  console.log(`  - ⚠️ Structure mismatch: target has value but current doesn't`);
                } else {
                  console.log(`  - ℹ️ Target has value blocks, current also has value blocks (${currentBlock.valueBlocks.length}) - OK even if fewer`);
                }
              }
            }
            // เช็ค next blocks - ไม่ต้องเช็คเพราะ next blocks อาจจะแตกต่างกันได้
            // (เช่น target อาจจะไม่มี next แต่ current มี next เพราะมี blocks เพิ่มเติม)
            
            // ถ้า structure ตรงกัน ให้ match
            if (structureMatch) {
              matchedBlocks++;
              usedCurrentIndices.add(currentIdx); // เก็บ index นี้ไว้ (เพื่อไม่ให้ match ซ้ำ)
              foundMatch = true;
              console.log(`  - ✅ Matched block ${targetIdx}: ${targetBlock.type} at current index ${currentIdx}${targetBlock.varName ? ` (VAR: ${targetBlock.varName})` : ''}${targetBlock.procedureName ? ` (NAME: ${targetBlock.procedureName})` : ''}`);
              break;
        } else {
              console.log(`  - ⚠️ Block type and fields match but structure doesn't: ${targetBlock.type} (target: hasStatement=${targetBlock.hasStatement}, hasValue=${targetBlock.hasValue}, current: hasStatement=${currentBlock.hasStatement}, hasValue=${currentBlock.hasValue})`);
            }
          }
        }
        
        // ถ้าไม่พบ match สำหรับ target block นี้ - ไม่ break ทันที
        // ให้ข้าม block นี้ไปหา block ถัดไป (เพื่อให้ได้ percentage ที่ถูกต้อง)
        if (!foundMatch) {
          console.log(`  - ⚠️ Target block ${targetIdx} (${targetBlock?.type}${targetBlock?.varName ? ` VAR:${targetBlock.varName}` : ''}${targetBlock?.procedureName ? ` PROC:${targetBlock.procedureName}` : ''}) not found in current blocks`);
          console.log(`  - ℹ️ Skipping this block and continuing to next target block (to get accurate percentage)`);
          // ไม่ break - ให้ข้าม block นี้ไปหา block ถัดไป
          // เพื่อให้ได้ matchedBlocks ที่ถูกต้อง (แม้จะไม่ครบทุก block)
        }
      }

      // คำนวณ percentage - ใช้ matchedBlocks / targetBlocks
      // จำกัด percentage ไม่ให้เกิน 100%
      const percentage = targetBlocks > 0 
        ? Math.min(Math.round((matchedBlocks / targetBlocks) * 100), 100)
        : 0;
      
      console.log(`  - 📊 Pattern "${patternName}" matching result:`);
      console.log(`     - matchedBlocks: ${matchedBlocks}/${targetBlocks}`);
      console.log(`     - percentage: ${percentage}%`);
      console.log(`     - usedCurrentIndices: ${usedCurrentIndices.size} blocks matched`);

      // 🎯 เลือก pattern ที่มี percentage สูงที่สุด (แม้จะไม่ใช่ 100% ก็ตาม)
      // ถ้า percentage เท่ากัน ให้เลือก pattern ที่มี type_id ดีกว่า (น้อยกว่า)
      if (percentage > bestPercentage) {
        // อัปเดตถ้า percentage สูงกว่า
        console.log(`  - Better match! percentage: ${percentage}% (was ${bestPercentage}%), type_id: ${pattern.pattern_type_id}`);
        bestPercentage = percentage;
        bestMatch = pattern;
        bestMatchedBlocks = matchedBlocks;
        bestTotalBlocks = targetBlocks;
      } else if (percentage === bestPercentage && percentage > 0) {
        // ถ้า percentage เท่ากัน ให้เลือก pattern ที่มี type_id ดีกว่า (น้อยกว่า)
        const currentTypeId = pattern.pattern_type_id || 999;
        const bestTypeId = bestMatch?.pattern_type_id || 999;
        
        if (currentTypeId < bestTypeId) {
          console.log(`  - Same percentage (${percentage}%) but better type_id: ${currentTypeId} < ${bestTypeId}`);
          bestPercentage = percentage;
          bestMatch = pattern;
          bestMatchedBlocks = matchedBlocks;
          bestTotalBlocks = targetBlocks;
        }
      } else if (percentage > 0 && !bestMatch) {
        // เลือก pattern แรกที่มี percentage > 0 (ถ้ายังไม่มี bestMatch)
        console.log(`  - First match! percentage: ${percentage}%, type_id: ${pattern.pattern_type_id}`);
        bestPercentage = percentage;
        bestMatch = pattern;
        bestMatchedBlocks = matchedBlocks;
        bestTotalBlocks = targetBlocks;
      }
    } catch (error) {
      console.error("Error calculating pattern match:", error);
    }
  }

  console.log("🔍 Final result:", {
    percentage: bestPercentage,
    bestPattern: bestMatch?.name || bestMatch?.pattern_name,
    bestPatternWeaponKey: bestMatch?.weaponKey,
    matchedBlocks: bestMatchedBlocks,
    totalBlocks: bestTotalBlocks,
    patternsChecked: sortedPatterns.length
  });

  // CRITICAL: แสดง percentage ของ pattern ที่ตรงมากที่สุด (แม้จะไม่ใช่ 100% ก็ตาม)
  // ถ้าไม่มี pattern ใด match เลย (bestPercentage = 0) ก็คืนค่า 0%
  // แต่ถ้ามี pattern ที่ match (แม้จะไม่ครบ 100%) ก็แสดง percentage ของ pattern นั้น
  return {
    percentage: bestPercentage,
    bestPattern: bestMatch,
    matchedBlocks: bestMatchedBlocks,
    totalBlocks: bestTotalBlocks
  };
}

/**
 * ตรวจสอบว่า pattern ตรงกับ XML เฉลยหรือไม่
 */
export function checkPatternMatch(workspace, goodPatterns) {
  console.log("🔍 checkPatternMatch called");

  // 🎯 เรียงลำดับ patterns ตาม pattern_type_id จากน้อยไปมาก (1 = ดีที่สุด)
  const sortedPatterns = [...goodPatterns].sort((a, b) => {
    const typeA = a.pattern_type_id || 999;
    const typeB = b.pattern_type_id || 999;
    return typeA - typeB;
  });

  console.log("🔍 Patterns sorted by pattern_type_id:", sortedPatterns.map(p => ({
    name: p.name,
    pattern_type_id: p.pattern_type_id
  })));

  const currentXml = getWorkspaceXml(workspace);
  console.log("📄 current XML:", new XMLSerializer().serializeToString(currentXml));
  console.log("🔍 sortedPatterns:", sortedPatterns);

  // ตรวจสอบ xmlPattern โดยตรงก่อน (ไม่ต้องพึ่ง hints) - ใช้ sorted patterns
  for (const pattern of sortedPatterns) {
    console.log(`🔍 Checking exact match for pattern: ${pattern.name} (type_id: ${pattern.pattern_type_id})`);
    // Support both xmlpattern and xmlPattern (case variations)
    const patternXml = pattern.xmlPattern || pattern.xmlpattern;
    // CRITICAL: ส่ง workspace parameter เพื่อให้สามารถ resolve variable IDs เป็นชื่อตัวแปรได้
    if (patternXml && checkExactXmlMatch(currentXml, patternXml, workspace)) {
      console.log("🔍 EXACT MATCH FOUND with xmlPattern!");
      console.log("🔍 Pattern weaponKey:", pattern.weaponKey);
      console.log("🔍 Pattern weapon object:", pattern.weapon);
      console.log("🔍 Pattern weapon_id:", pattern.weapon_id);
      
      // Get weaponKey from pattern (may be mapped or from weapon object)
      const weaponKey = pattern.weaponKey || pattern.weapon?.weapon_key || (pattern.weapon_id ? `weapon_${pattern.weapon_id}` : null);
      console.log("🔍 Final weaponKey:", weaponKey);
      
      if (!weaponKey) {
        console.warn("⚠️ Pattern matched but no weaponKey found!");
      }
      
      return {
        matched: true,
        pattern: pattern,
        weaponKey: weaponKey
      };
    }
  }

  // ถ้าไม่มี xmlPattern หรือไม่ตรง ให้ตรวจสอบแบบ hints - ใช้ sorted patterns
  for (const pattern of sortedPatterns) {
    console.log(`🔍 Checking hints match for pattern: ${pattern.name} (type_id: ${pattern.pattern_type_id})`);
    const currentStep = findCurrentStep(currentXml, pattern);
    const totalSteps = pattern.hints?.length || 0;

    // ถ้ายังไม่ครบทุกขั้น ไม่ต้องเช็ค exact match
    if (currentStep < totalSteps) continue;

    // Support both xmlpattern and xmlPattern (case variations)
    const patternXml = pattern.xmlPattern || pattern.xmlpattern;
    // CRITICAL: ส่ง workspace parameter เพื่อให้สามารถ resolve variable IDs เป็นชื่อตัวแปรได้
    if (patternXml && checkExactXmlMatch(currentXml, patternXml, workspace)) {
      console.log("🔍 EXACT MATCH FOUND with hints!");
      console.log("🔍 Pattern weaponKey:", pattern.weaponKey);
      console.log("🔍 Pattern weapon object:", pattern.weapon);
      console.log("🔍 Pattern weapon_id:", pattern.weapon_id);
      
      // Get weaponKey from pattern (may be mapped or from weapon object)
      const weaponKey = pattern.weaponKey || pattern.weapon?.weapon_key || (pattern.weapon_id ? `weapon_${pattern.weapon_id}` : null);
      console.log("🔍 Final weaponKey:", weaponKey);
      
      if (!weaponKey) {
        console.warn("⚠️ Pattern matched but no weaponKey found!");
      }
      
      return {
        matched: true,
        pattern: pattern,
        weaponKey: weaponKey
      };
    }
  }

  console.log("🔍 NO EXACT MATCH FOUND");
  return {
    matched: false,
    pattern: null,
    weaponKey: null
  };
}

