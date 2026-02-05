// Blockly Algorithm-Specific Generators (Knapsack, Subset Sum, Coin Change, Ant DP)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineAlgorithmGenerators() {
    // Knapsack visual feedback generators
    javascriptGenerator.forBlock["knapsack_select_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await selectKnapsackItemVisual(${itemIndex});\n`;
    };

    javascriptGenerator.forBlock["knapsack_unselect_item"] = function (block) {
        const itemIndex = javascriptGenerator.valueToCode(block, 'ITEM_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await unselectKnapsackItemVisual(${itemIndex});\n`;
    };

    // Subset Sum visual feedback generators
    javascriptGenerator.forBlock["subset_sum_add_warrior_to_side1"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `subset_sum_add_warrior_to_side1(${warriorIndex});\n`;
        }
        return `await addWarriorToSide1Visual(${warriorIndex});\n`;
    };

    javascriptGenerator.forBlock["subset_sum_add_warrior_to_side2"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        if (javascriptGenerator.isCleanMode) {
            return `subset_sum_add_warrior_to_side2(${warriorIndex});\n`;
        }
        return `await addWarriorToSide2Visual(${warriorIndex});\n`;
    };

    // Coin Change visual feedback generators
    javascriptGenerator.forBlock["coin_change_add_warrior_to_selection"] = function (block) {
        const warriorIndex = javascriptGenerator.valueToCode(block, 'WARRIOR_INDEX', javascriptGenerator.ORDER_NONE) || '0';
        return `await addWarriorToSelectionVisual(${warriorIndex});\n`;
    };

    javascriptGenerator.forBlock["coin_change_track_decision"] = function (block) {
        const amount = javascriptGenerator.valueToCode(block, 'AMOUNT', javascriptGenerator.ORDER_NONE) || '0';
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_NONE) || '0';
        const include = javascriptGenerator.valueToCode(block, 'INCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        const exclude = javascriptGenerator.valueToCode(block, 'EXCLUDE', javascriptGenerator.ORDER_NONE) || '-1';
        return `trackCoinChangeDecision(${amount}, ${index}, ${include}, ${exclude});\n`;
    };

    // Emei Mountain Visuals
    javascriptGenerator.forBlock["emei_highlight_peak"] = function (block) {
        const node = javascriptGenerator.valueToCode(block, "NODE", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            return `highlightPeak(${node});\n`;
        }
        return `await highlightPeak(${node});\n`;
    };

    javascriptGenerator.forBlock["emei_highlight_cable_car"] = function (block) {
        const u = javascriptGenerator.valueToCode(block, "U", javascriptGenerator.ORDER_NONE) || "0";
        const v = javascriptGenerator.valueToCode(block, "V", javascriptGenerator.ORDER_NONE) || "0";
        const capacity = javascriptGenerator.valueToCode(block, "CAPACITY", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            return `highlightCableCar(${u}, ${v}, ${capacity});\n`;
        }
        return `await highlightCableCar(${u}, ${v}, ${capacity});\n`;
    };

    javascriptGenerator.forBlock["emei_show_final_result"] = function (block) {
        const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";
        const rounds = javascriptGenerator.valueToCode(block, "ROUNDS", javascriptGenerator.ORDER_NONE) || "0";
        if (javascriptGenerator.isCleanMode) {
            return `showFinalResult(${bottleneck}, ${rounds});\n`;
        }
        return `await showEmeiFinalResult(${bottleneck}, ${rounds});\n`;
    };

    javascriptGenerator.forBlock["emei_highlight_path"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, "PARENT", javascriptGenerator.ORDER_NONE) || "[]";
        const end = javascriptGenerator.valueToCode(block, "END", javascriptGenerator.ORDER_NONE) || "0";
        const bottleneck = javascriptGenerator.valueToCode(block, "BOTTLENECK", javascriptGenerator.ORDER_NONE) || "0";

        if (javascriptGenerator.isCleanMode) {
            return `highlightPath(${parent}, ${end}, ${bottleneck});\n`;
        }

        return `await (async function() {
      console.log('🚩 [emei_highlight_path] START');
      try { 
        if (typeof clearDfsVisuals === 'function') {
           console.log('🚩 [emei_highlight_path] Calling clearDfsVisuals...');
           clearDfsVisuals(getCurrentGameState().currentScene); 
        } else {
           console.warn('🚩 [emei_highlight_path] clearDfsVisuals NOT FOUND');
        }
      } catch (e) {
        console.warn('🚩 [emei_highlight_path] Error clearing visuals:', e);
      }
      
      let _curr = ${end};
      let _p = ${parent};
      console.log('🚩 [emei_highlight_path] End Node:', _curr);
      console.log('🚩 [emei_highlight_path] Parent Array:', JSON.stringify(_p));

      let _path_edges = [];
      while (_curr !== undefined && _p[_curr] !== undefined) {
        let _u = _p[_curr];
        if (_u === -1) break;
        _path_edges.push({u: _u, v: _curr});
        _curr = _u;
      }
      console.log('🚩 [emei_highlight_path] Reconstructed Path Edges:', JSON.stringify(_path_edges));

      for (let i = _path_edges.length - 1; i >= 0; i--) {
        const _edge = _path_edges[i];
        console.log('🚩 [emei_highlight_path] Highlighting edge:', _edge.u, '->', _edge.v);
        await highlightCableCar(_edge.u, _edge.v, ${bottleneck});
      }
      console.log('🚩 [emei_highlight_path] DONE');
    })();\n`;
    };
}
