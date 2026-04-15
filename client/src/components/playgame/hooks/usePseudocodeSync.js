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
        // ═══════════════════════════════════════════════════════════
        // STEP 1: ผู้เล่นคลิก Block → Blockly ยิง Event SELECTED
        // ═══════════════════════════════════════════════════════════
        console.log(`\n%c╔══ STEP 1: ผู้เล่นคลิก Block ══╗`, 'color:#a78bfa;font-weight:bold');
        console.log(`%c  Blockly.Events.SELECTED ถูกยิง`, 'color:#c4b5fd');
        console.log(`%c  Block ID ที่คลิก: "${newId}"`, 'color:#e9d5ff');
        console.log(`%c╚═══════════════════════════════════╝`, 'color:#a78bfa;font-weight:bold');

        // ═══════════════════════════════════════════════════════════
        // STEP 2: DFS Traverse — analyzeWorkspace() สร้าง Flat Array
        // (log รายละเอียดอยู่ใน hintMatcher.js:analyzeWorkspace)
        // ═══════════════════════════════════════════════════════════
        console.log(`\n%c╔══ STEP 2: DFS Traverse Workspace ══╗`, 'color:#34d399;font-weight:bold');
        console.log(`%c  เรียก analyzeWorkspace() → แปลง Block Tree เป็น Flat Array 1D`, 'color:#6ee7b7');
        console.log(`%c  (ดู log รายละเอียด DFS Tree ด้านบน)`, 'color:#a7f3d0');
        console.log(`%c╚══════════════════════════════════════╝`, 'color:#34d399;font-weight:bold');

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
        console.log(`\n%c╔══ STEP 3: วิเคราะห์ Block → ได้ DNA (ancestorStr) ══╗`, 'color:#60a5fa;font-weight:bold');
        console.log(`%c  Block ที่คลิก:`, 'color:#93c5fd');
        console.table([{
            'type':        found.type,
            'varName':     found.varName || '-',
            'depth':       found.depth,
            'treeId':      found.treeId,
            'parentId':    found.parentId || '(none = floating)',
            'typeOcc':     found.typeOcc,
        }]);
        console.log(`%c  DNA (ancestorStr): "${found.ancestorStr || '(none)'}"`, 'color:#bfdbfe');
        console.log(`%c╚═══════════════════════════════════════════════╝`, 'color:#60a5fa;font-weight:bold');

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

        console.log(`\n%c╔══ STEP 4: ตรวจสถานะ Block ══╗`, 'color:#fb923c;font-weight:bold');
        console.table([{
            'parentId':         found.parentId || '(none)',
            'isActuallyTopLevel': isActuallyTopLevel,
            'isPanelFloating':   isPanelFloating,
            'isDetached':        isDetached,
            '→ isFloating':     isFloating ? '✅ FLOATING (→ Path A: Greedy Diff)' : '❌ CONNECTED (→ Path B: LCS)'
        }]);
        console.log(`%c╚═══════════════════════╝`, 'color:#fb923c;font-weight:bold');

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
          console.log(`%c  mainTreeBlocks (หลังตัดบล็อกลอยออก):`, 'color:#fcd34d');
          console.table(mainTreeBlocks.map(b => ({ 'idx': b.index, 'type': b.type, 'varName': b.varName || '-', 'treeId': b.treeId, 'isMain': '✅' })));
        } else {
          mainTreeBlocks = analysis;
        }

        // ─── Highlight parent block บน workspace (COMMENTS OUT PER USER REQUEST) ─────────
        /*
        const cachedPattern = patternDataRef.current?.bestPattern;
        const targetAnalysis = cachedPattern?.hints?.[cachedPattern.hints.length - 1]?._cachedAnalysis;

        let hintBlockId = null;

        if (targetAnalysis) {
          // 1. EXACT ID MATCH: ถ้าเป็นบล็อกที่ดึงออกมาจากโครงสร้างเดิม อาศัย parentId จากเฉลยได้ทันที 100% แม่นยำ
          const originalId = found.data || found.id;
          const exactMatch = targetAnalysis.find(t => t.id === originalId);
          if (exactMatch && exactMatch.parentId) {
            hintBlockId = exactMatch.parentId;
          } 
          // 2. FALLBACK: ถ้าตั้งใจหลุด (Floating แท้ๆ) หรือลอยเคว้ง (ไม่มี parent) ให้ใช้ Diff หาช่องว่าง
          else if (isFloating || (found.parentId === undefined && found.type !== 'procedures_defreturn' && found.type !== 'procedures_defnoreturn')) {
             if (!mainTreeBlocks) mainTreeBlocks = analysis.filter(b => !workspace._floatingBlockIds?.has(b.id));
             hintBlockId = findFloatingHintBlockId(
               targetAnalysis, mainTreeBlocks,
               found.type, found.varName, floatingOcc
             );
          }
        }

        if (hintBlockId) {
          const hintParentBlock = workspace.getBlockById(hintBlockId);
          if (hintParentBlock) {
             const svg = hintParentBlock.getSvgRoot();
             const pathEl = svg?.querySelector('.blocklyPath');
             if (pathEl) {
               pathEl.style.filter = 'drop-shadow(0 0 6px #4ade80) drop-shadow(0 0 14px #22c55e)';
               pathEl.style.transition = 'filter 0.3s ease';
               highlightedSvgRef.current = pathEl;
             }
        // ─── Highlight parent block บน workspace (COMMENTS OUT PER USER REQUEST) ─────────
        /*
         ...
        */

        // ═══════════════════════════════════════════════════════════
        // STEP 5: ส่ง State → React re-render → PseudocodePanel รับไปคำนวณ
        // ═══════════════════════════════════════════════════════════
        console.log(`\n%c╔══ STEP 5: Dispatch State → PseudocodePanel ══╗`, 'color:#f472b6;font-weight:bold');
        console.log(`%c  setSelectedBlockType() ถูกเรียก`, 'color:#f9a8d4');
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
        console.log(`%c╚══════════════════════════════════════════════╝`, 'color:#f472b6;font-weight:bold');

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
