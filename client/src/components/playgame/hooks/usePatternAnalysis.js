import { useEffect, useRef } from 'react';
import * as Blockly from "blockly/core";
import { getWeaponData } from '../../../gameutils/entities/weaponUtils';
import { displayPlayerWeapon } from '../../../gameutils/combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState } from '../../../gameutils/shared/game/gameState';
import { findBestMatch, preparePatternsCache } from '../../../gameutils/shared/hint/hintMatcher';

import { toast } from 'sonner';

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
  workspaceVersion,
  goodPatterns,
  setPatternData,
  setCurrentWeaponData,
}) {
  const debounceTimerRef = useRef(null);
  const notifiedPatternsRef = useRef(new Set());
  const cachedPatternsRef = useRef([]);
  const lastWeaponKeyRef = useRef(null);

  const valuesRef = useRef({ goodPatterns, setPatternData, setCurrentWeaponData });

  useEffect(() => {
    valuesRef.current = { goodPatterns, setPatternData, setCurrentWeaponData };
  }, [goodPatterns, setPatternData, setCurrentWeaponData]);

  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) {
      return;
    }
    const workspace = workspaceRef.current;
    if (!workspace) return;

    // Pre-parse: Cache ทุก hint XML ครั้งเดียว
    cachedPatternsRef.current = preparePatternsCache(goodPatterns || []);


    const analyzePattern = () => {
      const { goodPatterns, setPatternData, setCurrentWeaponData } = valuesRef.current;

      if (!workspace?.getAllBlocks) return;

      const allBlocks = workspace.getAllBlocks(false);
      const currentBlockCount = allBlocks.length;


      // ─── No blocks → reset ─────────────────────────────────
      if (currentBlockCount === 0) {

        const defaultWeaponKey = getCurrentGameState().levelData?.defaultWeaponKey || "stick";
        updateWeapon(defaultWeaponKey, setCurrentWeaponData, { patternTypeId: 0, activeEffects: [] });
        setPatternData({
          patternPercentage: 0, bestPatternBigO: null,
          showPatternProgress: true,
          threePartsMatch: { matchedParts: 0, part1Match: false, part2Match: false, part3Match: false }
        });
        return;
      }

      // ─── No patterns → show default ────────────────────────
      if (!goodPatterns || goodPatterns.length === 0) {
        setPatternData({ patternPercentage: 0, bestPatternBigO: null });
        return;
      }


      // ─── เรียกฟังก์ชันเดียว ได้ทุกอย่าง (ใช้ cached patterns) ──
      const result = findBestMatch(workspace, cachedPatternsRef.current);

      // ─── Real-time Notification ──────────────────────────
      if (result.isComplete && result.percentage === 100 && result.bestPattern) {
        const patternName = result.bestPattern.pattern_name || result.bestPattern.pattern_type?.type_name || "Pattern";
        if (!notifiedPatternsRef.current.has(result.bestPattern.pattern_id)) {
          toast.success(`ต่อบล็อกถูกต้องตาม ${patternName}! \nได้รับอาวุธ: ${(result.bestPattern.weapon?.name || "อาวุธใหม่")}`, {
            duration: 4000,
            position: 'top-center'
          });
          notifiedPatternsRef.current.add(result.bestPattern.pattern_id);
        }
      }

      // ─── อัปเดต patternData ─────
      setPatternData({
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
        const currentState = getCurrentGameState();
        const defaultWeaponKey = currentState.levelData?.defaultWeaponKey || "stick";
        // ถ้า Pattern ไม่ถูก 100% คืนค่าเป็น Stick (แต่ถ้าเป็น Stick อยู่แล้วไม่ต้อง update ซ้ำ)
        if (currentState.weaponKey !== defaultWeaponKey) {
          updateWeapon(defaultWeaponKey, setCurrentWeaponData, { patternTypeId: 0 });
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

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => { analyzePattern(); }, 500);
    };

    workspace.addChangeListener(onWorkspaceChange);

    analyzePattern();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (workspace?.removeChangeListener) workspace.removeChangeListener(onWorkspaceChange);
    };
  }, [blocklyLoaded, workspaceRef, workspaceVersion, goodPatterns]);
}
