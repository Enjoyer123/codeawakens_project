// Pattern Matching Functions for Hint System — Simplified
// รวม logic ทั้งหมดเป็นที่เดียว: XML analysis + subsequence matching + best pattern selection

const DEBUG_HINT = false;
function log(...args) { if (DEBUG_HINT) console.log(...args); }

// ─── XML Utilities ───────────────────────────────────────────────

/**
 * ดึง XML structure จาก Blockly workspace
 */
function getWorkspaceXml(workspace) {
  if (!workspace || !window.Blockly?.Xml?.workspaceToDom) return null;
  try {
    return window.Blockly.Xml.workspaceToDom(workspace);
  } catch (err) {
    console.error("Error converting workspace to XML:", err);
    return null;
  }
}

// ─── Variable Resolution ─────────────────────────────────────────

/**
 * Normalize variable name — ลบ suffix _number ออก (เช่น "neighbor_1" → "neighbor")
 */
function normalizeVariableName(varValue) {
  if (!varValue) return '';
  const match = varValue.match(/^(.+?)_(\d+)$/);
  return match ? match[1] : varValue;
}

/**
 * สร้าง variable ID → name mapping จาก XML <variables> section และ/หรือ workspace
 */
function buildVariableMap(xml, workspace) {
  const map = new Map();

  const variablesSection = xml.querySelector('variables');
  if (variablesSection) {
    variablesSection.querySelectorAll('variable').forEach(v => {
      const id = v.getAttribute('id');
      const name = v.textContent || v.getAttribute('name') || '';
      if (id && name) map.set(id, name);
    });
  } else if (workspace?.getVariableMap) {
    try {
      workspace.getVariableMap().getAllVariables().forEach(v => {
        const id = v.getId();
        if (id && v.name) map.set(id, v.name);
      });
    } catch (e) { /* ignore */ }
  }

  return map;
}

/**
 * Resolve variable field → actual variable name
 * ลองหาจาก variableMap (XML) ก่อน → ถ้าไม่เจอลอง workspace → ใช้ค่า raw
 */
function resolveVarName(varField, variableMap, workspace) {
  const varId = varField.getAttribute('id');
  const varText = varField.textContent;
  const raw = varId || varText || varField.getAttribute('value') || '';

  // 1. หาจาก XML variables section
  if (variableMap.has(raw)) return normalizeVariableName(variableMap.get(raw));

  // 2. หาจาก workspace API
  if (workspace?.getVariableMap) {
    try {
      const v = workspace.getVariableMap().getVariableById(raw);
      if (v) return normalizeVariableName(v.name);
    } catch (e) { /* ignore */ }
  }

  // 3. ใช้ค่า raw (อาจเป็นชื่อตัวแปรจริงๆ)
  return normalizeVariableName(raw);
}

// ─── XML Structure Analysis ──────────────────────────────────────

/**
 * วิเคราะห์ XML → block array ที่ใช้เปรียบเทียบ
 */
function analyzeXmlStructure(xml, workspace = null) {
  if (!xml) return [];

  const variableMap = buildVariableMap(xml, workspace);
  const blocks = xml.querySelectorAll('block');
  const analysis = [];

  blocks.forEach((block, index) => {
    const type = block.getAttribute('type');
    const info = {
      index,
      type,
      hasStatement: !!block.querySelector('statement'),
      hasValue: !!block.querySelector('value'),
      hasNext: !!block.querySelector(':scope > next')
    };

    // Variable blocks: resolve VAR field
    if (type === 'variables_set' || type === 'variables_get') {
      const varField = block.querySelector('field[name="VAR"]');
      if (varField) info.varName = resolveVarName(varField, variableMap, workspace);
    }

    // Procedure blocks: get NAME field
    if (type?.includes('procedures_')) {
      const nameField = block.querySelector('field[name="NAME"]');
      if (nameField) info.procedureName = nameField.textContent || nameField.getAttribute('value') || '';
    }

    // Value blocks (เก็บไว้เผื่อ strict mode ในอนาคต)
    if (info.hasValue) {
      const valueBlocks = block.querySelectorAll('value block');
      info.valueBlocks = Array.from(valueBlocks).map(b => {
        const vb = { type: b.getAttribute('type') };
        if (vb.type === 'variables_get') {
          const varField = b.querySelector('field[name="VAR"]');
          if (varField) vb.varName = resolveVarName(varField, variableMap, workspace);
        }
        return vb;
      });
    }

    analysis.push(info);
  });

  return analysis;
}

// ─── Subsequence Matching ────────────────────────────────────────

/**
 * เปรียบเทียบ 2 blocks ว่า "ตรงกัน" หรือไม่
 */
function isBlockMatch(current, target) {
  if (current.type !== target.type) return false;

  // varName (ถ้า target ระบุ ต้องตรง)
  if (target.varName !== undefined && current.varName !== target.varName) return false;

  // procedureName (relaxed: skip ถ้า current ยังไม่มี)
  if (target.procedureName !== undefined && current.procedureName !== undefined
    && current.procedureName !== target.procedureName) return false;

  return true;
}

