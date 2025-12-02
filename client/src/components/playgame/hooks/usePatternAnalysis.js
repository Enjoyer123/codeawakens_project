/**
 * Hook for pattern analysis and weapon display
 */

import { useEffect } from 'react';
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

/**
 * Hook for pattern analysis
 */
export function usePatternAnalysis({
  blocklyLoaded,
  workspaceRef,
  goodPatterns,
  setHintData,
  setCurrentWeaponData,
  setPatternFeedback,
  setPartialWeaponKey,
  highlightBlocks,
  clearHighlights,
  hintOpen,
  hintData
}) {
  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current || !goodPatterns || goodPatterns.length === 0) {
      return;
    }

    const workspace = workspaceRef.current;
    if (!workspace) return;

    const analyzePattern = () => {
      if (!workspace || !workspace.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      if (allBlocks.length === 0) {
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
        return;
      }

      // คำนวณเปอร์เซ็นต์การตรงกับ pattern
      const patternPercentage = calculatePatternMatchPercentage(workspace, goodPatterns);
      console.log("🔍 Pattern percentage:", patternPercentage);

      // Get hint info
      const hintInfo = getNextBlockHint(workspace, goodPatterns);
      console.log("🔍 Hint info from getNextBlockHint:", hintInfo);

      // อัปเดต hintData ด้วยข้อมูล pattern percentage
      const updatedHintInfo = {
        ...hintInfo,
        patternPercentage: patternPercentage.percentage,
        patternName: patternPercentage.bestPattern?.name || "ไม่มี pattern ที่ตรง",
        matchedBlocks: patternPercentage.matchedBlocks,
        totalBlocks: patternPercentage.totalBlocks,
        showPatternProgress: true,
        bestPattern: patternPercentage.bestPattern // เพิ่ม bestPattern เพื่อแสดงรูปอาวุธ
      };

      setHintData(updatedHintInfo);

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

      const patternMatch = checkPatternMatch(workspace, goodPatterns);
      console.log("🔍 Pattern match result:", patternMatch);

      // Get XML text for hint system
      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToText(xml);

      if (patternMatch.matched) {
        // Exact match → แสดง weapon ของ pattern
        console.log("🎉 EXACT MATCH FOUND! Updating weapon to:", patternMatch.weaponKey);
        console.log("🔍 Pattern object:", patternMatch.pattern);
        console.log("🔍 Pattern weapon:", patternMatch.pattern?.weapon);
        
        if (!patternMatch.weaponKey) {
          console.warn("⚠️ Pattern matched but weaponKey is missing!");
          console.warn("⚠️ Pattern weapon_id:", patternMatch.pattern?.weapon_id);
          console.warn("⚠️ Pattern weapon object:", patternMatch.pattern?.weapon);
        }
        
        if (patternMatch.weaponKey) {
          const weaponData = getWeaponData(patternMatch.weaponKey);
          console.log("🔍 Weapon data:", weaponData);
          setCurrentWeaponData(weaponData);
          setPatternFeedback(`🎉 Perfect Pattern: ${patternMatch.pattern.name}`);
          setCurrentGameState({
            weaponKey: patternMatch.weaponKey,
            weaponData: weaponData,
            patternTypeId: patternMatch.pattern.pattern_type_id
          });
          console.log("🔍 Setting weapon in game state:", {
            weaponKey: patternMatch.weaponKey,
            weaponData: weaponData,
            patternTypeId: patternMatch.pattern.pattern_type_id
          });
          const currentScene = getCurrentGameState().currentScene;
          if (currentScene && currentScene.add && currentScene.player) {
            try {
              console.log("🔍 Calling displayPlayerWeapon with:", patternMatch.weaponKey);
              displayPlayerWeapon(patternMatch.weaponKey, currentScene);
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
        console.log("🔍 No exact match, using default weapon");
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);

        setPartialWeaponKey(patternMatch.partial ? patternMatch.weaponKey : null);
        setCurrentWeaponData(defaultWeaponData);
        setPatternFeedback(
          patternMatch.partial ? `⚠️ ไม่ตรง Pattern ใดๆ` : "วาง blocks เพื่อดูผลลัพธ์"
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
  }, [blocklyLoaded, goodPatterns, workspaceRef.current, hintOpen, highlightBlocks, clearHighlights]);
}

