import { useState, useEffect, useCallback, useRef } from 'react';
import * as Blockly from 'blockly/core';
import { analyzeWorkspace } from '../../../gameutils/shared/hint/hintMatcher';

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
        // ═══════════════════════════════════════════════════════════
        // STEP 1: ผู้เล่นคลิก Block → Blockly ยิง Event SELECTED
        // ═══════════════════════════════════════════════════════════




        // ═══════════════════════════════════════════════════════════
        // STEP 2: DFS Traverse — analyzeWorkspace() สร้าง Flat Array
        // (log รายละเอียดอยู่ใน hintMatcher.js:analyzeWorkspace)
        // ═══════════════════════════════════════════════════════════




        const analysis = analyzeWorkspace(workspace);
        const found = analysis.find(b => b.id === newId);

        if (!found) {
          clearHighlight();
          setSelectedBlockType(null);
          return;
        }

        // ═══════════════════════════════════════════════════════════
        // STEP 3: สกัด DNA — หา Block จาก ID → ได้ found object
        // ═══════════════════════════════════════════════════════════


        console.table([{
          'type': found.type,
          'varName': found.varName || '-',
          'depth': found.depth,
          'treeId': found.treeId,
          'parentId': found.parentId || '(none = floating)',
          'typeOcc': found.typeOcc,
        }]);


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

        // ═══════════════════════════════════════════════════════════
        // STEP 4: ตรวจสถานะ Block: Floating หรือ Connected?
        // ═══════════════════════════════════════════════════════════
        // บล็อกจะ "floating" จริงๆ ต่อเมื่อไม่มี parentId (เป็น top-level block)
        // ถ้ามี parentId แสดงว่าถูกต่อกับ block อื่นแล้ว แม้ _floatingBlockIds จะยังจำ ID นั้นอยู่
        const isActuallyTopLevel = found.parentId === undefined;
        const isPanelFloating = isActuallyTopLevel && (workspace._floatingBlockIds?.has(newId) || false);
        const isDetached = isActuallyTopLevel && found.type !== 'procedures_defreturn' && found.type !== 'procedures_defnoreturn';
        const isFloating = isPanelFloating || isDetached;
        let floatingOcc = 0;
        let mainTreeBlocks = undefined;


        console.table([{
          'parentId': found.parentId || '(none)',
          'isActuallyTopLevel': isActuallyTopLevel,
          'isPanelFloating': isPanelFloating,
          'isDetached': isDetached,
          '→ isFloating': isFloating ? '✅ FLOATING (→ Path A: Greedy Diff)' : '❌ CONNECTED (→ Path B: LCS)'
        }]);

        if (isFloating) {
          // นับลำดับของ floating block ที่ type + varName เดียวกัน โดยรวมพวกที่ลอยๆ บนกระดานด้วย
          const floatingBlocks = analysis.filter(b =>
            workspace._floatingBlockIds?.has(b.id) ||
            (b.parentId === undefined && b.type !== 'procedures_defreturn' && b.type !== 'procedures_defnoreturn')
          );
          const sameKind = floatingBlocks.filter(b =>
            b.type === found.type &&
            (found.varName ? b.varName === found.varName : !b.varName)
          ).sort((a, b) => {
            // เรียงตาม Y position บน workspace เพื่อให้ลำดับ stable
            // (บล็อกที่อยู่บน = match กับ missing slot แรก ตามลำดับโค้ดจากบนลงล่าง)
            // ถ้าเพิ่ม/ลบ floating block อื่นๆ ลำดับของบล็อกที่มีอยู่จะไม่เปลี่ยน
            const aY = workspace.getBlockById(a.id)?.getRelativeToSurfaceXY()?.y ?? 0;
            const bY = workspace.getBlockById(b.id)?.getRelativeToSurfaceXY()?.y ?? 0;
            return aY - bY;
          });
          floatingOcc = sameKind.findIndex(b => b.id === found.id);
          if (floatingOcc < 0) floatingOcc = 0;

          // mainTree: ตัดบล็อกลอยฝั่งขวาออก และ "ตัดบล็อกที่ถูกคลิกและลูกๆ" ออกไป เพื่อให้ Diff มองเห็นเป็นช่องว่างจริงๆ!
          mainTreeBlocks = analysis.filter(b => !workspace._floatingBlockIds?.has(b.id) && b.treeId !== found.treeId);


        } else {
          mainTreeBlocks = analysis;
        }

        // ─── Highlight parent block บน workspace (COMMENTS OUT PER USER REQUEST) ─────────
        /*
        const cachedPattern = patternDataRef.current?.bestPattern;
        const targetAnalysis = cachedPattern?.hints?.[cachedPattern.hints.length - 1]?._cachedAnalysis;

        // ─── Highlight parent block บน workspace (COMMENTS OUT PER USER REQUEST) ─────────
        /*
         ...
        */

        // ═══════════════════════════════════════════════════════════
        // STEP 5: ส่ง State → React re-render → PseudocodePanel รับไปคำนวณ
        // ═══════════════════════════════════════════════════════════


        console.table([{
          'type': found.type,
          'varName': found.varName || '-',
          'ancestorStr': found.ancestorStr || '(none)',
          'isFloating': isFloating,
          'floatingOcc': floatingOcc,
          'ancestorOcc': (() => {
            let occ = 0;
            if (!isFloating && found.ancestorStr) {
              for (let i = 0; i < found.index; i++) {
                const b = analysis[i];
                if (b.type === found.type && b.varName === found.varName && b.ancestorStr === found.ancestorStr) occ++;
              }
            }
            return occ;
          })()
        }]);

        let ancestorOcc = 0;
        if (!isFloating && found.ancestorStr) {
          // นับบล็อกที่มี context เดียวกันเป๊ะ ที่เกิดก่อนบล็อกนี้ (เพื่อระบุว่าเป็นตัวซ้ำตัวที่เท่าไหร่)
          for (let i = 0; i < found.index; i++) {
            const b = analysis[i];
            if (b.type === found.type && b.varName === found.varName && b.ancestorStr === found.ancestorStr) {
              ancestorOcc++;
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
          ancestorOcc: ancestorOcc,
          isFloating,
          floatingOcc,
          mainTreeBlocks,
          id: found.id,
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
