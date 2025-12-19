// Hint Core Functions
import { getWorkspaceXml } from './hintXmlUtils';
import { calculateXmlMatchScore } from './hintXmlComparison';
import { calculatePatternMatchPercentage, findCurrentStep } from './hintPatternMatching';

/**
 * หาคำใบ้ block ถัดไปตาม pattern ที่กำลังสร้าง
 * @param {Object} workspace - Blockly workspace
 * @param {Array} goodPatterns - patterns ที่ดีของด่าน
 * @returns {Object} คำใบ้และข้อมูลที่เกี่ยวข้อง
 */
export function getNextBlockHint(workspace, goodPatterns) {
  console.log("🔍 getNextBlockHint called with:", {
    workspace: !!workspace,
    goodPatterns: goodPatterns?.length || 0,
    goodPatternsData: goodPatterns
  });

  if (!workspace || !goodPatterns || goodPatterns.length === 0) {
    console.log("❌ Early return: missing workspace or goodPatterns");
    return {
      hint: "วาง blocks เพื่อเริ่มต้น",
      showHint: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0
    };
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
  console.log("🔍 Current XML from workspace:", currentXml ? "XML found" : "No XML");

  if (!currentXml) {
    console.log("❌ No XML found, returning loading message");
    return {
      hint: "กำลังโหลด workspace...",
      showHint: false,
      currentStep: 0,
      totalSteps: 0,
      progress: 0
    };
  }

  // หา pattern ที่ตรงกับที่กำลังสร้างมากที่สุด (จาก sorted patterns)
  let bestMatch = null;
  let bestMatchScore = 0;

  console.log("🔍 Starting pattern matching with", sortedPatterns.length, "patterns");

  sortedPatterns.forEach((pattern, index) => {
    const patternName = pattern.name || pattern.pattern_name || `Pattern ${index + 1}`;
    console.log(`🔍 Checking pattern ${index + 1}: ${patternName} (type_id: ${pattern.pattern_type_id})`);
    const patternXml = pattern.xmlPattern || pattern.xmlpattern;
    console.log(`🔍 Pattern XML:`, patternXml?.substring(0, 100) + "...");

    const score = calculateXmlMatchScore(currentXml, patternXml);
    console.log(`🔍 Pattern ${patternName} score:`, score);

    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatch = pattern;
      console.log(`✅ New best match: ${patternName} (type_id: ${pattern.pattern_type_id}) with score ${score}`);
    }
  });

  console.log("🔍 Final best match:", {
    pattern: bestMatch?.name || bestMatch?.pattern_name,
    pattern_type_id: bestMatch?.pattern_type_id,
    score: bestMatchScore
  });

  // คำนวณ pattern percentage (ใช้ sorted patterns)
  const patternPercentage = calculatePatternMatchPercentage(workspace, sortedPatterns);
  console.log("🔍 Pattern percentage result:", patternPercentage);

  if (!bestMatch || bestMatchScore === 0) {
    return {
      hint: "ลองเริ่มต้นด้วย move_forward",
      showHint: true,
      currentStep: 0,
      totalSteps: sortedPatterns[0]?.hints?.length || 0,
      progress: 0,
      patternName: null,
      patternPercentage: patternPercentage.percentage,
      bestPattern: patternPercentage.bestPattern
    };
  }

  // หาขั้นตอนปัจจุบันจาก hints (ใช้ workspace เพื่อช่วย resolve ตัวแปร)
  const currentStep = findCurrentStep(currentXml, bestMatch, workspace);
  const totalSteps = bestMatch.hints?.length || 0;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  console.log(`🔍 Current step calculation:`, {
    currentStep,
    totalSteps,
    progress,
    patternName: bestMatch.name || bestMatch.pattern_name,
    hasHints: !!bestMatch.hints,
    hintsLength: bestMatch.hints?.length,
    bestMatchHints: bestMatch.hints,
    conditionCheck: `${currentStep} > 0 && ${currentStep} <= ${totalSteps} = ${currentStep > 0 && currentStep <= totalSteps}`
  });

  // หาคำใบ้สำหรับขั้นตอนปัจจุบัน (ไม่ใช่ขั้นตอนถัดไป)
  let nextHint = "เสร็จแล้ว!";
  let showHint = true;

  console.log(`🔍 Checking hint condition: currentStep=${currentStep}, totalSteps=${totalSteps}, condition=${currentStep > 0 && currentStep <= totalSteps}`);

  if (currentStep > 0 && currentStep <= totalSteps) {
    // แสดง hint จาก step ปัจจุบัน (currentStep - 1)
    const hintData = bestMatch.hints[currentStep - 1];
    console.log(`🔍 Getting hint for step ${currentStep - 1}:`, hintData);

    if (hintData) {
      // รองรับรูปแบบ hint ใหม่
      if (hintData.content) {
        // รูปแบบใหม่: มี content object
        nextHint = hintData.content.question || hintData.content.suggestion || "ลองทำขั้นตอนถัดไป";
        console.log(`✅ Using new format hint: "${nextHint}"`);
      } else {
        // รูปแบบเก่า: มี hint string ตรงๆ
        nextHint = hintData.hint || "ลองทำขั้นตอนถัดไป";
        console.log(`✅ Using old format hint: "${nextHint}"`);
      }
    } else {
      console.warn(`⚠️ Hint data not found for step ${currentStep - 1}`);
      nextHint = "ลองทำขั้นตอนถัดไป";
    }
  } else if (currentStep === 0) {
    // ยังไม่ได้เริ่มต้น - แสดง hint แรกของ pattern
    if (bestMatch.hints && bestMatch.hints.length > 0) {
      const firstHint = bestMatch.hints[0];
      if (firstHint.content) {
        nextHint = firstHint.content.question || firstHint.content.suggestion || "ลองเริ่มต้นด้วย move_forward";
      } else {
        nextHint = firstHint.hint || "ลองเริ่มต้นด้วย move_forward";
      }
    } else {
      nextHint = "ลองเริ่มต้นด้วย move_forward";
    }
    showHint = true;
  } else if (currentStep > totalSteps) {
    const patternName = bestMatch.name || bestMatch.pattern_name || 'Pattern';
    nextHint = `🎉 Pattern "${patternName}" เสร็จสมบูรณ์!`;
    showHint = true;
  } else {
    nextHint = "Pattern เสร็จแล้ว! ลองกด Run ดู";
    showHint = false;
  }

  // หา hint data สำหรับขั้นตอนปัจจุบัน
  let currentHintData = null;
  if (currentStep > 0 && currentStep <= totalSteps) {
    // ขั้นตอนที่กำลังทำ
    currentHintData = bestMatch.hints[currentStep - 1];
  } else if (currentStep === 0 && bestMatch.hints && bestMatch.hints.length > 0) {
    // ขั้นตอนเริ่มต้น - แสดง hint แรก
    currentHintData = bestMatch.hints[0];
  }


  const result = {
    hint: nextHint,
    showHint,
    currentStep,
    totalSteps,
    progress,
    patternName: bestMatch.name || bestMatch.pattern_name || null,
    isComplete: currentStep >= totalSteps,
    matchScore: bestMatchScore,
    hintData: currentHintData, // เพิ่ม hint data สำหรับ UI ใหม่
    patternPercentage: patternPercentage.percentage,
    bestPattern: patternPercentage.bestPattern
  };

  console.log('🔍 getNextBlockHint RETURN:', {
    hint: result.hint,
    showHint: result.showHint,
    currentStep: result.currentStep,
    totalSteps: result.totalSteps,
    patternName: result.patternName,
    hasHintData: !!result.hintData
  });

  return result;
}

/**
 * แสดงผลรางวัลแบบ real-time
 */
export function showRealTimeReward(scene, weaponData, patternName) {
  if (!scene || !weaponData) return;

  // สร้างข้อความรางวัล
  const rewardText = scene.add.text(600, 200,
    `🎁 ได้รับรางวัล!\n${weaponData.name}\nPattern: ${patternName}`,
    {
      fontSize: '24px',
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }
  ).setOrigin(0.5);

  // เอฟเฟกต์การแสดงผล
  rewardText.setScale(0);
  scene.tweens.add({
    targets: rewardText,
    scaleX: 1,
    scaleY: 1,
    duration: 500,
    ease: 'Back.easeOut'
  });

  // หายไปหลังจาก 3 วินาที
  scene.time.delayedCall(3000, () => {
    scene.tweens.add({
      targets: rewardText,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        rewardText.destroy();
      }
    });
  });
}

