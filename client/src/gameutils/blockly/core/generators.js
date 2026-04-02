/**
 * Generator definitions
 * Aggregates all generator definitions
 */
import { defineDataGenerators } from '../blocks/data/variables/generators';
import { defineLogicGenerators } from '../blocks/logic/generators';
import { defineDictionaryGenerators } from '../blocks/data/dicts/generators';
import { defineMovementGenerators } from '../blocks/movement/generators';
import { defineLoopGenerators } from '../blocks/loops/generators';
import { defineEntityGenerators } from '../blocks/entities/generators';
import { defineGraphGenerators } from '../algorithms/graph/generators';
import { defineListGenerators } from '../blocks/data/lists/generators';
import { defineListSetIndexGenerator } from '../blocks/data/lists/set_generator';
import { defineProcedureDefGenerators } from '../blocks/procedures/def_generators';
import { defineProcedureCallGenerators } from '../blocks/procedures/call_generators';

// Algorithm Generators
import { defineKnapsackGenerators } from '../algorithms/knapsack/generators';
import { defineSubsetSumGenerators } from '../algorithms/subset_sum/generators';
import { defineCoinChangeGenerators } from '../algorithms/coin_change/generators';
import { defineEmeiGenerators } from '../algorithms/emei_mountain/generators';
import { defineNQueenGenerators } from '../algorithms/nqueen/generators';
import { defineFiboGenerators } from "../algorithms/fibo/generators";
import { defineMathGenerators } from '../blocks/math/generators';

export const defineAllGenerators = () => {

  defineMovementGenerators();
  defineLoopGenerators();
  defineLogicGenerators();
  defineDataGenerators();
  defineDictionaryGenerators();
  defineListGenerators();
  defineListSetIndexGenerator();
  defineEntityGenerators();
  defineProcedureDefGenerators();
  defineProcedureCallGenerators();
  defineMathGenerators();
  // Algorithm Generators
  defineGraphGenerators();
  defineKnapsackGenerators();
  defineSubsetSumGenerators();
  defineCoinChangeGenerators();
  defineFiboGenerators();
  defineEmeiGenerators();
  defineNQueenGenerators();
};
