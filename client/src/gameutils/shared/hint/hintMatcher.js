// Pattern Matching Functions for Hint System
// รวม logic ทั้งหมดเป็นที่เดียว: XML analysis + subsequence matching + best pattern selection

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

  const variablesSection = xml.getElementsByTagName('variables')[0];
  if (variablesSection) {
    const vars = variablesSection.getElementsByTagName('variable');
    for (let i = 0; i < vars.length; i++) {
      const v = vars[i];
      const id = v.getAttribute('id');
      const name = v.textContent || v.getAttribute('name') || '';
      if (id && name) map.set(id, name);
    }
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
  // getElementsByTagName is namespace-agnostic (querySelectorAll fails with xmlns)
  const blocks = xml.getElementsByTagName('block');
  const analysis = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const type = block.getAttribute('type');
    const info = {
      index: i,
      type,
      hasStatement: block.getElementsByTagName('statement').length > 0,
      hasValue: block.getElementsByTagName('value').length > 0,
      hasNext: false
    };

    // Check direct child <next> element
    for (let c = 0; c < block.children.length; c++) {
      if (block.children[c].tagName === 'next' || block.children[c].localName === 'next') {
        info.hasNext = true;
        break;
      }
    }

    // Variable blocks: resolve VAR field
    if (type === 'variables_set' || type === 'variables_get') {
      const varFields = block.getElementsByTagName('field');
      for (let f = 0; f < varFields.length; f++) {
        if (varFields[f].getAttribute('name') === 'VAR') {
          info.varName = resolveVarName(varFields[f], variableMap, workspace);
          break;
        }
      }
    }

    // Procedure blocks: get NAME field
    if (type?.includes('procedures_')) {
      const nameFields = block.getElementsByTagName('field');
      for (let f = 0; f < nameFields.length; f++) {
        if (nameFields[f].getAttribute('name') === 'NAME') {
          info.procedureName = nameFields[f].textContent || nameFields[f].getAttribute('value') || '';
          break;
        }
      }
    }

    // Field values: เก็บค่า field ทุกตัว (NUM, OP, TEXT, BOOL, etc.)
    // เฉพาะ direct child fields เท่านั้น
    const fieldValues = {};
    for (let c = 0; c < block.children.length; c++) {
      const child = block.children[c];
      if (child.tagName === 'field' || child.localName === 'field') {
        const name = child.getAttribute('name');
        if (name && name !== 'VAR' && name !== 'NAME') {
          fieldValues[name] = child.textContent || '';
        }
      }
    }
    if (Object.keys(fieldValues).length > 0) info.fields = fieldValues;

    analysis.push(info);
  }

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

  // field values (ถ้า target ระบุ field → current ต้องมีค่าตรงกัน)
  if (target.fields) {
    for (const [key, val] of Object.entries(target.fields)) {
      if (!current.fields || current.fields[key] !== val) return false;
    }
  }

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

  return {
    matched,
    total: targetAnalysis.length,
    isFullMatch: matched === targetAnalysis.length
  };
}

// ─── Main: Find Best Pattern Match ───────────────────────────────

/**
 * ฟังก์ชันหลัก: หา pattern ที่ตรงมากสุดจาก workspace
 * เช็คแบบ step-based: แต่ละ hint step มี xmlCheck
 * Parse current workspace XML ครั้งเดียว
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
  // Sort by pattern_type_id (ascending, lower = better)
  const sortedPatterns = [...patterns].sort((a, b) => (a.pattern_type_id || 999) - (b.pattern_type_id || 999));
  const parser = new DOMParser();

  // console.group('🔍 [HintMatcher] findBestMatch');
  //   let s = b.type;
  //   if (b.varName) s += `(${b.varName})`;
  //   if (b.fields) s += ` {${Object.entries(b.fields).map(([k, v]) => `${k}=${v}`).join(',')}}`;
  //   return s;
  // }));

  let best = null;
  let bestSteps = -1;
  let bestMatchedBlocks = -1;
  let bestTotalBlocks = 0;

  for (const pattern of sortedPatterns) {
    const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
    if (hints.length === 0) continue;

    // เช็คทีละ step ตามลำดับ
    let stepsMatched = 0;
    for (let si = 0; si < hints.length; si++) {
      const hint = hints[si];
      let xmlCheck = hint.xmlCheck || hint.xmlcheck;
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

    // --- Block Count Info (เอาจาก Final Step ของ Pattern นี้มาเช็ค) ---
    // เพื่อนำมาเป็น Tie-breaker กรณีที่ stepsMatched เท่ากัน (เช่นเริ่มต้นเกม = 0 เท่ากัน)
    let currentMatchedBlocks = 0;
    let currentTotalBlocks = 0;
    const lastHint = hints[hints.length - 1];
    let lastXml = lastHint?.xmlCheck || lastHint?.xmlcheck;
    if (lastXml) {
      try {
        const lastDoc = parser.parseFromString(lastXml, 'text/xml');
        const lastAnalysis = analyzeXmlStructure(lastDoc, workspace);
        const seqResult = matchSubsequence(currentAnalysis, lastAnalysis);
        currentTotalBlocks = seqResult.total;
        currentMatchedBlocks = seqResult.matched;
      } catch (e) { /* ignore */ }
    }

    // --- การตัดสินหา Best Pattern ---
    // 1. ใครมีจำนวน Block ที่ตรงเยอะกว่า → ชนะ (เลือก Pattern ที่เฉพาะเจาะจงที่สุด)
    // 2. ถ้า Block เท่ากัน → ใครผ่าน Step ได้เยอะกว่า → ชนะ
    if (currentMatchedBlocks > bestMatchedBlocks || (currentMatchedBlocks === bestMatchedBlocks && stepsMatched > bestSteps)) {
      bestSteps = stepsMatched;
      bestMatchedBlocks = currentMatchedBlocks;
      bestTotalBlocks = currentTotalBlocks;
      best = pattern;
    }
    // ไม่ early exit → วนเช็คทุก Pattern เพื่อเลือกตัวที่ตรงมากที่สุด
  }

  if (!best) return empty;

  const totalSteps = best.hints?.length || 0;
  const matchedSteps = Math.min(bestSteps, totalSteps);

  // คำนวณ Percentage จาก "บล็อก" แทน "สเต็ป" จะได้ค่อยๆ ขึ้นเนียนๆ
  let percentage = 0;
  if (bestTotalBlocks > 0) {
    percentage = Math.round((bestMatchedBlocks / bestTotalBlocks) * 100);
  } else if (totalSteps > 0) {
    // Fallback เผื่อหา block ไม่เจอ
    percentage = Math.round((matchedSteps / totalSteps) * 100);
  }

  // แคปไว้เผื่อเกิน
  if (percentage > 100) percentage = 100;

  // Pattern Complete ก็ต่อเมื่อ percentage เต็ม หรือ ผ่านครบทุก step
  const isComplete = percentage === 100 || (matchedSteps >= totalSteps && totalSteps > 0);

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
    isComplete,
    effects,
    matchedBlocks: bestMatchedBlocks,
    totalBlocks: bestTotalBlocks
  };
}
