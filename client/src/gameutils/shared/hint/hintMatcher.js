// Pattern Matching Functions for Hint System

/**
 * ตรวจสอบว่า targetAnalysis เป็น subsequence ของ currentAnalysis หรือไม่
 * (บล็อกของ target ต้องปรากฏใน current ตามลำดับ แต่ไม่จำเป็นต้องติดกัน)
 * 
 * เช็คแบบ RELAXED: เน้นที่ type และ varName หลัก ไม่เช็ค valueBlocks/hasStatement อย่างเข้มงวด
 */
export function checkBlocksSubsequenceMatch(currentAnalysis, targetAnalysis, strict = false) {
  if (!currentAnalysis || !targetAnalysis) return false;
  if (typeof currentAnalysis === 'string' || typeof targetAnalysis === 'string') return false;
  if (targetAnalysis.length === 0) return true;
  if (currentAnalysis.length === 0) return false;

  let targetIdx = 0;
  let currentIdx = 0;

  // console.log(`  - 🔍 [SubsequenceMatch] Checking if target (len=${targetAnalysis.length}) is subsequence of current (len=${currentAnalysis.length}), strict=${strict}`);

  while (currentIdx < currentAnalysis.length && targetIdx < targetAnalysis.length) {
    const cur = currentAnalysis[currentIdx];
    const tgt = targetAnalysis[targetIdx];

    // เช็คว่าบล็อกปัจจุบันตรงกับ target หรือไม่
    let isMatch = true;

    // type ต้องตรงกัน (เช็คเสมอ)
    let isTypeMatch = (cur.type === tgt.type);

    // 🔄 Fuzzy Match: lists_create_empty <-> lists_create_with
    if (!isTypeMatch) {
      if ((cur.type === 'lists_create_empty' && tgt.type === 'lists_create_with') ||
        (cur.type === 'lists_create_with' && tgt.type === 'lists_create_empty')) {
        isTypeMatch = true;
        // console.log(`  - 🔄 [SubsequenceMatch] Fuzzy match accepted: ${cur.type} ~= ${tgt.type}`);
      }
    }

    if (!isTypeMatch) {
      isMatch = false;
    }

    // varName (ถ้า target ระบุ และต้องการเช็ค)
    if (isMatch && tgt.varName !== undefined && cur.varName !== tgt.varName) {
      // เช็ค varName อย่างเดียวถ้า pattern ระบุไว้
      // console.log(`  - 🔍 [SubsequenceMatch] varName mismatch: current="${cur.varName}", target="${tgt.varName}"`);
      isMatch = false;
    }

    // procedureName (ถ้า target ระบุ)
    // RELAXED: เช็คเฉพาะเมื่อทั้ง current และ target มี procedureName
    // เพราะผู้ใช้อาจยังไม่ได้ตั้งชื่อ procedure (ใช้ชื่อ default)
    if (isMatch && tgt.procedureName !== undefined && cur.procedureName !== undefined) {
      if (cur.procedureName !== tgt.procedureName) {
        // console.log(`  - 🔍 [SubsequenceMatch] procedureName mismatch: current="${cur.procedureName}", target="${tgt.procedureName}"`);
        isMatch = false;
      }
    } else if (isMatch && tgt.procedureName !== undefined && !cur.procedureName) {
      // Target มี procedureName แต่ current ไม่มี - ให้ผ่านไปก่อน (RELAXED)
      // console.log(`  - ⚠️ [SubsequenceMatch] [RELAXED] Target expects procedureName="${tgt.procedureName}" but current has none - allowing match`);
    }

    // RELAXED MODE: ไม่เช็ค hasStatement/hasValue/valueBlocks อย่างเข้มงวด
    // เพราะผู้ใช้อาจเพิ่มบล็อกภายในหรือเปลี่ยนแปลงได้ระหว่างทำ
    // เช็คเฉพาะใน strict mode เท่านั้น
    if (strict) {
      // hasStatement / hasValue
      if (isMatch && tgt.hasStatement !== undefined && cur.hasStatement !== tgt.hasStatement) {
        // console.log(`  - 🔍 [SubsequenceMatch] hasStatement mismatch: current=${cur.hasStatement}, target=${tgt.hasStatement}`);
        isMatch = false;
      }
      if (isMatch && tgt.hasValue !== undefined && cur.hasValue !== tgt.hasValue) {
        // console.log(`  - 🔍 [SubsequenceMatch] hasValue mismatch: current=${cur.hasValue}, target=${tgt.hasValue}`);
        isMatch = false;
      }

      // valueBlocks: ต้องตรงทั้งจำนวนและชนิด / ชื่อ var (strict mode เท่านั้น)
      if (isMatch && tgt.valueBlocks && cur.valueBlocks) {
        if (tgt.valueBlocks.length !== cur.valueBlocks.length) {
          // console.log(`  - 🔍 [SubsequenceMatch] valueBlocks count mismatch: current=${cur.valueBlocks.length}, target=${tgt.valueBlocks.length}`);
          isMatch = false;
        } else {
          for (let v = 0; v < tgt.valueBlocks.length; v++) {
            const tv = tgt.valueBlocks[v];
            const cv = cur.valueBlocks[v];
            if (!tv && !cv) continue;
            if (!tv || !cv) {
              isMatch = false;
              break;
            }
            if (tv.type !== cv.type) {
              // console.log(`  - 🔍 [SubsequenceMatch] valueBlock[${v}] type mismatch: current="${cv.type}", target="${tv.type}"`);
              isMatch = false;
              break;
            }
            if (tv.type === 'variables_get' && tv.varName !== undefined && cv.varName !== tv.varName) {
              // console.log(`  - 🔍 [SubsequenceMatch] valueBlock[${v}] varName mismatch: current="${cv.varName}", target="${tv.varName}"`);
              isMatch = false;
              break;
            }
          }
        }
      }
    }

    if (isMatch) {
      // console.log(`  - ✅ [SubsequenceMatch] Matched target[${targetIdx}] (${tgt.type}${tgt.varName ? ` var="${tgt.varName}"` : ''}) with current[${currentIdx}] (${cur.type}${cur.varName ? ` var="${cur.varName}"` : ''})`);
      targetIdx++;
    }

    currentIdx++;
  }

  const allMatched = targetIdx === targetAnalysis.length;
  // if (allMatched) {
  //   console.log(`  - ✅ [SubsequenceMatch] All ${targetAnalysis.length} target blocks found as subsequence`);
  // } else {
  //   console.log(`  - ❌ [SubsequenceMatch] Only matched ${targetIdx}/${targetAnalysis.length} target blocks`);
  // }

  return allMatched;
}

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


