// Pattern Matching — Blockly Workspace analysis + subsequence matching + best pattern selection
// Refactored: uses Blockly Headless Workspace for XML → block analysis (no more manual XML parsing)

import * as Blockly from 'blockly/core';

// ─── Variable Name Normalization ────────────────────────────────

/** ดึง text/value จาก Blockly field */
const getFieldText = (field) => field?.getText?.() ?? field?.getValue?.() ?? '';

/** ลบ suffix _number ออก เช่น "neighbor_1" → "neighbor" */
function normalizeVariableName(varValue) {
  if (!varValue) return '';
  const match = varValue.match(/^(.+?)_(\d+)$/);
  return match ? match[1] : varValue;
}

/** ดึงข้อมูลตัวแปร, ฟังก์ชัน, และ Field ย่อยอื่นๆ ออกจากบล็อก */
function extractBlockData(block, type, info) {
  // Resolve variable name
  if (type === 'variables_set' || type === 'variables_get') {
    try {
      const varField = block.getField('VAR');
      if (varField) {
        const rawName = getFieldText(varField);
        info.varName = normalizeVariableName(rawName);
      }
    } catch (e) { /* ignore */ }
  }

  // Resolve procedure name
  if (type?.includes('procedures_')) {
    try {
      const nameField = block.getField('NAME');
      if (nameField) {
        info.procedureName = getFieldText(nameField);
      }
    } catch (e) { /* ignore */ }
  }

  // Collect field values (skip VAR and NAME as they are handled above)
  const fields = {};
  const inputList = block.inputList || [];
  for (const input of inputList) {
    const fieldRow = input.fieldRow || [];
    for (const field of fieldRow) {
      const name = field.name;
      if (name && name !== 'VAR' && name !== 'NAME') {
        const value = getFieldText(field);
        if (value !== undefined && value !== null) {
          fields[name] = String(value);
        }
      }
    }
  }
  if (Object.keys(fields).length > 0) info.fields = fields;
}

// ─── Workspace → Block Analysis ─────────────────────────────────

/**
 * วิเคราะห์ workspace → block array ที่เรียงตาม DFS tree structure
 * Output: { index, id, type, treeId, depth, varName?, procedureName?, fields?, hasStatement, hasValue, hasNext }
 * Export เพื่อให้ usePseudocodeSync ใช้หา DFS index ของบล็อกที่ถูกคลิก
 */
export function analyzeWorkspace(workspace) {
  if (!workspace) return [];

  const analysis = [];
  let blockIndex = 0;

  // 🔥 TEMP: แสดง INPUT ดิบๆ (ลบทีหลัง)
  const topBlocks = workspace.getTopBlocks(true);
  console.log('📥 INPUT topBlocks:', topBlocks);

  function traverseBlock(block, treeId, depth = 0, ancestorChain = []) {
    if (!block) return;
    const type = block.type;
    if (!type) return;

    const currentChain = [...ancestorChain, type];
    const ancestorStr = currentChain.join('|');

    const info = {
      index: blockIndex++,
      id: block.id,     // สำหรับค้นหาบล็อกที่ถูกคลิก
      type,
      treeId,
      depth,
      ancestorStr,
      parentId: block.getParent()?.id,
      data: block.data,
      hasStatement: false,
      hasValue: false,
      hasNext: false
    };

    extractBlockData(block, type, info);

    analysis.push(info);

    // Traverse children: value inputs, statement inputs, next connection
    const inputList = block.inputList || [];
    const INPUT_VALUE = Blockly.inputs.inputTypes.VALUE;
    const INPUT_STATEMENT = Blockly.inputs.inputTypes.STATEMENT;
    for (const input of inputList) {
      if (input.type === INPUT_VALUE) {
        const child = input.connection?.targetBlock();
        if (child) {
          info.hasValue = true;
          // ส่ง currentChain ต่อลงไปให้ child

          traverseBlock(child, treeId, depth + 1, currentChain);
        }
      } else if (input.type === INPUT_STATEMENT) {
        const child = input.connection?.targetBlock();
        if (child) {
          info.hasStatement = true;
          // ส่ง currentChain ต่อลงไปให้ child

          traverseBlock(child, treeId, depth + 1, currentChain);
        }
      }
    }

    // Next block in the stack (same depth — siblings)
    // Sibling มี ancestor chain เหมือนกับตัวเอง (ไม่นับตัวเองเป็น ancestor ของ sibling)
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      info.hasNext = true;

      traverseBlock(nextBlock, treeId, depth, ancestorChain);
    }
  }

  // Get only top-level blocks (blocks without a parent)
  let currentTreeId = 0;

  for (const topBlock of topBlocks) {
    traverseBlock(topBlock, currentTreeId++);
  }

  const typeCounts = {};
  const varCounts = {};
  analysis.forEach(b => {
    b.typeOcc = typeCounts[b.type] || 0;
    typeCounts[b.type] = b.typeOcc + 1;
    if (b.varName) {
      const vk = b.type + '::' + b.varName;
      b.varOcc = varCounts[vk] || 0;
      varCounts[vk] = b.varOcc + 1;
    }
  });

  console.log("🧩 [Block extraction] DFS Analysis:", analysis.map(b => `[${b.index}] ${b.type}${b.varName ? '(' + b.varName + ')' : ''} (t-occ:${b.typeOcc})`));
  // 🔥 TEMP: วาดต้นไม้ + ตาราง (ลบทีหลัง)
  console.log('\n🌳 DFS Tree View:');
  analysis.forEach(b => {
    const indent = '  '.repeat(b.depth);
    const label = b.varName ? `${b.type}(${b.varName})` : b.type;
    console.log(`${indent}├─ [${b.index}] ${label}`);
  });
  console.log('\n📋 Flat 1D Array:');
  console.table(analysis.map(b => ({ idx: b.index, type: b.type, depth: b.depth, varName: b.varName || '', procName: b.procedureName || '', fields: b.fields ? JSON.stringify(b.fields) : '' })));
  return analysis;
}

