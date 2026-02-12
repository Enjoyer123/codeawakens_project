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

export function defineAllGenerators() {

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

}