// XML Utilities for Hint System
/**
 * ดึง XML structure จาก workspace
 */
export function getWorkspaceXml(workspace) {
  console.log("🔍 getWorkspaceXml called with:", {
    workspace: !!workspace,
    workspaceType: typeof workspace,
    hasBlockly: !!window.Blockly,
    hasBlocklyXml: !!window.Blockly?.Xml,
    hasWorkspaceToDom: !!window.Blockly?.Xml?.workspaceToDom
  });

  if (!workspace) {
    console.warn("⚠️ workspace is undefined in getWorkspaceXml");
    return null;
  }

  if (!window.Blockly || !window.Blockly.Xml) {
    console.warn("⚠️ Blockly.Xml is not ready yet");
    return null;
  }

  try {
    const xml = window.Blockly.Xml.workspaceToDom(workspace);
    console.log("🔍 XML converted successfully:", xml ? "XML DOM created" : "No XML DOM");
    return xml;
  } catch (err) {
    console.error("⚠️ Error converting workspace to XML:", err);
    return null;
  }
}

/**
 * Normalize variable name - เอา ID ออกถ้ามี
 * CRITICAL: ฟังก์ชันนี้ควรจะ normalize ชื่อตัวแปรให้เหมือนกัน
 * แต่ถ้า varValue ยังเป็น ID (ตัวเลข) แสดงว่ายังไม่ได้ resolve เป็นชื่อตัวแปร
 */
function normalizeVariableName(varValue) {
  if (!varValue) return '';

  // ถ้าเป็น ID (ตัวเลขทั้งหมด) - ควรจะ resolve เป็นชื่อตัวแปรก่อนเรียกฟังก์ชันนี้
  // แต่ถ้ายังเป็น ID อยู่ ให้คืนค่าเป็น ID (เพื่อให้เปรียบเทียบได้)
  if (/^\d+$/.test(varValue)) {
    console.log(`  - ⚠️ normalizeVariableName: varValue "${varValue}" is still an ID, should have been resolved earlier`);
    return varValue;
  }

  // ถ้ามีรูปแบบ name_number ให้เอาแค่ name (เช่น "neighbor_1" -> "neighbor")
  const match = varValue.match(/^(.+?)_(\d+)$/);
  if (match) {
    const baseName = match[1];
    console.log(`  - ℹ️ normalizeVariableName: "${varValue}" -> "${baseName}" (removed suffix)`);
    return baseName;
  }

  // ถ้าเป็นชื่อตัวแปรปกติ ให้คืนค่าเป็นชื่อตัวแปรนั้น
  console.log(`  - ℹ️ normalizeVariableName: "${varValue}" -> "${varValue}" (no normalization needed)`);
  return varValue;
}

/**
 * วิเคราะห์ XML structure แบบละเอียด
 * @param {Document|Element} xml - XML DOM element
 * @param {Blockly.Workspace} workspace - Optional workspace to resolve variable IDs to names
 */
