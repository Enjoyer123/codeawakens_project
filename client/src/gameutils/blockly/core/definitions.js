import { defineMovementBlocks } from '../blocks/movement/definitions';
import { defineLogicBlocks } from '../blocks/logic/definitions';
import { defineCoinBlocks } from '../blocks/entities/coin';
import { definePersonBlocks } from '../blocks/entities/person';
import { defineMathBlocks } from '../blocks/math/definitions';

import { defineFunctionBlocks } from '../blocks/procedures/definitions';
import { defineLoopBlocks } from '../blocks/loops/definitions';
import { defineVariableBlocks } from '../blocks/data/variables/blocks';
import { defineListBlocks } from '../blocks/data/lists/definitions';
import { defineListOperationsBlocks } from '../blocks/data/lists/operations';
import { defineGraphOperationsBlocks } from '../algorithms/graph/definitions';
import { defineLogicOperatorsBlocks } from '../blocks/logic/operators';

import { defineDictionaryBlocks } from '../blocks/data/dicts/definitions';
import { defineKnapsackVisualBlocks } from '../algorithms/knapsack/blocks';
import { defineSubsetSumVisualBlocks } from '../algorithms/subset_sum/blocks';
import { defineCoinChangeVisualBlocks } from '../algorithms/coin_change/blocks';
import { defineEmeiVisualBlocks } from '../algorithms/emei_mountain/blocks';
import { defineNQueenBlocks } from '../algorithms/nqueen/blocks';
import { defineFiboVisualBlocks } from '../algorithms/fibo/blocks';


export function defineAllBlocks() {
  // Call all block definition functions
  defineMovementBlocks();
  defineLogicBlocks();
  defineMathBlocks();
  defineCoinBlocks();
  definePersonBlocks();


  defineFunctionBlocks();
  defineLoopBlocks();
  defineVariableBlocks();
  defineListBlocks(); // Must be called before list operations to override standard blocks
  defineListOperationsBlocks();
  defineGraphOperationsBlocks();
  defineLogicOperatorsBlocks();

  defineDictionaryBlocks();
  defineKnapsackVisualBlocks();
  defineSubsetSumVisualBlocks();
  defineCoinChangeVisualBlocks();
  defineEmeiVisualBlocks();
  defineNQueenBlocks();
  defineFiboVisualBlocks();
}