/**
 * Subsequence matching — ฟังก์ชันเดียวแทน 3 ชุดเดิม
 * 
 * หา target blocks ใน current ตามลำดับ (ไม่ต้องติดกัน)
 * Prefix-based: หยุดเมื่อหา target block ไม่เจอ
 * 
 * @returns {{ matched: number, total: number, isFullMatch: boolean }}
 */
function matchSubsequence(currentAnalysis, targetAnalysis) {
  if (!Array.isArray(currentAnalysis) || !Array.isArray(targetAnalysis)) {
    return { matched: 0, total: 0, isFullMatch: false };
  }
  if (targetAnalysis.length === 0) {
    return { matched: 0, total: 0, isFullMatch: true };
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

  return {
    matched,
    total: targetAnalysis.length,
    isFullMatch: matched === targetAnalysis.length
  };
}

// ─── Main: Find Best Pattern Match ───────────────────────────────

/**
 * Sort patterns by pattern_type_id (ascending, lower = better)
 */
function sortByPatternType(patterns) {
  return [...patterns].sort((a, b) => (a.pattern_type_id || 999) - (b.pattern_type_id || 999));
}

/**
 * ฟังก์ชันหลัก: หา pattern ที่ตรงมากสุดจาก workspace
 * 
 * เช็คแบบ step-based: แต่ละ hint step มี xmlCheck
 * วนทีละ step ตามลำดับ → หยุดเมื่อ step ไม่ผ่าน
 * Parse current workspace XML ครั้งเดียว
 * 
 * @param {Object} workspace - Blockly workspace
 * @param {Array} patterns - array of pattern objects (แต่ละตัวมี .hints)
 * @returns {Object} ทุกอย่างที่ UI ต้องการ
 */
export function findBestMatch(workspace, patterns) {
  const empty = {
    bestPattern: null,
    matchedSteps: 0,
    percentage: 0,
    isComplete: false,
    effects: [],
    matchedBlocks: 0,
    totalBlocks: 0
  };

  if (!workspace || !patterns || patterns.length === 0) return empty;

  const currentXml = getWorkspaceXml(workspace);
  if (!currentXml) return empty;

  // Parse current workspace ครั้งเดียว
  const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
  const sortedPatterns = sortByPatternType(patterns);
  const parser = new DOMParser();

  let best = null;
  let bestSteps = -1;

  for (const pattern of sortedPatterns) {
    const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
    if (hints.length === 0) continue;

    // เช็คทีละ step ตามลำดับ
    let stepsMatched = 0;
    for (const hint of hints) {
      const xmlCheck = hint.xmlCheck || hint.xmlcheck;
      if (!xmlCheck) continue;

      try {
        const targetXml = parser.parseFromString(xmlCheck, 'text/xml');
        const targetAnalysis = analyzeXmlStructure(targetXml, workspace);
        const result = matchSubsequence(currentAnalysis, targetAnalysis);

        if (result.isFullMatch) {
          stepsMatched++;
        } else {
          break; // step ไม่ผ่าน → หยุด
        }
      } catch (e) {
        break;
      }
    }

    // เลือก pattern ที่ matchedSteps สูงสุด
    if (stepsMatched > bestSteps) {
      bestSteps = stepsMatched;
      best = pattern;
    }

    // Early exit ถ้า match ครบทุก step
    if (best && bestSteps === (best.hints?.length || 0)) break;
  }

  if (!best) return empty;

  const totalSteps = best.hints?.length || 0;
  const matchedSteps = Math.min(bestSteps, totalSteps);
  const percentage = totalSteps > 0 ? Math.round((matchedSteps / totalSteps) * 100) : 0;

  // Block count info (จาก full pattern XML สำหรับแสดงผล)
  let totalBlocks = 0;
  let matchedBlocks = 0;
  const lastHint = best.hints?.[best.hints.length - 1];
  const lastXml = lastHint?.xmlCheck || lastHint?.xmlcheck;
  if (lastXml) {
    try {
      const lastDoc = parser.parseFromString(lastXml, 'text/xml');
      const lastAnalysis = analyzeXmlStructure(lastDoc, workspace);
      const seqResult = matchSubsequence(currentAnalysis, lastAnalysis);
      totalBlocks = seqResult.total;
      matchedBlocks = seqResult.matched;
    } catch (e) { /* ignore */ }
  }

  // Collect effects (cumulative: ทุก step ที่ผ่านแล้ว)
  const effects = [];
  for (let i = 0; i < matchedSteps; i++) {
    const effect = best.hints?.[i]?.effect;
    if (effect) effects.push(effect);
  }

  return {
    bestPattern: best,
    matchedSteps,
    percentage,
    isComplete: matchedSteps >= totalSteps && totalSteps > 0,
    effects,
    matchedBlocks,
    totalBlocks
  };
}