// ─── Headless Workspace: XML String → Block Analysis ────────────

/**
 * แปลง XML String → block analysis โดยใช้ Blockly Headless Workspace
 * สร้าง workspace ชั่วคราว โหลด XML เข้าไป วิเคราะห์ แล้ว dispose ทิ้ง
 */
function parseXmlToAnalysis(xmlString) {
  if (!xmlString) return [];

  let tempWorkspace = null;
  try {
    tempWorkspace = new Blockly.Workspace();
    const dom = Blockly.utils.xml.textToDom(xmlString);
    Blockly.Xml.domToWorkspace(dom, tempWorkspace);
    return analyzeWorkspace(tempWorkspace);
  } catch (e) {
    console.warn('Failed to parse XML via Headless Workspace:', e.message);
    return [];
  } finally {
    if (tempWorkspace) {
      try { tempWorkspace.dispose(); } catch (e) { /* ignore */ }
    }
  }
}

// ─── Pattern Cache ──────────────────────────────────────────────

/**
 * Pre-parse ทุก hint ของทุก pattern ครั้งเดียว เก็บเป็น cached analysis
 * เรียกตอนโหลด patterns ครั้งแรก ไม่ต้อง parse XML ซ้ำทุกครั้งที่ผู้เล่นขยับบล็อก
 *
 * @param {Array} patterns - Array ของ pattern objects จาก DB
 * @returns {Array} cachedPatterns — เหมือน patterns เดิม แต่เพิ่ม _cachedHintAnalysis
 */
export function preparePatternsCache(patterns) {
  if (!patterns || patterns.length === 0) return [];
  const result = patterns.map(pattern => {
    const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
    const cachedHints = hints.map(hint => {
      const xmlCheck = hint.xmlCheck || hint.xmlcheck;
      return {
        ...hint,
        _cachedAnalysis: xmlCheck ? parseXmlToAnalysis(xmlCheck) : []
      };
    });

    return {
      ...pattern,
      hints: cachedHints
    };
  });

  // 🔥 TEMP: แสดงเฉลยที่ Cache ไว้ (ลบทีหลัง)
  console.log('📦 เฉลย (Cached Patterns):');
  result.forEach(p => {
    console.log(`   Pattern: "${p.pattern_name || p.name || 'Unknown'}"`);
    (p.hints || []).forEach((h, i) => {
      console.log(`   Hint ${i + 1}:`);
      console.table((h._cachedAnalysis || []).map(b => ({ idx: b.index, type: b.type, depth: b.depth, varName: b.varName || '', fields: b.fields ? JSON.stringify(b.fields) : '' })));
    });
  });

  return result;
}

// ─── Block Matching (คงเดิม 100%) ──────────────────────────────

/** เทียบ 2 blocks ว่าตรงกันหรือไม่ (type, depth, varName, procedureName, fields) */
function isBlockMatch(current, target) {
  if (current.type !== target.type) return false;
  if (target.depth !== undefined && current.depth !== target.depth) return false;
  if (target.varName !== undefined && current.varName !== target.varName) return false;
  if (target.procedureName !== undefined && current.procedureName !== undefined
    && current.procedureName !== target.procedureName) return false;
  if (target.fields) {
    for (const [key, val] of Object.entries(target.fields)) {
      if (!current.fields || current.fields[key] !== val) return false;
    }
  }
  return true;
}

