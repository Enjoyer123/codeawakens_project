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
 * ใช้ logic แบบ Sequential Check (Checking Prefix Subsequence)
 * คือตรวจสอบว่า user มี block ตรงตามลำดับของ pattern ได้กี่ block (จากซ้ายไปขวา)
 * หาก user กระโดดข้าม block ใน pattern จะหยุดนับทันที
 * ซึ่งสอดคล้องกับ logic 3 parts ที่ต้องผ่าน part 1 -> 2 -> 3
 */
export function calculatePatternMatchPercentage(workspace, goodPatterns) {
  console.log("🔍 calculatePatternMatchPercentage called (Sequential Logic):");
  // console.log("  - workspace:", !!workspace);
  // console.log("  - goodPatterns:", goodPatterns?.length || 0);

  if (!workspace || !goodPatterns || goodPatterns.length === 0) {
    return { percentage: 0, bestPattern: null, matchedBlocks: 0, totalBlocks: 0 };
  }

  // 🎯 เรียงลำดับ patterns ตาม pattern_type_id จากน้อยไปมาก (1 = ดีที่สุด)
  const sortedPatterns = [...goodPatterns].sort((a, b) => {
    const typeA = a.pattern_type_id || 999;
    const typeB = b.pattern_type_id || 999;
    return typeA - typeB;
  });

  const currentXml = getWorkspaceXml(workspace);
  if (!currentXml) {
    return { percentage: 0, bestPattern: null, matchedBlocks: 0, totalBlocks: 0 };
  }

  let bestMatch = null;
  let bestPercentage = 0;
  let bestMatchedBlocks = 0;
  let bestTotalBlocks = 0;

  for (const pattern of sortedPatterns) {
    const patternName = pattern.name || pattern.pattern_name || 'รูปแบบที่ไม่รู้จัก';
    let patternXml = pattern.xmlPattern || pattern.xmlpattern;

    // Fallback: ถ้าไม่มี xmlPattern ให้ลองหาจาก hints (ตัวสุดท้ายคือ output ที่สมบูรณ์)
    if (!patternXml && pattern.hints && pattern.hints.length > 0) {
      const lastHint = pattern.hints[pattern.hints.length - 1];
      patternXml = lastHint.xmlCheck || lastHint.xmlcheck;
      console.log(`  - ℹ️ Using fallback XML from last hint for "${patternName}"`);
    }

    if (!patternXml) {
      // console.log(`  - No xmlPattern, skipping`);
      continue;
    }

    try {
      const parser = new DOMParser();
      const targetXml = parser.parseFromString(patternXml, 'text/xml');

      // วิเคราะห์ structure
      const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
      const targetAnalysis = analyzeXmlStructure(targetXml, workspace);

      const currentBlocks = currentAnalysis.length;
      const targetBlocks = targetAnalysis.length;

      if (targetBlocks === 0) continue;

      // 🔍 Sequential Matching Logic
      // หาว่ามี pattern blocks เรียงกันกี่ตัวใน user workspace (อนุญาตให้ user มี block แทรกได้)
      // แต่ไม่อนุญาตให้กระโดดข้าม pattern block (ถ้าหาไม่เจอคือหยุด)

      // 🔍 Relaxed Sequential Matching Logic (Subsequence Match)
      // หาว่ามี pattern blocks เรียงกันกี่ตัวใน user workspace (อนุญาตให้ user มี block แทรกได้)
      // ไม่จำเป็นต้องเรียงติดกัน (Non-contiguous) แต่ต้องลำดับถูกต้อง

      let matchedBlocks = 0;
      let currentCodeIndex = 0;

      // Iterate through target blocks and try to find them in current analysis
      for (const targetBlock of targetAnalysis) {
        let found = false;

        // Search for this target block in current code starting from where we left off
        for (let i = currentCodeIndex; i < currentAnalysis.length; i++) {
          const currentBlock = currentAnalysis[i];

          // 1. Check basic type match
          let isTypeMatch = (currentBlock.type === targetBlock.type);

          // 🔄 Fuzzy Match: lists_create_empty <-> lists_create_with
          if (!isTypeMatch) {
            if ((currentBlock.type === 'lists_create_empty' && targetBlock.type === 'lists_create_with') ||
              (currentBlock.type === 'lists_create_with' && targetBlock.type === 'lists_create_empty')) {
              isTypeMatch = true;
            }
          }

          let fieldsMatch = true;

          if (isTypeMatch) {
            // 2. Check variable names (Relaxed)
            if (currentBlock.type === 'variables_set' || currentBlock.type === 'variables_get') {
              const targetVarName = targetBlock.varName;
              const currentVarName = currentBlock.varName;
              if (targetVarName !== undefined && currentVarName !== undefined && targetVarName !== currentVarName) {
                // fieldsMatch = false; // RELAXED: Warning only, same as previous logic
                // console.log(`    - ⚠️ [RELAXED] Var mismatch: ${currentVarName} vs ${targetVarName}`);
              }
            }

            // 3. Check procedure names (Strict)
            if (currentBlock.type.includes('procedures_') && targetBlock.procedureName !== undefined) {
              if (currentBlock.procedureName !== targetBlock.procedureName) {
                fieldsMatch = false;
              }
            }

            // 4. Check statement/value structure (Relaxed - implicitly handled by analysis but good to be careful)
            // If target expects statement but current doesn't have it, maybe strictly mismatch?
            // For now, stick to type/fields as primary matching criteria
          }

          if (isTypeMatch && fieldsMatch) {
            matchedBlocks++;
            currentCodeIndex = i + 1; // Advance user code pointer
            found = true;
            break; // Move to next target block
          }
        }

        // If we scanned entirely and didn't find this target block, we stop counting? 
        // Or do we skip this target block and try to find the next one? 
        // "Permission to SKIP blocks in Pattern" is unusual. Usually we want to find the whole pattern sequence.
        // If we can't find block A, we probably can't claim to have matched the sequence A->B.
        // So breaking here is correct for "Longest Common Subsequence Prefix" effectively.
        if (!found) {
          break;
        }
      }

      // 🛑 SAFETY CAP: Ensure matchedBlocks never exceeds totalBlocks
      if (matchedBlocks > targetBlocks) {
        console.warn(`⚠️ [Safety Cap] matchedBlocks (${matchedBlocks}) exceeded targetBlocks (${targetBlocks}) for pattern "${patternName}". Capping at ${targetBlocks}.`);
        matchedBlocks = targetBlocks;
      }

      // คำนวณ percentage
      const percentage = targetBlocks > 0
        ? Math.min(Math.round((matchedBlocks / targetBlocks) * 100), 100)
        : 0;

      // console.log(`  - 📊 Pattern "${patternName}": ${matchedBlocks}/${targetBlocks} (${percentage}%)`);

      if (percentage > bestPercentage) {
        bestPercentage = percentage;
        bestMatch = pattern;
        bestMatchedBlocks = matchedBlocks;
        bestTotalBlocks = targetBlocks;
      } else if (percentage === bestPercentage && percentage > 0) {
        // Tie-breaker by preferred type
        const currentTypeId = pattern.pattern_type_id || 999;
        const bestTypeId = bestMatch?.pattern_type_id || 999;
        if (currentTypeId < bestTypeId) {
          bestMatch = pattern;
          bestMatchedBlocks = matchedBlocks;
          bestTotalBlocks = targetBlocks;
        }
      }

    } catch (error) {
      console.error("Error calculating pattern match:", error);
    }
  }

  // Fallback: If no match found but we have blocks, ensure we don't return null bestMatch if we can avoid it 
  // (though 0% implies no match really)

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

