import { useEffect, useRef } from 'react';
import * as Blockly from "blockly/core";
import {

  getWeaponData,
  displayPlayerWeapon,
  displayPlayerEffect
} from '../../../gameutils/shared/items';

import { getCurrentGameState, setCurrentGameState } from '../../../gameutils/shared/game';

import {
  getNextBlockHint,
  checkPatternMatch,
  calculatePatternMatchPercentage
} from '../../../gameutils/shared/hint';
import { findBestThreePartsMatch, checkThreePartsMatch } from '../../../gameutils/shared/hint';

/**
 * Hook for pattern analysis
 */
export function usePatternAnalysis({
  blocklyLoaded,
  workspaceRef,
  goodPatterns,
  setHintData,
  setCurrentHint,
  setCurrentWeaponData,
  setPatternFeedback,
  setPartialWeaponKey,
  highlightBlocks,
  clearHighlights,
  hintOpen,
  hintData
}) {
  /* 
   * Store latest values in refs to avoid useEffect dependency cycles 
   * This is a common pattern to fix "Maximum update depth exceeded" when 
   * dependencies change frequently but we only want to react to specific events (like workspace changes)
   */
  const processingRef = useRef(false); // To prevent recursive calls if needed
  const valuesRef = useRef({
    goodPatterns,
    hintOpen,
    blocklyLoaded,
    highlightBlocks,
    clearHighlights,
    setHintData,
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey,
    hintData
  });

  // Update refs when props change
  useEffect(() => {
    valuesRef.current = {
      goodPatterns,
      hintOpen,
      blocklyLoaded,
      highlightBlocks,
      clearHighlights,
      setHintData,
      setCurrentWeaponData,
      setPatternFeedback,
      setPartialWeaponKey,
      hintData
    };
  }, [
    goodPatterns,
    hintOpen,
    blocklyLoaded,
    highlightBlocks,
    clearHighlights,
    setHintData,
    setCurrentWeaponData,
    setPatternFeedback,
    setPartialWeaponKey,
    hintData
  ]);

  // Update currentHint when hintData.hint changes
  // Use a ref to store setCurrentHint to avoid dependency issues
  const setCurrentHintRef = useRef(setCurrentHint);
  useEffect(() => {
    setCurrentHintRef.current = setCurrentHint;
  }, [setCurrentHint]);

  useEffect(() => {
    const hintValue = hintData?.hint;
    if (hintValue && typeof hintValue === 'string' && hintValue.trim() !== '') {
      // console.log("🔍 [usePatternAnalysis] useEffect: Updating currentHint from hintData.hint:", hintValue);
      if (setCurrentHintRef.current) {
        setCurrentHintRef.current(hintValue);
        // console.log("🔍 [usePatternAnalysis] ✅ setCurrentHint called with:", hintValue);
      }
    }
  }, [hintData?.hint]);

  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) {
      return;
    }

    const workspace = workspaceRef.current;
    if (!workspace) return;

    const analyzePattern = () => {
      // Access latest values from ref
      const {
        goodPatterns,
        hintOpen,
        highlightBlocks,
        clearHighlights,
        setHintData,
        setCurrentWeaponData,
        setPatternFeedback,
        setPartialWeaponKey
      } = valuesRef.current;

      if (!workspace || !workspace.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      const currentBlockCount = allBlocks.length;
      console.log(`🐞 [DEBUG] analyzePattern triggered. Block count: ${currentBlockCount}`);

      if (currentBlockCount === 0) {
        // No blocks → แสดง default weapon
        console.log(`🐞 [DEBUG] No blocks found. Resetting state.`);
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);
        setCurrentWeaponData(defaultWeaponData);
        setCurrentGameState({ weaponKey: defaultWeaponKey, weaponData: defaultWeaponData, patternTypeId: 0 });

        const currentScene = currentState.currentScene;
        if (currentScene && currentScene.add && currentScene.player) {
          try {
            displayPlayerWeapon(defaultWeaponKey, currentScene);
          } catch (error) {
            console.warn("Error displaying default weapon:", error);
          }

          // Debug: Log goodPatterns to check for BigO
          if (goodPatterns && goodPatterns.length > 0) {
            console.log("🔍 [usePatternAnalysis] goodPatterns check:", goodPatterns.map(p => ({
              id: p.pattern_id,
              name: p.name,
              type_id: p.pattern_type_id,
              bigO: p.bigO,
              big_o: p.big_o
            })));
          }
        }

        // Update hintData even when no blocks
        // Force reset hintData to 0 progress so the UI bar clears
        const newHintData = {
          hint: "วาง blocks เพื่อเริ่มต้น",
          showHint: true,
          currentStep: 0,
          totalSteps: 0,
          progress: 0, // Reset progress bar
          patternPercentage: 0,
          showPatternProgress: true,
          threePartsMatch: { matchedParts: 0, part1Match: false, part2Match: false, part3Match: false }
        };
        setHintData(newHintData);
        if (setCurrentHintRef.current) {
          setCurrentHintRef.current(newHintData.hint);
        }

        // Also clear any lingering effects
        if (currentScene) {
          try { displayPlayerEffect(null, currentScene); } catch (e) { }
        }
        return;
      }

      // If no goodPatterns, still update hintData with default message
      if (!goodPatterns || goodPatterns.length === 0) {
        console.log(`🐞 [DEBUG] No goodPatterns found (length: ${goodPatterns?.length}).`);
        const defaultHint = "วาง blocks เพื่อเริ่มต้น";
        setHintData({
          hint: defaultHint,
          showHint: true,
          currentStep: 0,
          totalSteps: 0,
          progress: 0
        });
        if (setCurrentHintRef.current) {
          setCurrentHintRef.current(defaultHint);
        }
        return;
      }

      console.log(`🐞 [DEBUG] Checking against ${goodPatterns.length} patterns.`);

      // คำนวณเปอร์เซ็นต์การตรงกับ pattern
      const patternPercentage = calculatePatternMatchPercentage(workspace, goodPatterns);
      console.log(`🐞 [DEBUG] Match Result: ${patternPercentage.percentage}% with ${patternPercentage.bestPattern?.name || 'None'}`);


      // ตรวจสอบ three parts match
      // CRITICAL: ถ้า percentage = 100% ให้ตรวจสอบ part3 โดยตรง
      let threePartsMatch = findBestThreePartsMatch(workspace, goodPatterns);
      // console.log("🔍 Three parts match (initial):", threePartsMatch);

      // ถ้า percentage = 100% แต่ matchedParts ไม่ใช่ 3 ให้ตรวจสอบ part3 อีกครั้ง
      if (patternPercentage.percentage === 100 && patternPercentage.bestPattern && threePartsMatch.matchedParts !== 3) {
        // console.log("🔍 Percentage is 100% but matchedParts is not 3, rechecking part3...");
        const patternXml = patternPercentage.bestPattern.xmlPattern || patternPercentage.bestPattern.xmlpattern;
        if (patternXml) {
          const recheckResult = checkThreePartsMatch(workspace, patternXml);
          // console.log("🔍 Recheck result:", recheckResult);

          if (recheckResult.matchedParts === 3) {
            threePartsMatch = {
              bestPattern: patternPercentage.bestPattern,
              matchedParts: 3,
              part1Match: true,
              part2Match: true,
              part3Match: true
            };
            // console.log("🔍 Updated threePartsMatch to 3:", threePartsMatch);
          }
        }
      }

      // Get hint info
      const hintInfo = getNextBlockHint(workspace, goodPatterns);
      // console.log("🔍 [usePatternAnalysis] Hint info from getNextBlockHint:", hintInfo);

      // อัปเดต hintData ด้วยข้อมูล pattern percentage และ three parts match
      const updatedHintInfo = {
        ...hintInfo,
        patternPercentage: patternPercentage.percentage,
        patternName: patternPercentage.bestPattern?.name || "ไม่มี pattern ที่ตรง",
        matchedBlocks: patternPercentage.matchedBlocks,
        totalBlocks: patternPercentage.totalBlocks,
        showPatternProgress: true,
        bestPattern: patternPercentage.bestPattern, // เพิ่ม bestPattern เพื่อแสดงรูปอาวุธ
        bestPatternBigO: patternPercentage.bestPattern?.bigO || patternPercentage.bestPattern?.big_o, // Explicitly pass Big O
        // Three parts match data
        threePartsMatch: {
          matchedParts: threePartsMatch.matchedParts,
          part1Match: threePartsMatch.part1Match,
          part2Match: threePartsMatch.part2Match,
          part3Match: threePartsMatch.part3Match,
          bestPattern: threePartsMatch.bestPattern
        },
        currentBlockCount
      };

      // --- New Logic: Display Part-based Effects (Cumulative) ---
      try {
        const currentPart = threePartsMatch.matchedParts; // 0, 1, 2, or 3
        const currentScene = getCurrentGameState().currentScene;

        if (currentPart > 0 && threePartsMatch.bestPattern && currentScene) {
          // เคลียร์เอฟเฟกต์ทั้งหมดก่อนเริ่มลูป (เพื่อความสะอาด)
          displayPlayerEffect(null, currentScene);

          // ลูปแสดงเอฟเฟกต์ของทุกพาร์ทที่ผ่านแล้ว
          for (let i = 0; i < currentPart; i++) {
            const effect = threePartsMatch.bestPattern.hints?.[i]?.effect;
            if (effect) {
              // ใช้ keepExisting = true เพื่อให้แสดงรวมกัน
              displayPlayerEffect(effect, currentScene, true);
            }
          }
        } else if (currentPart === 0 && currentScene) {
          // ถ้าไม่ตรงเลย ให้ล้างเอฟเฟกต์ออก
          displayPlayerEffect(null, currentScene);
        }
      } catch (effectError) {
        console.error("❌ [usePatternAnalysis] Error in effect logic:", effectError);
      }
      // ----------------------------------------------------------

      // console.log("🔍 [usePatternAnalysis] Setting hintData with hint:", updatedHintInfo.hint);
      setHintData(updatedHintInfo);

      // Also update currentHint directly
      if (setCurrentHintRef.current && updatedHintInfo.hint && typeof updatedHintInfo.hint === 'string' && updatedHintInfo.hint.trim() !== '') {
        // console.log("🔍 [usePatternAnalysis] ✅ Also updating currentHint with:", updatedHintInfo.hint);
        setCurrentHintRef.current(updatedHintInfo.hint);
      }

      // Highlight blocks if hint is open and visual guide is available
      if (hintOpen && highlightBlocks && hintInfo?.hintData?.visualGuide?.highlightBlocks) {
        const blocksToHighlight = hintInfo.hintData.visualGuide.highlightBlocks;
        if (Array.isArray(blocksToHighlight) && blocksToHighlight.length > 0) {
          // console.log("🔔 Highlighting blocks from pattern analysis:", blocksToHighlight);
          highlightBlocks(blocksToHighlight);
        }
      } else if (!hintOpen && clearHighlights) {
        clearHighlights();
      }

      // CRITICAL: ใช้ patternPercentage เป็นหลักในการตรวจสอบ exact match
      const isExactMatch = patternPercentage.percentage === 100 && patternPercentage.bestPattern;

      if (isExactMatch && patternPercentage.bestPattern) {
        // Exact match → แสดง weapon ของ pattern
        const matchedPattern = patternPercentage.bestPattern;
        const weaponKey = matchedPattern.weaponKey || matchedPattern.weapon?.weapon_key || null;

        if (weaponKey) {
          const weaponData = getWeaponData(weaponKey);
          setCurrentWeaponData(weaponData);
          setPatternFeedback(`🎉 Perfect Pattern: ${matchedPattern.name}`);
          setCurrentGameState({
            weaponKey: weaponKey,
            weaponData: weaponData,
            patternTypeId: matchedPattern.pattern_type_id
          });
          const currentScene = getCurrentGameState().currentScene;
          if (currentScene && currentScene.add && currentScene.player) {
            try {
              displayPlayerWeapon(weaponKey, currentScene);
            } catch (error) {
              console.error("❌ Error displaying weapon:", error);
            }
          }
        }
        setPartialWeaponKey(null);
      } else {
        // Partial match หรือ No match → แสดง default weapon
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);

        // ถ้ามี partial match ให้เก็บ weaponKey สำหรับแสดงใน UI
        const partialWeaponKey = patternPercentage.percentage > 0 && patternPercentage.bestPattern
          ? (patternPercentage.bestPattern.weaponKey || patternPercentage.bestPattern.weapon?.weapon_key || null)
          : null;

        setPartialWeaponKey(partialWeaponKey);
        setCurrentWeaponData(defaultWeaponData);
        setPatternFeedback(
          patternPercentage.percentage > 0
            ? `⚠️ ไม่ตรง Pattern ใดๆ (${patternPercentage.percentage}%)`
            : "วาง blocks เพื่อดูผลลัพธ์"
        );
        setCurrentGameState({ weaponKey: defaultWeaponKey, weaponData: defaultWeaponData, patternTypeId: 0 });

        const currentScene = currentState.currentScene;
        if (currentScene && currentScene.add && currentScene.player) {
          try {
            displayPlayerWeapon(defaultWeaponKey, currentScene);
          } catch (error) {
            console.warn("Error displaying default weapon:", error);
          }
        }
      }
    };

    workspace.addChangeListener(analyzePattern);

    // We want to run analysis immediately when:
    // 1. Workspace is loaded (mount)
    // 2. hintOpen toggles (to update highlights)
    // 3. But we DON'T want to re-attach the listener constantly for other prop changes
    analyzePattern();

    return () => {
      if (workspace && workspace.removeChangeListener) {
        workspace.removeChangeListener(analyzePattern);
      }
    };
  }, [blocklyLoaded, workspaceRef.current, hintOpen, goodPatterns]); // Added goodPatterns to dependencies
}