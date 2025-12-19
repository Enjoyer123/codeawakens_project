/**
 * Hook for pattern analysis and weapon display
 */

import { useEffect, useRef } from 'react';
import * as Blockly from "blockly/core";
import {
  getCurrentGameState,
  setCurrentGameState,
  getWeaponData,
  displayPlayerWeapon
} from '../../../gameutils/utils/gameUtils';
import {
  getNextBlockHint,
  checkPatternMatch,
  calculatePatternMatchPercentage
} from '../../../gameutils/utils/hintSystem';
import { findBestThreePartsMatch, checkThreePartsMatch } from '../../../gameutils/utils/hint/hintThreeParts';

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
  
  // Update currentHint when hintData.hint changes
  // Use a ref to store setCurrentHint to avoid dependency issues
  const setCurrentHintRef = useRef(setCurrentHint);
  useEffect(() => {
    setCurrentHintRef.current = setCurrentHint;
  }, [setCurrentHint]);
  
  useEffect(() => {
    const hintValue = hintData?.hint;
    if (hintValue && typeof hintValue === 'string' && hintValue.trim() !== '') {
      console.log("🔍 [usePatternAnalysis] useEffect: Updating currentHint from hintData.hint:", hintValue);
      if (setCurrentHintRef.current) {
        setCurrentHintRef.current(hintValue);
        console.log("🔍 [usePatternAnalysis] ✅ setCurrentHint called with:", hintValue);
      } else {
        console.warn("🔍 [usePatternAnalysis] ⚠️ setCurrentHintRef.current is null/undefined");
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
      if (!workspace || !workspace.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      const currentBlockCount = allBlocks.length;
      console.log("🔍 [usePatternAnalysis] currentBlockCount:", currentBlockCount);
      if (currentBlockCount === 0) {
        // No blocks → แสดง default weapon
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);
        setCurrentWeaponData(defaultWeaponData);
        setCurrentGameState({ weaponKey: defaultWeaponKey, weaponData: defaultWeaponData });
        
        const currentScene = currentState.currentScene;
        if (currentScene && currentScene.add && currentScene.player) {
          try {
            displayPlayerWeapon(defaultWeaponKey, currentScene);
          } catch (error) {
            console.warn("Error displaying default weapon:", error);
          }
        }
        
        // Update hintData even when no blocks
        if (!goodPatterns || goodPatterns.length === 0) {
          setHintData({
            hint: "วาง blocks เพื่อเริ่มต้น",
            showHint: true,
            currentStep: 0,
            totalSteps: 0,
            progress: 0
          });
        }
        return;
      }

      // If no goodPatterns, still update hintData with default message
      if (!goodPatterns || goodPatterns.length === 0) {
        const defaultHint = "วาง blocks เพื่อเริ่มต้น";
        setHintData({
          hint: defaultHint,
          showHint: true,
          currentStep: 0,
          totalSteps: 0,
          progress: 0
        });
        if (setCurrentHint) {
          setCurrentHint(defaultHint);
        }
        return;
      }

      // คำนวณเปอร์เซ็นต์การตรงกับ pattern
      const patternPercentage = calculatePatternMatchPercentage(workspace, goodPatterns);
      console.log("🔍 Pattern percentage:", patternPercentage);

      // ตรวจสอบ three parts match
      // CRITICAL: ถ้า percentage = 100% ให้ตรวจสอบ part3 โดยตรง
      let threePartsMatch = findBestThreePartsMatch(workspace, goodPatterns);
      console.log("🔍 Three parts match (initial):", threePartsMatch);
      
      // ถ้า percentage = 100% แต่ matchedParts ไม่ใช่ 3 ให้ตรวจสอบ part3 อีกครั้ง
      if (patternPercentage.percentage === 100 && patternPercentage.bestPattern && threePartsMatch.matchedParts !== 3) {
        console.log("🔍 Percentage is 100% but matchedParts is not 3, rechecking part3...");
        const patternXml = patternPercentage.bestPattern.xmlPattern || patternPercentage.bestPattern.xmlpattern;
        if (patternXml) {
          const recheckResult = checkThreePartsMatch(workspace, patternXml);
          console.log("🔍 Recheck result:", recheckResult);
          
          if (recheckResult.matchedParts === 3) {
            threePartsMatch = {
              bestPattern: patternPercentage.bestPattern,
              matchedParts: 3,
              part1Match: true,
              part2Match: true,
              part3Match: true
            };
            console.log("🔍 Updated threePartsMatch to 3:", threePartsMatch);
          }
        }
      }

      // Get hint info
      const hintInfo = getNextBlockHint(workspace, goodPatterns);
      console.log("🔍 [usePatternAnalysis] Hint info from getNextBlockHint:", hintInfo);
      console.log("🔍 [usePatternAnalysis] Hint info.hint:", hintInfo?.hint);
      console.log("🔍 [usePatternAnalysis] Hint info.currentStep:", hintInfo?.currentStep);
      console.log("🔍 [usePatternAnalysis] Hint info.totalSteps:", hintInfo?.totalSteps);

      // อัปเดต hintData ด้วยข้อมูล pattern percentage และ three parts match
      const updatedHintInfo = {
        ...hintInfo,
        patternPercentage: patternPercentage.percentage,
        patternName: patternPercentage.bestPattern?.name || "ไม่มี pattern ที่ตรง",
        matchedBlocks: patternPercentage.matchedBlocks,
        totalBlocks: patternPercentage.totalBlocks,
        showPatternProgress: true,
        bestPattern: patternPercentage.bestPattern, // เพิ่ม bestPattern เพื่อแสดงรูปอาวุธ
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

      console.log("🔍 [usePatternAnalysis] Setting hintData with hint:", updatedHintInfo.hint);
      setHintData(updatedHintInfo);
      
      // Also update currentHint directly
      console.log("🔍 [usePatternAnalysis] Checking setCurrentHint:", {
        hasSetCurrentHint: !!setCurrentHint,
        hintValue: updatedHintInfo.hint,
        hintType: typeof updatedHintInfo.hint,
        hintTrimmed: updatedHintInfo.hint?.trim(),
        hintIsEmpty: updatedHintInfo.hint?.trim() === ''
      });
      
      if (setCurrentHint && updatedHintInfo.hint && typeof updatedHintInfo.hint === 'string' && updatedHintInfo.hint.trim() !== '') {
        console.log("🔍 [usePatternAnalysis] ✅ Also updating currentHint with:", updatedHintInfo.hint);
        setCurrentHint(updatedHintInfo.hint);
      } else {
        console.log("🔍 [usePatternAnalysis] ❌ NOT updating currentHint:", {
          hasSetCurrentHint: !!setCurrentHint,
          hasHint: !!updatedHintInfo.hint,
          hintType: typeof updatedHintInfo.hint,
          hintIsString: typeof updatedHintInfo.hint === 'string',
          hintTrimmed: updatedHintInfo.hint?.trim(),
          hintIsEmpty: updatedHintInfo.hint?.trim() === ''
        });
      }

      // Highlight blocks if hint is open and visual guide is available
      if (hintOpen && highlightBlocks && hintInfo?.hintData?.visualGuide?.highlightBlocks) {
        const blocksToHighlight = hintInfo.hintData.visualGuide.highlightBlocks;
        if (Array.isArray(blocksToHighlight) && blocksToHighlight.length > 0) {
          console.log("🔔 Highlighting blocks from pattern analysis:", blocksToHighlight);
          highlightBlocks(blocksToHighlight);
        }
      } else if (!hintOpen && clearHighlights) {
        clearHighlights();
      }

      // CRITICAL: ใช้ patternPercentage เป็นหลักในการตรวจสอบ exact match
      // เพราะ patternPercentage ใช้การเปรียบเทียบ variable names ที่ถูกต้อง
      const isExactMatch = patternPercentage.percentage === 100 && patternPercentage.bestPattern;
      console.log("🔍 Pattern match check:", {
        percentage: patternPercentage.percentage,
        isExactMatch: isExactMatch,
        bestPattern: patternPercentage.bestPattern?.name,
        bestPatternWeaponKey: patternPercentage.bestPattern?.weaponKey
      });

      // Get XML text for hint system
      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToText(xml);

      if (isExactMatch && patternPercentage.bestPattern) {
        // Exact match → แสดง weapon ของ pattern
        const matchedPattern = patternPercentage.bestPattern;
        const weaponKey = matchedPattern.weaponKey || matchedPattern.weapon?.weapon_key || null;
        
        console.log("🎉 EXACT MATCH FOUND! Updating weapon to:", weaponKey);
        console.log("🔍 Matched pattern:", matchedPattern.name);
        console.log("🔍 Pattern weaponKey:", weaponKey);
        console.log("🔍 Pattern weapon object:", matchedPattern.weapon);
        
        if (!weaponKey) {
          console.warn("⚠️ Pattern matched but weaponKey is missing!");
          console.warn("⚠️ Pattern weapon_id:", matchedPattern.weapon_id);
          console.warn("⚠️ Pattern weapon object:", matchedPattern.weapon);
        }
        
        if (weaponKey) {
          const weaponData = getWeaponData(weaponKey);
          console.log("🔍 Weapon data:", weaponData);
          setCurrentWeaponData(weaponData);
          setPatternFeedback(`🎉 Perfect Pattern: ${matchedPattern.name}`);
          setCurrentGameState({
            weaponKey: weaponKey,
            weaponData: weaponData,
            patternTypeId: matchedPattern.pattern_type_id
          });
          console.log("🔍 Setting weapon in game state:", {
            weaponKey: weaponKey,
            weaponData: weaponData,
            patternTypeId: matchedPattern.pattern_type_id
          });
          const currentScene = getCurrentGameState().currentScene;
          if (currentScene && currentScene.add && currentScene.player) {
            try {
              console.log("🔍 Calling displayPlayerWeapon with:", weaponKey);
              displayPlayerWeapon(weaponKey, currentScene);
            } catch (error) {
              console.error("❌ Error displaying weapon:", error);
            }
          } else {
            console.warn("⚠️ Scene not ready for weapon display");
          }
        } else {
          console.warn("⚠️ Cannot display weapon - weaponKey is missing");
        }

        setPartialWeaponKey(null);
      } else {
        // Partial match หรือ No match → แสดง default weapon
        console.log("🔍 No exact match (percentage:", patternPercentage.percentage, "), using default weapon");
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
        setCurrentGameState({ weaponKey: defaultWeaponKey, weaponData: defaultWeaponData });

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
    analyzePattern(); // run once on mount

    return () => {
      if (workspace.removeChangeListener) workspace.removeChangeListener(analyzePattern);
    };
  }, [blocklyLoaded, goodPatterns, workspaceRef.current, hintOpen, highlightBlocks, clearHighlights, setHintData, setCurrentWeaponData, setPatternFeedback, setPartialWeaponKey]);
}

