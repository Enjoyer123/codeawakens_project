// Three-Part Pattern Matching System - Fixed Version
// แบ่ง pattern เป็น 3 ชุด แต่ใช้ subsequence matching แทน window matching
// เพื่อให้รองรับการแทรกบล็อกระหว่างทาง

import { getWorkspaceXml, analyzeXmlStructure, checkBlocksSubsequenceMatch } from './hintMatcher';


/**
 * ดึง XML สำหรับ 3 ส่วนจาก pattern.hints ถ้ามี
 * ถ้าไม่ครบจะ fallback ไปใช้ pattern.xmlPattern เดิม
 */
function getThreePartXmlFromPattern(pattern) {
  if (!pattern) {
    return {
      part1Xml: null,
      part1And2Xml: null,
      fullPatternXml: null
    };
  }

  const hints = Array.isArray(pattern.hints) ? pattern.hints : [];
  const step0 = hints[0];
  const step1 = hints[1];
  const step2 = hints[2];

  const part1XmlFromHints = step0?.xmlCheck || step0?.xmlcheck || null;
  const part1And2XmlFromHints = step1?.xmlCheck || step1?.xmlcheck || null;
  const fullPatternXmlFromHints = step2?.xmlCheck || step2?.xmlcheck || null;

  // ถ้ามีครบทั้ง 3 ส่วนจาก hints ใช้อันนี้เลย
  if (part1XmlFromHints && part1And2XmlFromHints && fullPatternXmlFromHints) {
    return {
      part1Xml: part1XmlFromHints,
      part1And2Xml: part1And2XmlFromHints,
      fullPatternXml: fullPatternXmlFromHints
    };
  }

  // ไม่ครบ → fallback ไปใช้ xmlPattern เดิม
  const patternXml = pattern.xmlPattern || pattern.xmlpattern || null;
  if (!patternXml) {
    return {
      part1Xml: part1XmlFromHints || null,
      part1And2Xml: part1And2XmlFromHints || null,
      fullPatternXml: fullPatternXmlFromHints || null
    };
  }

  // fallback: ใช้ xmlPattern เป็น full, และเติมให้ part1/part1+2 ถ้ายังไม่มี
  return {
    part1Xml: part1XmlFromHints || patternXml,
    part1And2Xml: part1And2XmlFromHints || patternXml,
    fullPatternXml: fullPatternXmlFromHints || patternXml
  };
}

/**
 * ตรวจสอบว่า workspace ตรงกับชุดไหนบ้าง
 * @param {Object} workspace - Blockly workspace
 * @param {Object} pattern - pattern object (ต้องมี hints และ/หรือ xmlPattern)
 * @returns {Object} { part1Match, part2Match, part3Match, matchedParts }
 */