/** Subsequence matching — หา target blocks ใน current ตามลำดับ (รองรับทั้งแบบ Loose และ Strict) */
function matchSubsequence(currentAnalysis, targetAnalysis, isStrict = false) {
  if (targetAnalysis.length === 0) return { matched: 0, total: 0, isFullMatch: true };

  if (isStrict) {
    // ─── STRICT SEQUENTIAL (ห้ามมีบล็อกอื่นแทรกกลาง) ───
    let bestMatched = 0;
    for (let i = 0; i < currentAnalysis.length; i++) {
      let matched = 0;
      for (let j = 0; j < targetAnalysis.length; j++) {
        if (i + j >= currentAnalysis.length) break;
        if (isBlockMatch(currentAnalysis[i + j], targetAnalysis[j])) {
          matched++;
        } else {
          break;
        }
      }
      bestMatched = Math.max(bestMatched, matched);
      if (bestMatched === targetAnalysis.length) break;
    }
    return { matched: bestMatched, total: targetAnalysis.length, isFullMatch: bestMatched === targetAnalysis.length };
  } else {
    // ─── LOOSE SUBSEQUENCE (อนุญาตให้มีบล็อกอื่นแทรกกลางได้) ───
    let matched = 0;
    let ci = 0;
    for (const target of targetAnalysis) {
      let found = false;
      while (ci < currentAnalysis.length) {
        if (isBlockMatch(currentAnalysis[ci], target)) {
          matched++;
          ci++;
          found = true;
          break;
        }
        ci++;
      }
      if (!found) break;
    }
    return { matched, total: targetAnalysis.length, isFullMatch: matched === targetAnalysis.length };
  }
}

/**
 * Tree-aware matching — เทียบแต่ละ target tree กับ workspace tree แยกกัน
 * ป้องกัน loose blocks จาก tree อื่นมาเพิ่ม % ผิดๆ
 */
function matchSubsequenceByTree(currentAnalysis, targetAnalysis, isStrict = false) {
  if (!Array.isArray(currentAnalysis) || !Array.isArray(targetAnalysis) || targetAnalysis.length === 0) {
    return { matched: 0, total: 0, isFullMatch: false };
  }

  // Group by treeId
  const group = (blocks) => {
    const map = new Map();
    for (const b of blocks) {
      const tid = b.treeId ?? 0;
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid).push(b);
    }
    return map;
  };

  const targetTrees = group(targetAnalysis);
  const currentTrees = group(currentAnalysis);
  const usedTrees = new Set();
  let totalMatched = 0;
  let totalBlocks = 0;

  for (const [, targetBlocks] of targetTrees) {
    totalBlocks += targetBlocks.length;
    let bestMatch = 0;
    let bestTreeId = null;

    for (const [treeId, currentBlocks] of currentTrees) {
      if (usedTrees.has(treeId)) continue;
      // Pass isStrict flag down
      const { matched } = matchSubsequence(currentBlocks, targetBlocks, isStrict);
      if (matched > bestMatch) {
        bestMatch = matched;
        bestTreeId = treeId;
      }
    }

    totalMatched += bestMatch;
    if (bestTreeId !== null) usedTrees.add(bestTreeId);
  }

  return { matched: totalMatched, total: totalBlocks, isFullMatch: totalMatched === totalBlocks };
}

// ─── Main: Find Best Pattern Match ──────────────────────────────

const EMPTY_RESULT = {
  bestPattern: null, matchedSteps: 0, percentage: 0,
  isComplete: false, effects: [], matchedBlocks: 0, totalBlocks: 0
};

/** คำนวณรวบยอดว่าคะแนนการแมตช์สุดท้าย ได้กี่เปอร์เซ็นต์ */
function calculateMatchResult(bestPattern, bestSteps, bestMatchedBlocks, bestTotalBlocks) {
  if (!bestPattern) return EMPTY_RESULT;

  const totalSteps = bestPattern.hints?.length || 0;
  const matchedSteps = Math.min(bestSteps, totalSteps);

  let percentage = bestTotalBlocks > 0
    ? Math.round((bestMatchedBlocks / bestTotalBlocks) * 100)
    : totalSteps > 0 ? Math.round((matchedSteps / totalSteps) * 100) : 0;
  percentage = Math.min(percentage, 100);

  const isComplete = percentage === 100 && totalSteps > 0;

  // Collect effects (cumulative: ทุก step ที่ผ่าน)
  const effects = bestPattern.hints?.slice(0, matchedSteps).map(h => h.effect).filter(Boolean) || [];

  return {
    bestPattern,
    matchedSteps,
    percentage,
    isComplete,
    effects,
    matchedBlocks: bestMatchedBlocks,
    totalBlocks: bestTotalBlocks
  };
}

