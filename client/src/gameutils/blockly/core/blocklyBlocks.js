// Blockly Block Definitions - Main aggregator
import { defineMovementBlocks } from '../movement/blocklyMovement';
import { defineLogicBlocks } from '../logic/blocklyLogic';
import { defineMathBlocks } from '../math/blocklyMath';
import { defineCoinBlocks } from '../entities/blocklyCoin';
import { definePersonBlocks } from '../entities/blocklyPerson';
import { defineStackBlocks } from '../data/blocklyStack';
import { defineFunctionBlocks } from '../data/blocklyFunction';
import { defineLoopBlocks } from '../loop/blocklyLoop';
import { defineVariableBlocks } from '../data/blocklyVariableBlocks';
import { defineListBlocks } from '../data/blocklyList';
import { defineListOperationsBlocks } from '../data/blocklyListOperations';
import { defineGraphOperationsBlocks } from '../graph/blocklyGraphOperations';
import { defineLogicOperatorsBlocks } from '../logic/blocklyLogicOperators';
import { defineDfsVisualBlocks } from '../graph/blocklyDfsVisualBlocks';
import { defineDictionaryBlocks } from '../data/blocklyDictionary';
import { defineKnapsackVisualBlocks } from '../algorithms/knapsack/blocklyKnapsackVisualBlocks';
import { defineSubsetSumVisualBlocks } from '../algorithms/subset_sum/blocklySubsetSumVisualBlocks';
import { defineCoinChangeVisualBlocks } from '../algorithms/coin_change/blocklyCoinChangeVisualBlocks';
import { defineTrainScheduleBlocks } from '../algorithms/special/blocklyTrainScheduleVisualBlocks';
import { defineEmeiVisualBlocks } from '../algorithms/special/blocklyEmeiVisualBlocks';


export function defineAllBlocks() {
  // Call all block definition functions
  defineMovementBlocks();
  defineLogicBlocks();
  defineMathBlocks();
  defineCoinBlocks();
  definePersonBlocks();
  defineStackBlocks();
  defineFunctionBlocks();
  defineLoopBlocks();
  defineVariableBlocks();
  defineListBlocks(); // Must be called before list operations to override standard blocks
  defineListOperationsBlocks();
  defineGraphOperationsBlocks();
  defineLogicOperatorsBlocks();
  defineDfsVisualBlocks();
  defineDictionaryBlocks();
  defineKnapsackVisualBlocks();
  defineSubsetSumVisualBlocks();
  defineCoinChangeVisualBlocks();
  defineTrainScheduleBlocks();
  defineEmeiVisualBlocks();
}


