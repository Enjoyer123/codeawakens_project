import { useState, useEffect, useCallback, useRef } from 'react';
import * as Blockly from 'blockly/core';
import { analyzeWorkspace } from '../../../gameutils/shared/hint/hintMatcher';
import { findFloatingHintBlockId } from '../../../gameutils/shared/hint/pseudoMatcher';

/**
 * usePseudocodeSync
 * จับ Blockly SELECTED event → ส่งข้อมูลบล็อกที่เลือกให้ PseudocodePanel highlight บรรทัดที่ตรงกัน
 * + Highlight parent block บน workspace เมื่อคลิก floating block
 */
export function usePseudocodeSync({ blocklyLoaded, workspaceRef, patternData }) {
  const [selectedBlockType, setSelectedBlockType] = useState(null);

  const clearSelection = useCallback(() => setSelectedBlockType(null), []);

  // Ref เพื่อให้ listener เข้าถึง patternData ล่าสุดได้ (ไม่ต้อง re-register listener)
  const patternDataRef = useRef(null);
  useEffect(() => { patternDataRef.current = patternData; }, [patternData]);

  // Ref สำหรับ cleanup highlight เก่า
  const highlightedSvgRef = useRef(null);

  const clearHighlight = useCallback(() => {
    if (highlightedSvgRef.current) {
      highlightedSvgRef.current.style.filter = '';
      highlightedSvgRef.current.style.transition = '';
      highlightedSvgRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) return;

    const workspace = workspaceRef.current;

    const onBlockSelected = (event) => {
      if (event.type !== Blockly.Events.SELECTED) return;

      const newId = event.newElementId ?? event.newValue;
      if (!newId) {
        clearHighlight();
        setSelectedBlockType(null);
        return;
      }

      try {
        const analysis = analyzeWorkspace(workspace);
        const found = analysis.find(b => b.id === newId);

        if (!found) {
          clearHighlight();
          setSelectedBlockType(null);
          return;
        }

        // สร้าง ancestor chain จาก self → root เพื่อให้คลิกบล็อกลูกแล้ว bubble หา parent ถูกต้อง
        const blockIndexes = [found.index];
        let targetDepth = found.depth - 1;
        for (let i = found.index - 1; i >= 0 && targetDepth >= 0; i--) {
          const b = analysis[i];
          if (b.treeId !== found.treeId) break;
          if (b.depth === targetDepth) {
            blockIndexes.push(b.index);
            targetDepth--;
          }
        }

        // ─── ตรวจว่าเป็น floating block หรือไม่ ────────────────
        // ใช้ marked IDs จาก xmlLoader — 100% แม่นยำ
        const isFloating = workspace._floatingBlockIds?.has(newId) || false;
        let floatingOcc = 0;
        let mainTreeBlocks = undefined;

        // ─── ลบ highlight เก่าก่อน ────────────────────────────
        clearHighlight();

        if (isFloating) {
          // นับลำดับของ floating block ที่ type + varName เดียวกัน
          const floatingIds = workspace._floatingBlockIds;
          const floatingBlocks = analysis.filter(b => floatingIds.has(b.id));
          const sameKind = floatingBlocks.filter(b =>
            b.type === found.type &&
            (found.varName ? b.varName === found.varName : !b.varName)
          );
          floatingOcc = sameKind.findIndex(b => b.id === found.id);
          if (floatingOcc < 0) floatingOcc = 0;
          mainTreeBlocks = analysis.filter(b => !floatingIds.has(b.id));

          // ─── Highlight parent block บน workspace ──────────────
          const cachedPattern = patternDataRef.current?.bestPattern;
          const targetAnalysis = cachedPattern?.hints?.[cachedPattern.hints.length - 1]?._cachedAnalysis;

          if (targetAnalysis) {
            const hintBlockId = findFloatingHintBlockId(
              targetAnalysis, mainTreeBlocks,
              found.type, found.varName, floatingOcc
            );

            if (hintBlockId) {
              const hintBlock = workspace.getBlockById(hintBlockId);
              if (hintBlock) {
                const svg = hintBlock.getSvgRoot();
                const pathEl = svg?.querySelector('.blocklyPath');
                if (pathEl) {
                  pathEl.style.filter = 'drop-shadow(0 0 6px #4ade80) drop-shadow(0 0 14px #22c55e)';
                  pathEl.style.transition = 'filter 0.3s ease';
                  highlightedSvgRef.current = pathEl;
                }
              }
            }
          }
        }

        setSelectedBlockType({
          blockIndexes,
          blockIndex: found.index,
          type: found.type,
          varName: found.varName,
          typeOcc: found.typeOcc,
          varOcc: found.varOcc,
          ancestorStr: found.ancestorStr,
          isFloating,
          floatingOcc,
          mainTreeBlocks,
        });
      } catch (e) {
        // ignore
      }
    };

    workspace.addChangeListener(onBlockSelected);
    return () => {
      workspace?.removeChangeListener?.(onBlockSelected);
      clearHighlight();
    };
  }, [blocklyLoaded, workspaceRef]);

  return { selectedBlockType, clearSelection };
}
