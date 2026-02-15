/**
 * Generator definitions
 * Aggregates all generator definitions
 */
import { defineDictionaryGenerators, defineDataGenerators } from '../blocks/data/generators';
import { defineMovementGenerators } from '../blocks/movement/generators';
import { defineLogicGenerators } from '../blocks/logic/generators';
import { defineMathGenerators } from '../blocks/math/generators';
import { defineLoopGenerators } from '../blocks/loops/generators';
import { defineEntityGenerators } from '../blocks/entities/generators';
import { defineGraphGenerators } from '../algorithms/graph/generators';
import { defineListGenerators } from '../blocks/data/lists/generators';
import { defineListSetIndexGenerator } from '../blocks/data/lists/set_generator';
import { defineSpecialMathGenerators } from '../algorithms/shared/special_math';
import { defineProcedureDefGenerators } from '../blocks/procedures/def_generators';
import { defineProcedureCallGenerators } from '../blocks/procedures/call_generators';

// Algorithm Generators
import { defineKnapsackGenerators } from '../algorithms/knapsack/generators';
import { defineSubsetSumGenerators } from '../algorithms/subset_sum/generators';
import { defineCoinChangeGenerators } from '../algorithms/coin_change/generators';
import { defineEmeiGenerators } from '../algorithms/emei_mountain/generators';
import { defineNQueenGenerators } from '../algorithms/nqueen/generators';

export const defineAllGenerators = () => {
  // console.log("Defining all generators...");
  defineMovementGenerators();
  defineLogicGenerators();
  defineMathGenerators();
  defineLoopGenerators();
  defineDataGenerators();
  defineDictionaryGenerators();
  defineListGenerators();
  defineListSetIndexGenerator();
  defineEntityGenerators();
  defineProcedureDefGenerators();
  defineProcedureCallGenerators();

  // Complex Algorithms
  defineGraphGenerators();
  defineSpecialMathGenerators();

  // Feature-specific Algorithm Generators
  defineKnapsackGenerators();
  defineSubsetSumGenerators();
  defineCoinChangeGenerators();
  defineEmeiGenerators();
  defineNQueenGenerators();
};
