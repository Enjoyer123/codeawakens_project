// Pattern Matching — XML analysis + subsequence matching + best pattern selection

// ─── XML Utilities ──────────────────────────────────────────────

function getWorkspaceXml(workspace) {
  if (!workspace || !window.Blockly?.Xml?.workspaceToDom) return null;
  try {
    return window.Blockly.Xml.workspaceToDom(workspace);
  } catch (err) {
    return null;
  }
}

// ─── Variable Resolution ────────────────────────────────────────

/** ลบ suffix _number ออก เช่น "neighbor_1" → "neighbor" */
function normalizeVariableName(varValue) {
  if (!varValue) return '';
  const match = varValue.match(/^(.+?)_(\d+)$/);
  return match ? match[1] : varValue;
}

/** สร้าง variable ID → name mapping จาก XML <variables> section หรือ workspace */
function buildVariableMap(xml, workspace) {
  const map = new Map();
  const variablesSection = xml.getElementsByTagName('variables')[0];

  if (variablesSection) {
    const vars = variablesSection.getElementsByTagName('variable');
    for (let i = 0; i < vars.length; i++) {
      const id = vars[i].getAttribute('id');
      const name = vars[i].textContent || vars[i].getAttribute('name') || '';
      if (id && name) map.set(id, name);
    }
  } else if (workspace?.getVariableMap) {
    try {
      workspace.getVariableMap().getAllVariables().forEach(v => {
        if (v.getId() && v.name) map.set(v.getId(), v.name);
      });
    } catch (e) { /* ignore */ }
  }

  return map;
}

/** Resolve variable field → actual name (XML map → workspace API → raw value) */
function resolveVarName(varField, variableMap, workspace) {
  const raw = varField.getAttribute('id') || varField.textContent || varField.getAttribute('value') || '';

  if (variableMap.has(raw)) return normalizeVariableName(variableMap.get(raw));

  if (workspace?.getVariableMap) {
    try {
      const v = workspace.getVariableMap().getVariableById(raw);
      if (v) return normalizeVariableName(v.name);
    } catch (e) { /* ignore */ }
  }

  return normalizeVariableName(raw);
}

// ─── XML Structure Analysis ─────────────────────────────────────

/**
 * วิเคราะห์ XML → block array ที่เรียงตาม tree structure
 * แต่ละ block มี treeId เพื่อระบุว่าอยู่กลุ่มไหนที่ต่อกัน
 */
function analyzeXmlStructure(xml, workspace = null) {
  if (!xml) return [];

  const variableMap = buildVariableMap(xml, workspace);
  const analysis = [];
  let blockIndex = 0;
  let currentTreeId = 0;

  function traverseBlock(block, treeId) {
    if (!block || (block.tagName !== 'block' && block.localName !== 'block')) return;
    const type = block.getAttribute('type');
    if (!type) return;

    const info = { index: blockIndex++, type, treeId, hasStatement: false, hasValue: false, hasNext: false };

    // Resolve variable name
    if (type === 'variables_set' || type === 'variables_get') {
      for (const f of block.getElementsByTagName('field')) {
        if (f.getAttribute('name') === 'VAR' && f.parentNode === block) {
          info.varName = resolveVarName(f, variableMap, workspace);
          break;
        }
      }
    }

    // Resolve procedure name
    if (type?.includes('procedures_')) {
      for (const f of block.getElementsByTagName('field')) {
        if (f.getAttribute('name') === 'NAME' && f.parentNode === block) {
          info.procedureName = f.textContent || f.getAttribute('value') || '';
          break;
        }
      }
    }

    // Collect field values (direct children only)
    const fields = {};
    for (const child of block.children) {
      const tag = child.tagName || child.localName;
      if (tag === 'field') {
        const name = child.getAttribute('name');
        if (name && name !== 'VAR' && name !== 'NAME') {
          fields[name] = child.textContent || '';
        }
      }
    }
    if (Object.keys(fields).length > 0) info.fields = fields;

    analysis.push(info);

    // Traverse children (value, statement, next) — same treeId
    for (const child of block.children) {
      const tag = child.tagName || child.localName;
      if (tag === 'value' || tag === 'statement' || tag === 'next') {
        if (tag === 'value') info.hasValue = true;
        else if (tag === 'statement') info.hasStatement = true;
        else info.hasNext = true;

        for (const inner of child.children) {
          if (inner.tagName === 'block' || inner.localName === 'block') {
            traverseBlock(inner, treeId);
          }
        }
      }
    }
  }

  // Root blocks — แต่ละ root ได้ treeId ใหม่
  const root = xml;
  for (const child of root.children) {
    if (child.tagName === 'block' || child.localName === 'block') {
      traverseBlock(child, currentTreeId++);
    }
  }

  return analysis;
}

// ─── Block Matching ─────────────────────────────────────────────

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

/** นับจำนวน step ที่ผ่าน (full match ตามลำดับ) */
function countMatchedSteps(currentAnalysis, hints, parser, workspace) {
  let stepsMatched = 0;
  for (const hint of hints) {
    const xmlCheck = hint.xmlCheck || hint.xmlcheck;
    if (!xmlCheck) continue;
    try {
      const targetAnalysis = analyzeXmlStructure(parser.parseFromString(xmlCheck, 'text/xml').documentElement, workspace);
      if (matchSubsequenceByTree(currentAnalysis, targetAnalysis).isFullMatch) {
        stepsMatched++;
      } else {
        break;
      }
    } catch (e) { break; }
  }
  return stepsMatched;
}

/** นับ block ที่ตรงกับ final hint ของ pattern (สำหรับ % และ tie-breaking) */
function countBlockMatch(currentAnalysis, hints, parser, workspace) {
  const lastHint = hints[hints.length - 1];
  const xml = lastHint?.xmlCheck || lastHint?.xmlcheck;
  if (!xml) return { matched: 0, total: 0 };
  try {
    const targetAnalysis = analyzeXmlStructure(parser.parseFromString(xml, 'text/xml').documentElement, workspace);
    const result = matchSubsequenceByTree(currentAnalysis, targetAnalysis);
    return { matched: result.matched, total: result.total };
  } catch (e) {
    return { matched: 0, total: 0 };
  }
}

/** ฟังก์ชันหลัก: หา pattern ที่ตรงมากสุดจาก workspace */
export function findBestMatch(workspace, patterns) {
  if (!workspace || !patterns || patterns.length === 0) return EMPTY_RESULT;

  const currentXml = getWorkspaceXml(workspace);
  if (!currentXml) return EMPTY_RESULT;

  const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
  const sortedPatterns = [...patterns].sort((a, b) => (a.pattern_type_id || 999) - (b.pattern_type_id || 999));
  const parser = new DOMParser();

  // หา pattern ที่ match ดีที่สุด (block count > step count)
  let best = null, bestSteps = -1, bestMatchedBlocks = -1, bestTotalBlocks = 0;

  for (const pattern of sortedPatterns) {
    const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
    if (hints.length === 0) continue;

    const stepsMatched = countMatchedSteps(currentAnalysis, hints, parser, workspace);
    const { matched, total } = countBlockMatch(currentAnalysis, hints, parser, workspace);

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