/** นับจำนวน step ที่ผ่าน (full match ตามลำดับ) — ใช้ cached analysis */
/** นับจำนวน step ที่ผ่าน (full match ตามลำดับ) — ใช้ LOOSE matching เพื่อช่วยผู้เล่น */
function countMatchedSteps(currentAnalysis, hints) {
  let stepsMatched = 0;
  // 🔥 TEMP (ลบทีหลัง)
  console.log(`\n🪜 === เทียบทีละ Step (Loose) ===`);
  for (let i = 0; i < hints.length; i++) {
    const hint = hints[i];
    const targetAnalysis = hint._cachedAnalysis;
    if (!targetAnalysis || targetAnalysis.length === 0) continue;
    // ใช้ Loose matching (isStrict = false) สำหรับขั้นบันได (Hints)
    const result = matchSubsequenceByTree(currentAnalysis, targetAnalysis, false);
    // 🔥 TEMP (ลบทีหลัง)
    const blocks = targetAnalysis.map(b => b.type).join(', ');
    console.log(`   Step ${i + 1}: [${blocks}] → ${result.isFullMatch ? '✅ ผ่าน' : `❌ ไม่ผ่าน (${result.matched}/${result.total})`}`);
    if (result.isFullMatch) {
      stepsMatched++;
    } else {
      console.log(`   ⛔ หยุด! Step ${i + 1} ไม่ผ่าน ไม่เช็คต่อ`);
      break;
    }
  }
  console.log(`   สรุป Loose: ผ่าน ${stepsMatched}/${hints.length} Steps`);
  return stepsMatched;
}

/** นับ block ที่ตรงกับ final hint (ใช้ STRICT matching เพื่อวัดความสมบูรณ์แบบสูงสุด) */
function countBlockMatch(currentAnalysis, hints) {
  const lastHint = hints[hints.length - 1];
  const targetAnalysis = lastHint?._cachedAnalysis;
  if (!targetAnalysis || targetAnalysis.length === 0) return { matched: 0, total: 0 };

  // ใช้ Strict matching (isStrict = true) สำหรับการเช็ค 100% และปลดล็อกอาวุธ
  const result = matchSubsequenceByTree(currentAnalysis, targetAnalysis, true);
  return { matched: result.matched, total: result.total };
}

/** ฟังก์ชันหลัก: หา pattern ที่ตรงมากสุดจาก workspace */
export function findBestMatch(workspace, cachedPatterns) {
  if (!workspace || !cachedPatterns || cachedPatterns.length === 0) return EMPTY_RESULT;

  // วิเคราะห์ workspace ปัจจุบันของผู้เล่น (ใช้ Blockly API โดยตรง)
  const currentAnalysis = analyzeWorkspace(workspace);
  if (currentAnalysis.length === 0) return EMPTY_RESULT;

  const sortedPatterns = [...cachedPatterns].sort((a, b) => (a.pattern_type_id || 999) - (b.pattern_type_id || 999));

  // หา pattern ที่ match ดีที่สุด (block count > step count)
  let best = null, bestSteps = -1, bestMatchedBlocks = -1, bestTotalBlocks = 0;

  for (const pattern of sortedPatterns) {
    const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
    if (hints.length === 0) continue;

    const stepsMatched = countMatchedSteps(currentAnalysis, hints);
    const { matched, total } = countBlockMatch(currentAnalysis, hints);

    console.log(`\n🔍 === เทียบ Pattern: "${pattern.name || pattern.id || 'Unknown'}" ===`);
    // 🔥 TEMP: ข้อมูลดิบ (ลบทีหลัง)
    console.log('👦 ของเด็ก (Workspace):', currentAnalysis);
    console.log('🎯 เฉลย (Pattern Cache):', hints[hints.length - 1]?._cachedAnalysis);

    // 🔥 TEMP: โชว์การเทียบ Loose (ลบทีหลัง)
    const lastTarget = hints[hints.length - 1]?._cachedAnalysis || [];
    console.log(`\n📊 เทียบทีละตัว (Strict):  ของเด็ก vs เฉลย`);
    console.table(lastTarget.map((t, i) => {
      const c = currentAnalysis.find((b, bi) => bi >= i && isBlockMatch(b, t));
      return {
        '🎯 เฉลย_type': t.type,
        '🎯 เฉลย_depth': t.depth,
        '👦 เด็ก_type': c ? c.type : '❌ ไม่เจอ',
        '👦 เด็ก_depth': c ? c.depth : '-',
        'ผล': c ? '✅ ตรง' : '❌ ไม่ตรง'
      };
    }));
    console.log(`   Loose Steps: ${stepsMatched}/${hints.length} ขั้น | Strict Blocks: ${matched}/${total} บล็อก`);

    if (matched > bestMatchedBlocks || (matched === bestMatchedBlocks && stepsMatched > bestSteps)) {
      best = pattern;
      bestSteps = stepsMatched;
      bestMatchedBlocks = matched;
      bestTotalBlocks = total;
    }
  }

  if (!best) return EMPTY_RESULT;

  return calculateMatchResult(best, bestSteps, bestMatchedBlocks, bestTotalBlocks);
}
