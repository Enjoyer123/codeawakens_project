import { useState, useEffect, useCallback } from 'react';
import * as Blockly from 'blockly/core';
import { analyzeWorkspace } from '../../../gameutils/shared/hint/hintMatcher';

/**
 * usePseudocodeSync
 * จับ Blockly SELECTED event → ส่งข้อมูลบล็อกที่เลือกให้ PseudocodePanel highlight บรรทัดที่ตรงกัน
 */
export function usePseudocodeSync({ blocklyLoaded, workspaceRef }) {
  const [selectedBlockType, setSelectedBlockType] = useState(null);

  const clearSelection = useCallback(() => setSelectedBlockType(null), []);

  useEffect(() => {
    if (!blocklyLoaded || !workspaceRef.current) return;

    const workspace = workspaceRef.current;

    const onBlockSelected = (event) => {
      if (event.type !== Blockly.Events.SELECTED) return;

      const newId = event.newElementId ?? event.newValue;
      if (!newId) {
        setSelectedBlockType(null);
        return;
      }

      try {
        const analysis = analyzeWorkspace(workspace);
        const found = analysis.find(b => b.id === newId);

        if (!found) {
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

        setSelectedBlockType({
          blockIndexes,
          blockIndex: found.index,
          type: found.type,
          varName: found.varName,
          typeOcc: found.typeOcc,
          varOcc: found.varOcc,
          ancestorStr: found.ancestorStr,
        });
      } catch (e) {
        // ignore
      }
    };

    workspace.addChangeListener(onBlockSelected);
    return () => workspace?.removeChangeListener?.(onBlockSelected);
  }, [blocklyLoaded, workspaceRef]);

  return { selectedBlockType, clearSelection };
}
