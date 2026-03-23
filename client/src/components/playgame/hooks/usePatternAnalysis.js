import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Blockly from "blockly/core";
import { getWeaponData } from '../../../gameutils/entities/weaponUtils';
import { displayPlayerWeapon } from '../../../gameutils/combat/weaponEffects';
import { getCurrentGameState, setCurrentGameState } from '../../../gameutils/shared/game/gameState';
import { findBestMatch, preparePatternsCache } from '../../../gameutils/shared/hint/hintMatcher';
import { playSound } from '../../../gameutils/sound/soundManager';
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
 * Handle UI Notifications and Sound Effects when a pattern is completed
 */
function handlePatternNotifications(result, notifiedPatternsRef, lastCompletedPatternRef) {
  if (result.isComplete && result.bestPattern) {
    const patternName = result.bestPattern.pattern_name || result.bestPattern.pattern_type?.type_name || "Pattern";
    const patternId = result.bestPattern.pattern_id;

    if (!notifiedPatternsRef.current.has(patternId)) {
      // ครั้งแรกสุด — เสียงปลดล็อกอลังการ + Toast ยาว 4 วิ
      playSound('unlock_pattern');
      toast.success(`ต่อบล็อกถูกต้องตาม ${patternName}! \nได้รับอาวุธ: ${(result.bestPattern.weapon?.name || "อาวุธใหม่")}`, {
        duration: 4000,
        position: 'top-center'
      });
      notifiedPatternsRef.current.add(patternId);
      lastCompletedPatternRef.current = patternId;
    } else if (lastCompletedPatternRef.current !== patternId) {
      // ครั้งต่อๆ ไป (ดึงบล็อกออกแล้วใส่กลับเข้าไปใหม่) — เสียงสั้นๆ ติ๊งเดียว ให้รู้ว่ากลับมาครบแล้ว
      playSound('level_up');
      lastCompletedPatternRef.current = patternId;
    }
  } else {
    // เมื่อหลุดจากความสมบูรณ์ (ดึงบล็อกออก)
    lastCompletedPatternRef.current = null;
  }
}

/**
 * Assign weapon to the player based on matched pattern or revert to default
 */
function syncPatternWeapon(result, setCurrentWeaponData) {
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
  const lastCompletedPatternRef = useRef(null);

  // Cache patterns cleanly with useMemo, but ONLY when Blockly is fully loaded
  const cachedPatterns = useMemo(() => {
    if (!blocklyLoaded) return [];
    return preparePatternsCache(goodPatterns || []);
  }, [goodPatterns, blocklyLoaded]);

  // Main Pattern Analysis Logic (Extracted cleanly out of useEffect mount execution)
  const analyzePattern = useCallback(() => {
    const workspace = workspaceRef.current;
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
    if (!cachedPatterns || cachedPatterns.length === 0) {
      setPatternData({ patternPercentage: 0, bestPatternBigO: null });
      return;
    }

    // ─── เรียกฟังก์ชันเดียว ได้ทุกอย่าง (ใช้ cached patterns) ──
    const result = findBestMatch(workspace, cachedPatterns);

    // ─── Side Effects ───
    handlePatternNotifications(result, notifiedPatternsRef, lastCompletedPatternRef);
    
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

    try {
      setCurrentGameState({ activeEffects: result.effects });
    } catch (e) {
      console.error("Error in effect state logic:", e);
    }

    syncPatternWeapon(result, setCurrentWeaponData);
  }, [workspaceRef, cachedPatterns, setPatternData, setCurrentWeaponData]);

  // Single cleanly bound Event Listener 
  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) return;
    const workspace = workspaceRef.current;

    const onWorkspaceChange = (event) => {
      // ถ้าผู้เล่นกำลัง "กำบล็อกลอยอยู่ในอากาศ" (Drag) จะไม่สนใจ จนกว่าจะปล่อยเมาส์ (Drop)
      if (workspace.isDragging && workspace.isDragging()) return;
      if (event.isTransient) return;

      // จับเฉพาะตอนมีผลกับ Block เท่านั้น (สร้างใหม่, ลบทิ้ง, ต่อ/ดึงออก, เปลี่ยน Dropdown)
      if (
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_CHANGE
      ) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => { analyzePattern(); }, 50);
      }
    };

    workspace.addChangeListener(onWorkspaceChange);
    
    // Initial parse to sync UI when patterns load
    analyzePattern();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (workspace?.removeChangeListener) workspace.removeChangeListener(onWorkspaceChange);
    };
  }, [blocklyLoaded, workspaceRef, workspaceVersion, analyzePattern]);
}