export function checkThreePartsMatch(workspace, pattern) {
  if (!workspace || !pattern) {
    return {
      part1Match: false,
      part2Match: false,
      part3Match: false,
      matchedParts: 0
    };
  }

  const currentXml = getWorkspaceXml(workspace);
  if (!currentXml) {
    return {
      part1Match: false,
      part2Match: false,
      part3Match: false,
      matchedParts: 0
    };
  }

  // ดึง XML ของทั้ง 3 ส่วนจาก pattern.hints หรือ xmlPattern
  const parts = getThreePartXmlFromPattern(pattern);
  console.log('🔍 Three-part XML from pattern:', {
    hasPart1: !!parts.part1Xml,
    hasPart1And2: !!parts.part1And2Xml,
    hasFullPattern: !!parts.fullPatternXml,
    part1Length: parts.part1Xml?.length || 0,
    part1And2Length: parts.part1And2Xml?.length || 0,
    fullPatternLength: parts.fullPatternXml?.length || 0
  });

  let part1Match = false;
  let part2Match = false;
  let part3Match = false;

  // วิเคราะห์ current XML structure (full)
  const currentAnalysis = analyzeXmlStructure(currentXml, workspace);
  console.log('🔍 Current XML analysis:', {
    blockCount: currentAnalysis.length,
    blockTypes: currentAnalysis.map(b => b.type)
  });

  // วิเคราะห์ pattern parts
  let part1Analysis = null;
  let part1And2Analysis = null;
  let fullPatternAnalysis = null;

  if (parts.part1Xml) {
    try {
      const parser = new DOMParser();
      const part1Doc = parser.parseFromString(parts.part1Xml, 'text/xml');
      part1Analysis = analyzeXmlStructure(part1Doc, workspace);
      console.log('🔍 Pattern Part 1 XML analysis:', {
        blockCount: part1Analysis.length,
        blockTypes: part1Analysis.map(b => b.type)
      });
    } catch (error) {
      console.error('Error analyzing part 1:', error);
    }
  }

  if (parts.part1And2Xml) {
    try {
      const parser = new DOMParser();
      const part1And2Doc = parser.parseFromString(parts.part1And2Xml, 'text/xml');
      part1And2Analysis = analyzeXmlStructure(part1And2Doc, workspace);
      console.log('🔍 Pattern Part 1+2 XML analysis:', {
        blockCount: part1And2Analysis.length,
        blockTypes: part1And2Analysis.map(b => b.type)
      });
    } catch (error) {
      console.error('Error analyzing part 1+2:', error);
    }
  }

  // เช็ค Part 1: ใช้ subsequence matching (บล็อกไม่จำเป็นต้องติดกัน)
  if (part1Analysis) {
    console.log('🎯 Part 1 Expected blocks:', part1Analysis.map(b => `${b.type}${b.varName ? ` (var: ${b.varName})` : ''}`));
    part1Match = checkBlocksSubsequenceMatch(currentAnalysis, part1Analysis);
    console.log('🔍 Part 1 (initialization) subsequence match:', part1Match);
  }

  // เช็ค Part 2: ใช้ subsequence matching
  if (part1And2Analysis) {
    console.log('🎯 Part 1+2 Expected blocks:', part1And2Analysis.map(b => `${b.type}${b.varName ? ` (var: ${b.varName})` : ''}`));
    part2Match = checkBlocksSubsequenceMatch(currentAnalysis, part1And2Analysis);
    console.log('🔍 Part 1+2 (initialization + while loop) subsequence match:', part2Match);

    // ถ้า Part 2 ผ่าน → Part 1 ต้องผ่านด้วย (เพราะ Part 2 รวม Part 1)
    if (part2Match) {
      part1Match = true;
      console.log('🔍 Part 2 matches, setting part1 to true (Part 2 includes Part 1)');
    }
  }

  // เช็ค Part 3: ใช้ subsequence matching
  if (parts.fullPatternXml) {
    try {
      const parser = new DOMParser();
      const fullPatternDoc = parser.parseFromString(parts.fullPatternXml, 'text/xml');
      fullPatternAnalysis = analyzeXmlStructure(fullPatternDoc, workspace);
      console.log('🔍 Pattern Full (Part1+2+3) XML analysis:', {
        blockCount: Array.isArray(fullPatternAnalysis) ? fullPatternAnalysis.length : 0,
        blockTypes: Array.isArray(fullPatternAnalysis) ? fullPatternAnalysis.map(b => b.type) : []
      });

      if (Array.isArray(fullPatternAnalysis)) {
        console.log('🎯 Full Pattern Expected blocks:', fullPatternAnalysis.map(b => `${b.type}${b.varName ? ` (var: ${b.varName})` : ''}`));
        part3Match = checkBlocksSubsequenceMatch(currentAnalysis, fullPatternAnalysis);
      } else {
        part3Match = false;
      }
      console.log('🔍 Part 1+2+3 (full pattern) subsequence match:', part3Match);
    } catch (error) {
      console.error('Error checking part 1+2+3:', error);
    }
  }

  // ทำให้สถานะ monotonic: ถ้า Part 3 ผ่าน → Part 2/Part 1 ต้องผ่าน, ถ้า Part 2 ผ่าน → Part 1 ต้องผ่าน
  if (part3Match) {
    part2Match = true;
    part1Match = true;
    console.log('🔍 Part 3 matches, setting part1 and part2 to true');
  } else if (part2Match) {
    part1Match = true;
    console.log('🔍 Part 2 matches, setting part1 to true');
  }

  // ระบุ current step
  const currentStep = part3Match ? 3 : (part2Match ? 2 : (part1Match ? 1 : 0));
  console.log('🔍 Current step determination:', {
    part1Match,
    part2Match,
    part3Match,
    currentStep: currentStep,
    stepDescription: currentStep === 3 ? 'Step 3 (All parts passed)' :
      (currentStep === 2 ? 'Step 2 (Part 1+2 passed, working on Part 3)' :
        (currentStep === 1 ? 'Step 1 (Part 1 passed, working on Part 2)' : 'Step 0 (Not started)'))
  });

  // นับจำนวนชุดที่ตรง
  let matchedParts = 0;
  if (part1Match) matchedParts = 1;
  if (part2Match) matchedParts = 2;
  if (part3Match) matchedParts = 3;

  console.log('🔍 Three parts match result:', {
    part1Match,
    part2Match,
    part3Match,
    matchedParts
  });

  return {
    part1Match,
    part2Match,
    part3Match,
    matchedParts
  };
}

/**
 * ตรวจสอบ pattern ทั้งหมดและคืนค่าชุดที่ตรงมากที่สุด
 * @param {Object} workspace - Blockly workspace
 * @param {Array} goodPatterns - Array of patterns
 * @returns {Object} { bestPattern, matchedParts, part1Match, part2Match, part3Match }
 */
export function findBestThreePartsMatch(workspace, goodPatterns) {
  if (!workspace || !goodPatterns || goodPatterns.length === 0) {
    return {
      bestPattern: null,
      matchedParts: 0,
      part1Match: false,
      part2Match: false,
      part3Match: false
    };
  }

  // เรียงลำดับ patterns ตาม pattern_type_id
  const sortedPatterns = [...goodPatterns].sort((a, b) => {
    const typeA = a.pattern_type_id || 999;
    const typeB = b.pattern_type_id || 999;
    return typeA - typeB;
  });

  let bestPattern = null;
  let bestMatchedParts = 0;

  for (const pattern of sortedPatterns) {
    const matchResult = checkThreePartsMatch(workspace, pattern);

    // เลือก pattern ที่มี matchedParts สูงสุดและ type_id ต่ำสุด
    if (matchResult.matchedParts > bestMatchedParts) {
      bestMatchedParts = matchResult.matchedParts;
      bestPattern = pattern;

      // ถ้า matchedParts = 3 แสดงว่า match ทั้งหมดแล้ว หยุดค้นหา
      if (bestMatchedParts === 3) {
        break;
      }
    }
  }

  // ถ้ามี bestPattern ให้ตรวจสอบอีกครั้งเพื่อคืนค่า match results
  if (bestPattern) {
    const matchResult = checkThreePartsMatch(workspace, bestPattern);
    return {
      bestPattern: bestPattern,
      matchedParts: matchResult.matchedParts,
      part1Match: matchResult.part1Match,
      part2Match: matchResult.part2Match,
      part3Match: matchResult.part3Match
    };
  }

  return {
    bestPattern: null,
    matchedParts: 0,
    part1Match: false,
    part2Match: false,
    part3Match: false
  };
}