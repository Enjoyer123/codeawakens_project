// Pattern Matching Functions for Hint System
import { getWorkspaceXml, analyzeXmlStructure } from './hintXmlUtils';
import { calculateXmlMatchScore, checkExactXmlMatch, isXmlStructureMatch } from './hintXmlComparison';

/**
 * หาขั้นตอนปัจจุบันจาก hints
 */
export function findCurrentStep(currentXml, pattern) {
  if (!pattern.hints || pattern.hints.length === 0) return 0;

  try {
    const parser = new DOMParser();
    let currentStep = 0;

    console.log(`🔍 Finding current step for pattern: ${pattern.name}`);
    console.log(`📄 Current XML:`, new XMLSerializer().serializeToString(currentXml));

    // วิเคราะห์ structure ปัจจุบัน
    const currentAnalysis = analyzeXmlStructure(currentXml);
    console.log(`🔍 Current structure analysis:`, currentAnalysis);

    for (let i = 0; i < pattern.hints.length; i++) {
      const hintXml = pattern.hints[i].xmlCheck;
      if (!hintXml) continue;

      const targetXml = parser.parseFromString(hintXml, 'text/xml');

      const hintText = pattern.hints[i].content?.question || pattern.hints[i].content?.suggestion || `Step ${i + 1}`;
      console.log(`\n🔍 Checking step ${i}: ${hintText}`);
      console.log(`📄 Target XML:`, hintXml);

      // วิเคราะห์ target structure
      const targetAnalysis = analyzeXmlStructure(targetXml);
      console.log(`🔍 Target structure analysis:`, targetAnalysis);

      // ใช้ flexible matching
      console.log(`🔍 Checking if step ${i} XML matches current workspace...`);
      const matches = isXmlStructureMatch(currentXml, targetXml);
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
    console.log(`🔍 Checking pattern: ${pattern.name} (type_id: ${pattern.pattern_type_id})`);
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
      const currentAnalysis = analyzeXmlStructure(currentXml);
      const targetAnalysis = analyzeXmlStructure(targetXml);

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

      // นับ blocks ที่ตรงกัน
      let matchedBlocks = 0;
      let hasUnmatchedBlock = false; // เพิ่ม flag เพื่อตรวจสอบว่ามี block ที่ไม่ตรงหรือไม่
      const minBlocks = Math.min(currentBlocks, targetBlocks);

      for (let i = 0; i < minBlocks; i++) {
        if (currentAnalysis[i] && targetAnalysis[i] &&
          currentAnalysis[i].type === targetAnalysis[i].type) {
          matchedBlocks++;
        } else {
          hasUnmatchedBlock = true; // พบ block ที่ไม่ตรง
          break; // หยุดเมื่อเจอ block ที่ไม่ตรง
        }
      }

      // ถ้ามี block ที่ไม่ตรง ให้คิด percentage เป็น 0
      // เพื่อไม่ให้ pattern ที่ไม่ตรงแล้วมาแข่งกับ pattern ที่ตรง
      let percentage;
      if (hasUnmatchedBlock) {
        percentage = 0;
        console.log(`  - Pattern mismatch detected, setting percentage to 0%`);
      } else {
        percentage = Math.round((matchedBlocks / targetBlocks) * 100);
      }

      console.log(`  - matchedBlocks: ${matchedBlocks}, hasUnmatchedBlock: ${hasUnmatchedBlock}, percentage: ${percentage}%`);

      // 🎯 เลือก pattern แรกที่มี percentage > 0 (เพราะเรียงตาม type_id แล้ว)
      // หรือเลือก pattern ที่มี percentage สูงกว่าและ type_id ดีกว่า
      if (percentage > 0 && !bestMatch) {
        // เลือก pattern แรกที่ match (เพราะเรียงตาม type_id แล้ว)
        console.log(`  - First match! percentage: ${percentage}%, type_id: ${pattern.pattern_type_id}`);
        bestPercentage = percentage;
        bestMatch = pattern;
        bestMatchedBlocks = matchedBlocks;
        bestTotalBlocks = targetBlocks;
      } else if (percentage > bestPercentage) {
        // อัปเดตถ้า percentage สูงกว่าและ type_id เท่ากันหรือดีกว่า
        const currentTypeId = pattern.pattern_type_id || 999;
        const bestTypeId = bestMatch?.pattern_type_id || 999;

        if (currentTypeId <= bestTypeId) {
          console.log(`  - Better match! percentage: ${percentage}%, type_id: ${pattern.pattern_type_id}`);
          bestPercentage = percentage;
          bestMatch = pattern;
          bestMatchedBlocks = matchedBlocks;
          bestTotalBlocks = targetBlocks;
        }
      }
    } catch (error) {
      console.error("Error calculating pattern match:", error);
    }
  }

  console.log("🔍 Final result:", {
    percentage: bestPercentage,
    bestPattern: bestMatch?.name,
    bestPatternWeaponKey: bestMatch?.weaponKey,
    matchedBlocks: bestMatchedBlocks,
    totalBlocks: bestTotalBlocks
  });

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
    if (patternXml && checkExactXmlMatch(currentXml, patternXml)) {
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
    if (patternXml && checkExactXmlMatch(currentXml, patternXml)) {
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

