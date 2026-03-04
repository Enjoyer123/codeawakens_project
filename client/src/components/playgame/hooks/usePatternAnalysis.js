import { useEffect, useRef } from 'react';
import * as Blockly from "blockly/core";
import { getWeaponData } from '../../../gameutils/entities/weaponUtils';
import { displayPlayerWeapon } from '../../../gameutils/combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState } from '../../../gameutils/shared/game/gameState';
import { findBestMatch } from '../../../gameutils/shared/hint/hintMatcher';

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
      console.log('🔴 [PatternAnalysis] Effect skipped: blocklyLoaded=', blocklyLoaded, 'workspace=', !!workspaceRef.current);
      return;
    }
    const workspace = workspaceRef.current;
    if (!workspace) return;

    console.log('🟢 [PatternAnalysis] Effect FIRED! blocklyLoaded=', blocklyLoaded, 'workspace ID=', workspace.id);

    const analyzePattern = () => {
      const { goodPatterns, setHintData, setCurrentWeaponData } = valuesRef.current;

      if (!workspace?.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      const currentBlockCount = allBlocks.length;

      // ─── No blocks → reset ─────────────────────────────────
      if (currentBlockCount === 0) {
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);
        setCurrentWeaponData(defaultWeaponData);
        setCurrentGameState({
          weaponKey: defaultWeaponKey,
          weaponData: defaultWeaponData,
          patternTypeId: 0,
          activeEffects: []
        });
        setHintData({
          patternPercentage: 0, bestPatternBigO: null,
          showPatternProgress: true,
          threePartsMatch: { matchedParts: 0, part1Match: false, part2Match: false, part3Match: false }
        });
        return;
      }

      // ─── No patterns → show default ────────────────────────
      if (!goodPatterns || goodPatterns.length === 0) {
        console.log('🔴 [PatternAnalysis] analyzePattern: No goodPatterns available, length=', goodPatterns?.length);
        setHintData({ patternPercentage: 0, bestPatternBigO: null });
        return;
      }

      console.log('🟢 [PatternAnalysis] analyzePattern: goodPatterns=', goodPatterns.length, ', blocks=', currentBlockCount);

      // ─── ✅ เรียกฟังก์ชันเดียว ได้ทุกอย่าง ──────────────────
      const result = findBestMatch(workspace, goodPatterns);

      // ─── อัปเดต hintData (เฉพาะ fields ที่ UI ใช้จริง) ─────
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
        console.log('🎨 [PatternAnalysis] Setting effects:', result.effects, 'percentage:', result.percentage);
        setCurrentGameState({ activeEffects: result.effects });
      } catch (e) {
        console.error("Error in effect state logic:", e);
      }

      // ─── Weapon logic ─────────────────────────────────────
      if (result.isComplete && result.bestPattern) {
        const matchedPattern = result.bestPattern;
        const weaponKey = matchedPattern.weapon?.weapon_key || matchedPattern.weaponKey;

        if (weaponKey) {
          const weaponData = getWeaponData(weaponKey);
          setCurrentWeaponData(weaponData);
          setCurrentGameState({
            weaponKey, weaponData,
            patternTypeId: matchedPattern.pattern_type_id
          });

          const currentState = getCurrentGameState();
          if (currentState.currentScene) {
            try { displayPlayerWeapon(weaponKey, currentState.currentScene); }
            catch (e) { console.warn("Failed to update weapon visual:", e); }
          }
        }
      } else {
        // No match → default weapon
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        const defaultWeaponData = getWeaponData(defaultWeaponKey);

        setCurrentWeaponData(defaultWeaponData);
        setCurrentGameState({
          weaponKey: defaultWeaponKey,
          weaponData: defaultWeaponData,
          patternTypeId: 0
        });

        if (currentState.currentScene) {
          try { displayPlayerWeapon(defaultWeaponKey, currentState.currentScene); }
          catch (e) { console.warn("Failed to default weapon visual:", e); }
        }
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
    console.log('🟢 [PatternAnalysis] Listener registered on workspace', workspace.id, ', goodPatterns=', goodPatterns?.length);
    analyzePattern();

    return () => {
      if (workspace?.removeChangeListener) workspace.removeChangeListener(onWorkspaceChange);
    };
  }, [blocklyLoaded, workspaceRef, goodPatterns]);
}