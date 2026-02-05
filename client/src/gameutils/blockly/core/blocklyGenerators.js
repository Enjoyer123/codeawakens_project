// Blockly JavaScript Generators - Main Aggregator
// This file imports and calls all category-specific generator modules
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

// Import all generator modules
import { defineDictionaryGenerators, defineDataGenerators } from '../data/blocklyDataGenerators';
import { defineMovementGenerators } from '../movement/blocklyMovementGenerators';
import { defineLogicGenerators } from '../logic/blocklyLogicGenerators';
import { defineMathGenerators } from '../math/blocklyMathGenerators';
import { defineLoopGenerators } from '../loop/blocklyLoopGenerators';
import { defineEntityGenerators } from '../entities/blocklyEntityGenerators';
import { defineGraphGenerators } from '../graph/blocklyGraphGenerators';
import { defineListGenerators } from '../data/blocklyListGenerators';
import { defineListSetIndexGenerator } from '../data/blocklyListSetIndexGenerator';
import { defineAlgorithmGenerators } from '../algorithms/algorithmGenerators';
import { defineSpecialMathGenerators } from '../algorithms/specialMathGenerators';
import { defineProcedureDefGenerators } from '../procedure/procedureDefGenerators';
import { defineProcedureCallGenerators } from '../procedure/procedureCallGenerators';
import { defineNQueenGenerators } from '../algorithms/nqueen/blocklyNQueenGenerators';

/**
 * Define all Blockly generators by calling all category-specific generator functions
 */
// List of generators that MUST be preserved/restored (Nuclear Force)
const CRITICAL_FORCE_GENERATORS = [
];

/**
 * Define all Blockly generators by calling all category-specific generator functions
 */
export function defineAllGenerators() {
  console.log('[defineAllGenerators] Starting generator definition...');

  const originalGenerators = {};
  const saveGen = (type) => {
    if (javascriptGenerator.forBlock[type]) {
      originalGenerators[type] = javascriptGenerator.forBlock[type];
    }
  };

  // 1. Save critical generators before potential overrides
  CRITICAL_FORCE_GENERATORS.forEach(saveGen);

  // Call all generator definition functions
  defineDictionaryGenerators();
  defineDataGenerators();
  defineMovementGenerators();
  defineLogicGenerators();
  defineMathGenerators();
  defineLoopGenerators();
  defineEntityGenerators();
  defineGraphGenerators();
  defineListGenerators();
  defineListSetIndexGenerator();
  defineAlgorithmGenerators();
  defineSpecialMathGenerators();
  defineProcedureDefGenerators();
  defineProcedureCallGenerators();
  defineNQueenGenerators();

  // Verify that our generator was set
  console.log('[defineAllGenerators] procedures_defreturn generator set:', typeof javascriptGenerator.forBlock["procedures_defreturn"]);

  // NUCLEAR FORCE: Re-apply our custom generators at the VERY END
  // We REMOVE "lists_setIndex" from here because we WANT our custom 0-based override to stay!
  CRITICAL_FORCE_GENERATORS.forEach(type => {
    if (originalGenerators[type]) {
      javascriptGenerator.forBlock[type] = originalGenerators[type];
      console.log(`[defineAllGenerators] 🚀 Nuclear Force Champion: ${type}`);
    } else {
      console.warn(`[defineAllGenerators] ⚠️ Could not restore critical generator: ${type} (Not found in original)`);
    }
  });

  // Final verification
  const finalGen = javascriptGenerator.forBlock["procedures_defreturn"];
  const isCustom = finalGen?.toString().includes('CUSTOM GENERATOR');
  console.log('[defineAllGenerators] Final check - procedures_defreturn generator is our custom one:', isCustom);

  console.log('[defineAllGenerators] Finished generator definition.');

  // VERIFY variables_set
  const varSetGen = javascriptGenerator.forBlock["variables_set"];
  const isMyVarSet = varSetGen && varSetGen.toString().includes('GEN-DEBUG');
  console.log(`[defineAllGenerators] variables_set verification: Is Custom? ${isMyVarSet}`);
  if (!isMyVarSet) {
    console.warn('[defineAllGenerators] ⚠️ variables_set was overridden! Re-applying defineDataGenerators...');
    defineDataGenerators();
    const retryGen = javascriptGenerator.forBlock["variables_set"];
    console.log(`[defineAllGenerators] Retry variables_set: Is Custom? ${retryGen && retryGen.toString().includes('GEN-DEBUG')}`);
  }
}
