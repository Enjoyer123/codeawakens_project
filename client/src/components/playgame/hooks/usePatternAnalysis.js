import { useEffect, useRef } from 'react';
import * as Blockly from "blockly/core";
import { getWeaponData } from '../../../gameutils/entities/weaponUtils';
import { displayPlayerWeapon } from '../../../gameutils/combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState } from '../../../gameutils/shared/game/gameState';
import { findBestMatch } from '../../../gameutils/shared/hint/hintMatcher';

/**
 * Sync weapon across React state + global state + Phaser visual
 */
function updateWeapon(weaponKey, setCurrentWeaponData, extraState = {}) {
  const weaponData = getWeaponData(weaponKey);
  setCurrentWeaponData(weaponData);
  setCurrentGameState({ weaponKey, weaponData, ...extraState });
  const scene = getCurrentGameState().currentScene;
  if (scene) {
    try { displayPlayerWeapon(weaponKey, scene); } catch (e) { /* ignore */ }
  }
}

/**
 * Hook for pattern analysis — เรียก findBestMatch ครั้งเดียวได้ทุกอย่าง
 */
export function usePatternAnalysis({
  blocklyLoaded,
  workspaceRef,
  goodPatterns,
  setHintData,
  setCurrentWeaponData,
}) {
  const processingRef = useRef(false);

  const valuesRef = useRef({ goodPatterns, setHintData, setCurrentWeaponData });

  useEffect(() => {
    valuesRef.current = { goodPatterns, setHintData, setCurrentWeaponData };
  }, [goodPatterns, setHintData, setCurrentWeaponData]);

  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) {
      return;
    }
    const workspace = workspaceRef.current;
    if (!workspace) return;


    const analyzePattern = () => {
      const { goodPatterns, setHintData, setCurrentWeaponData } = valuesRef.current;

      if (!workspace?.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      const currentBlockCount = allBlocks.length;

      // ─── No blocks → reset ─────────────────────────────────
      if (currentBlockCount === 0) {
        const defaultWeaponKey = getCurrentGameState().levelData?.defaultWeaponKey || "stick";
        updateWeapon(defaultWeaponKey, setCurrentWeaponData, { patternTypeId: 0, activeEffects: [] });
        setHintData({
          patternPercentage: 0, bestPatternBigO: null,
          showPatternProgress: true,
          threePartsMatch: { matchedParts: 0, part1Match: false, part2Match: false, part3Match: false }
        });
        return;
      }

      // ─── No patterns → show default ────────────────────────
      if (!goodPatterns || goodPatterns.length === 0) {
        setHintData({ patternPercentage: 0, bestPatternBigO: null });
        return;
      }


      // ─── เรียกฟังก์ชันเดียว ได้ทุกอย่าง ──────────────────
      const result = findBestMatch(workspace, goodPatterns);

      // ─── อัปเดต hintData ─────
      setHintData({
        matchedBlocks: result.matchedBlocks,
        totalBlocks: result.totalBlocks,
        showPatternProgress: true,
        bestPattern: result.bestPattern,
        bestPatternBigO: result.bestPattern?.bigO || result.bestPattern?.big_o,
        patternPercentage: result.percentage,
        threePartsMatch: { matchedParts: result.matchedSteps },
        currentBlockCount
      });

      // ─── อัปเดต effects สำหรับ Phaser ─────────────────────
      try {
        setCurrentGameState({ activeEffects: result.effects });
      } catch (e) {
        console.error("Error in effect state logic:", e);
      }

      // ─── Weapon: matched pattern → use its weapon, otherwise → default ─────
      if (result.isComplete && result.bestPattern) {
        const weaponKey = result.bestPattern.weapon?.weapon_key || result.bestPattern.weaponKey;
        if (weaponKey) {
          updateWeapon(weaponKey, setCurrentWeaponData, { patternTypeId: result.bestPattern.pattern_type_id });
        }
      } else {
        const defaultWeaponKey = getCurrentGameState().levelData?.defaultWeaponKey || "stick";
        updateWeapon(defaultWeaponKey, setCurrentWeaponData, { patternTypeId: 0 });
      }
    };

    // ─── Debounced workspace change listener ──────────────
    const onWorkspaceChange = (event) => {
      if (
        event.type === Blockly.Events.UI ||
        event.type === Blockly.Events.CLICK ||
        event.type === Blockly.Events.VIEWPORT_CHANGE ||
        event.type === Blockly.Events.SELECTED ||
        event.type === 'drag'
      ) return;

      if (processingRef.current) clearTimeout(processingRef.current);
      processingRef.current = setTimeout(() => { analyzePattern(); }, 500);
    };

    workspace.addChangeListener(onWorkspaceChange);
    analyzePattern();

    return () => {
      if (workspace?.removeChangeListener) workspace.removeChangeListener(onWorkspaceChange);
    };
  }, [blocklyLoaded, workspaceRef, goodPatterns]);
}
