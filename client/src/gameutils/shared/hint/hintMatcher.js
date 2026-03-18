// Pattern Matching — Blockly Workspace analysis + subsequence matching + best pattern selection
// Refactored: uses Blockly Headless Workspace for XML → block analysis (no more manual XML parsing)

import * as Blockly from 'blockly/core';

// ─── Variable Name Normalization ────────────────────────────────

/** ลบ suffix _number ออก เช่น "neighbor_1" → "neighbor" */
function normalizeVariableName(varValue) {
  if (!varValue) return '';
  const match = varValue.match(/^(.+?)_(\d+)$/);
  return match ? match[1] : varValue;
}

// ─── Workspace → Block Analysis ─────────────────────────────────

/**
 * วิเคราะห์ workspace → block array ที่เรียงตาม tree structure
 * ใช้ Blockly API จริง (ไม่ต้องแกะ XML ด้วยมือ)
 * แต่ละ block มี treeId เพื่อระบุว่าอยู่กลุ่มไหนที่ต่อกัน
 *
 * Output format เหมือนเดิมทุกประการ:
 * { index, type, treeId, varName?, procedureName?, fields?, hasStatement, hasValue, hasNext }
 */
function analyzeWorkspace(workspace) {
  if (!workspace) return [];

  const analysis = [];
  let blockIndex = 0;

  function traverseBlock(block, treeId) {
    if (!block) return;
    const type = block.type;
    if (!type) return;

    const info = {
      index: blockIndex++,
      type,
      treeId,
      hasStatement: false,
      hasValue: false,
      hasNext: false
    };

    // Resolve variable name (same logic as before)
    if (type === 'variables_set' || type === 'variables_get') {
      try {
        const varField = block.getField('VAR');
        if (varField) {
          // getText() returns the display name of the variable
          const rawName = varField.getText ? varField.getText() : (varField.getValue ? varField.getValue() : '');
          info.varName = normalizeVariableName(rawName);
        }
      } catch (e) { /* ignore */ }
    }

    // Resolve procedure name
    if (type?.includes('procedures_')) {
      try {
        const nameField = block.getField('NAME');
        if (nameField) {
          info.procedureName = nameField.getText ? nameField.getText() : (nameField.getValue ? nameField.getValue() : '');
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
          const value = field.getText ? field.getText() : (field.getValue ? field.getValue() : '');
          if (value !== undefined && value !== null) {
            fields[name] = String(value);
          }
        }
      }
    }
    if (Object.keys(fields).length > 0) info.fields = fields;

    analysis.push(info);

    // Traverse children: value inputs, statement inputs, next connection
    const INPUT_VALUE = Blockly.inputs.inputTypes.VALUE;
    const INPUT_STATEMENT = Blockly.inputs.inputTypes.STATEMENT;
    for (const input of inputList) {
      if (input.type === INPUT_VALUE) {
        const child = input.connection?.targetBlock();
        if (child) {
          info.hasValue = true;
          traverseBlock(child, treeId);
        }
      } else if (input.type === INPUT_STATEMENT) {
        const child = input.connection?.targetBlock();
        if (child) {
          info.hasStatement = true;
          // Only traverse the first child — subsequent blocks in the chain
          // are handled by each block's own getNextBlock() at the end
          traverseBlock(child, treeId);
        }
      }
    }

    // Next block in the stack (skip if already traversed in statement chain above)
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      info.hasNext = true;
      traverseBlock(nextBlock, treeId);
    }
  }

  // Get only top-level blocks (blocks without a parent)
  const topBlocks = workspace.getTopBlocks(true);
  let currentTreeId = 0;

  for (const topBlock of topBlocks) {
    traverseBlock(topBlock, currentTreeId++);
  }

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

  return patterns.map(pattern => {
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
}

// ─── Block Matching (คงเดิม 100%) ──────────────────────────────

/** เทียบ 2 blocks ว่าตรงกันหรือไม่ (type, varName, procedureName, fields) */
function isBlockMatch(current, target) {
  if (current.type !== target.type) return false;
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

/** Subsequence matching — หา target blocks ใน current ตามลำดับ */
function matchSubsequence(currentAnalysis, targetAnalysis) {
  if (!Array.isArray(currentAnalysis) || !Array.isArray(targetAnalysis) || targetAnalysis.length === 0) {
    return { matched: 0, total: 0, isFullMatch: false };
  }

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

/**
 * Tree-aware matching — เทียบแต่ละ target tree กับ workspace tree แยกกัน
 * ป้องกัน loose blocks จาก tree อื่นมาเพิ่ม % ผิดๆ
 */
function matchSubsequenceByTree(currentAnalysis, targetAnalysis) {
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
      const { matched } = matchSubsequence(currentBlocks, targetBlocks);
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

/** นับจำนวน step ที่ผ่าน (full match ตามลำดับ) — ใช้ cached analysis */
function countMatchedSteps(currentAnalysis, hints) {
  let stepsMatched = 0;
  for (const hint of hints) {
    const targetAnalysis = hint._cachedAnalysis;
    if (!targetAnalysis || targetAnalysis.length === 0) continue;
    if (matchSubsequenceByTree(currentAnalysis, targetAnalysis).isFullMatch) {
      stepsMatched++;
    } else {
      break;
    }
  }
  return stepsMatched;
}

/** นับ block ที่ตรงกับ final hint ของ pattern (สำหรับ % และ tie-breaking) — ใช้ cached analysis */
function countBlockMatch(currentAnalysis, hints) {
  const lastHint = hints[hints.length - 1];
  const targetAnalysis = lastHint?._cachedAnalysis;
  if (!targetAnalysis || targetAnalysis.length === 0) return { matched: 0, total: 0 };
  const result = matchSubsequenceByTree(currentAnalysis, targetAnalysis);
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

    if (matched > bestMatchedBlocks || (matched === bestMatchedBlocks && stepsMatched > bestSteps)) {
      best = pattern;
      bestSteps = stepsMatched;
      bestMatchedBlocks = matched;
      bestTotalBlocks = total;
    }
  }

  if (!best) return EMPTY_RESULT;

  // คำนวณผลลัพธ์
  const totalSteps = best.hints?.length || 0;
  const matchedSteps = Math.min(bestSteps, totalSteps);

  let percentage = bestTotalBlocks > 0
    ? Math.round((bestMatchedBlocks / bestTotalBlocks) * 100)
    : totalSteps > 0 ? Math.round((matchedSteps / totalSteps) * 100) : 0;
  percentage = Math.min(percentage, 100);

  const isComplete = percentage === 100 || (matchedSteps >= totalSteps && totalSteps > 0);

  // Collect effects (cumulative: ทุก step ที่ผ่าน)
  const effects = best.hints?.slice(0, matchedSteps).map(h => h.effect).filter(Boolean) || [];

  return { bestPattern: best, matchedSteps, percentage, isComplete, effects, matchedBlocks: bestMatchedBlocks, totalBlocks: bestTotalBlocks };
}