export function analyzeXmlStructure(xml, workspace = null) {
  if (!xml) return "No XML provided";

  const blocks = xml.querySelectorAll('block');
  const analysis = [];

  // CRITICAL: สร้าง variable ID to name mapping จาก XML variables section
  const variableMap = new Map();
  const variablesSection = xml.querySelector('variables');
  if (variablesSection) {
    const variables = variablesSection.querySelectorAll('variable');
    variables.forEach(variable => {
      const varId = variable.getAttribute('id');
      const varName = variable.textContent || variable.getAttribute('name') || '';
      if (varId && varName) {
        variableMap.set(varId, varName);
        console.log(`  - 📝 Variable mapping from XML: ${varId} -> ${varName}`);
      }
    });
  }

  // CRITICAL: ถ้าไม่มี variables section ใน XML แต่มี workspace ให้ resolve จาก workspace
  if (!variablesSection && workspace && workspace.getVariableMap) {
    try {
      const variableMap_workspace = workspace.getVariableMap();
      const allVariables = variableMap_workspace.getAllVariables();
      allVariables.forEach(variable => {
        const varId = variable.getId();
        const varName = variable.name;
        if (varId && varName) {
          variableMap.set(varId, varName);
          console.log(`  - 📝 Variable mapping from workspace: ${varId} -> ${varName}`);
        }
      });
    } catch (e) {
      console.log(`  - ⚠️ Error getting variables from workspace: ${e.message}`);
    }
  }

  console.log(`  - 📊 Total variable mappings: ${variableMap.size}`);

  blocks.forEach((block, index) => {
    const type = block.getAttribute('type');
    const blockInfo = {
      index,
      type,
      hasStatement: !!block.querySelector('statement'),
      hasValue: !!block.querySelector('value'),
      hasNext: !!block.querySelector(':scope > next')
    };

    // CRITICAL: เช็ค field values สำหรับ blocks ที่สำคัญ
    // สำหรับ variables_set และ variables_get: เช็ค VAR field
    if (type === 'variables_set' || type === 'variables_get') {
      const varField = block.querySelector('field[name="VAR"]');
      if (varField) {
        // CRITICAL: Blockly ใช้ id attribute ใน field VAR แทน textContent
        // ลองดึง id ก่อน แล้วค่อย textContent แล้วค่อย value
        const varId = varField.getAttribute('id');
        const varText = varField.textContent;
        const varValueAttr = varField.getAttribute('value');
        let varValue = varId || varText || varValueAttr || '';

        console.log(`  - 🔍 VAR field raw: id=${varId}, textContent="${varText}", value=${varValueAttr}, initial="${varValue}"`);
        console.log(`  - 🔍 Variable map size: ${variableMap.size}, has "${varValue}": ${variableMap.has(varValue)}`);

        // CRITICAL: ถ้า varValue เป็น ID (อาจเป็นตัวเลขหรือ string ที่เป็น ID) ให้หา variable name จาก variableMap
        // Blockly variable IDs อาจเป็น string ที่ไม่ใช่ตัวเลข (เช่น "S=:s{UNuK~JF42YVTzI5")
        if (varValue && variableMap.has(varValue)) {
          const mappedName = variableMap.get(varValue);
          varValue = mappedName;
          console.log(`  - ✅ VAR field ID "${varId}" mapped to name: "${mappedName}"`);
        } else if (varValue && /^\d+$/.test(varValue)) {
          // ถ้าเป็นตัวเลขทั้งหมด ให้ลองหาใน variableMap
          const mappedName = variableMap.get(varValue);
          if (mappedName) {
            varValue = mappedName;
            console.log(`  - ✅ VAR field numeric ID "${varId}" mapped to name: "${mappedName}"`);
          } else {
            console.log(`  - ⚠️ VAR field numeric ID "${varId}" not found in variableMap (size: ${variableMap.size}), keeping as ID`);
            // ถ้าไม่พบใน variableMap และเป็นตัวเลข อาจเป็น ID ที่ยังไม่ได้ resolve
            // ให้ลองหาใน workspace (ถ้ามี)
            if (workspace && workspace.getVariableMap) {
              try {
                const variableMap_workspace = workspace.getVariableMap();
                const variable = variableMap_workspace.getVariableById(varValue);
                if (variable) {
                  varValue = variable.name;
                  console.log(`  - ✅ VAR field ID "${varId}" resolved from workspace: "${varValue}"`);
                }
              } catch (e) {
                console.log(`  - ⚠️ Error resolving variable ID from workspace: ${e.message}`);
              }
            }
          }
        } else if (varValue && !variableMap.has(varValue)) {
          // ถ้าไม่ใช่ ID และไม่พบใน variableMap อาจเป็นชื่อตัวแปรโดยตรง
          // แต่ถ้าเป็น string ที่ยาวและมี special characters อาจเป็น ID
          if (varValue.length > 10 || /[^a-zA-Z0-9_]/.test(varValue)) {
            console.log(`  - ⚠️ VAR field value "${varValue}" looks like an ID but not in variableMap`);
            // ลองหาใน workspace
            if (workspace && workspace.getVariableMap) {
              try {
                const variableMap_workspace = workspace.getVariableMap();
                const variable = variableMap_workspace.getVariableById(varValue);
                if (variable) {
                  varValue = variable.name;
                  console.log(`  - ✅ VAR field ID "${varId}" resolved from workspace: "${varValue}"`);
                } else {
                  console.log(`  - ⚠️ VAR field ID "${varId}" not found in workspace either`);
                }
              } catch (e) {
                console.log(`  - ⚠️ Error resolving variable ID from workspace: ${e.message}`);
              }
            }
          } else {
            console.log(`  - ℹ️ VAR field value "${varValue}" not in variableMap, assuming it's a variable name`);
          }
        }

        console.log(`  - 🔍 VAR field final value: "${varValue}"`);

        const normalized = normalizeVariableName(varValue);
        blockInfo.varName = normalized;
        console.log(`  - ✅ Normalized VAR: ${varValue} -> ${normalized}`);
      } else {
        console.log(`  - ⚠️ No VAR field found for ${type} block`);
      }
    }


    // สำหรับ procedures: เช็ค NAME field
    if (type === 'procedures_defreturn' || type === 'procedures_defnoreturn' ||
      type === 'procedures_callreturn' || type === 'procedures_callnoreturn') {
      const nameField = block.querySelector('field[name="NAME"]');
      console.log(`  - 🔍 Procedure block ${type}: NAME field exists=${!!nameField}`);
      if (nameField) {
        const textContent = nameField.textContent;
        const valueAttr = nameField.getAttribute('value');
        blockInfo.procedureName = textContent || valueAttr || '';
        console.log(`  - ✅ Procedure NAME: textContent="${textContent}", value="${valueAttr}", final="${blockInfo.procedureName}"`);
      } else {
        console.log(`  - ⚠️ No NAME field found for ${type} block`);
      }
    }

    // วิเคราะห์ statement blocks
    if (blockInfo.hasStatement) {
      const statementBlocks = block.querySelectorAll('statement block');
      blockInfo.statementBlocks = Array.from(statementBlocks).map(b => b.getAttribute('type'));
    }

    // วิเคราะห์ value blocks - CRITICAL: เช็ค variable names ใน value blocks ด้วย
    if (blockInfo.hasValue) {
      const valueBlocks = block.querySelectorAll('value block');
      blockInfo.valueBlocks = Array.from(valueBlocks).map(b => {
        const blockType = b.getAttribute('type');
        const blockInfo = { type: blockType };

        // CRITICAL: ถ้าเป็น variables_get ใน value block ให้เช็ค VAR field ด้วย
        if (blockType === 'variables_get') {
          const varField = b.querySelector('field[name="VAR"]');
          if (varField) {
            const varId = varField.getAttribute('id');
            const varText = varField.textContent;
            const varValueAttr = varField.getAttribute('value');
            let varValue = varId || varText || varValueAttr || '';

            // CRITICAL: ถ้า varValue เป็น ID (อาจเป็นตัวเลขหรือ string ที่เป็น ID) ให้หา variable name จาก variableMap
            if (varValue && variableMap.has(varValue)) {
              const mappedName = variableMap.get(varValue);
              varValue = mappedName;
              console.log(`  - 🔍 Value block VAR field ID ${varId} mapped to name: ${mappedName}`);
            } else if (varValue && /^\d+$/.test(varValue)) {
              // ถ้าเป็นตัวเลขทั้งหมด ให้ลองหาใน variableMap
              const mappedName = variableMap.get(varValue);
              if (mappedName) {
                varValue = mappedName;
                console.log(`  - 🔍 Value block VAR field numeric ID ${varId} mapped to name: ${mappedName}`);
              } else {
                console.log(`  - ⚠️ Value block VAR field numeric ID ${varId} not found in variableMap, keeping as ID`);
              }
            } else if (varValue && !variableMap.has(varValue)) {
              // ถ้าไม่ใช่ ID และไม่พบใน variableMap อาจเป็นชื่อตัวแปรโดยตรง
              console.log(`  - ℹ️ Value block VAR field value "${varValue}" not in variableMap, assuming it's a variable name`);
            }

            const normalized = normalizeVariableName(varValue);
            blockInfo.varName = normalized;
            console.log(`  - ✅ Value block variables_get VAR: ${varValue} -> ${normalized}`);
          }
        }

        return blockInfo;
      });
    }

    analysis.push(blockInfo);
  });

  return analysis;
}







