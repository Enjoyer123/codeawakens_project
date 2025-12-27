// Blockly Block Definitions - Main aggregator
import { defineMovementBlocks } from './blocklyMovement';
import { defineLogicBlocks } from './blocklyLogic';
import { defineMathBlocks } from './blocklyMath';
import { defineCoinBlocks } from './blocklyCoin';
import { definePersonBlocks } from './blocklyPerson';
import { defineStackBlocks } from './blocklyStack';
import { defineFunctionBlocks } from './blocklyFunction';
import { defineLoopBlocks } from './blocklyLoop';
import { defineVariableBlocks } from './blocklyVariableBlocks';
import { defineListBlocks } from './blocklyList';
import { defineListOperationsBlocks } from './blocklyListOperations';
import { defineGraphOperationsBlocks } from './blocklyGraphOperations';
import { defineLogicOperatorsBlocks } from './blocklyLogicOperators';
import { defineDfsVisualBlocks } from './blocklyDfsVisualBlocks';
import { defineDictionaryBlocks } from './blocklyDictionary';
import { defineKnapsackVisualBlocks } from './blocklyKnapsackVisualBlocks';
import { defineSubsetSumVisualBlocks } from './blocklySubsetSumVisualBlocks';
import { defineCoinChangeVisualBlocks } from './blocklyCoinChangeVisualBlocks';
import { defineTrainScheduleBlocks } from './blocklyTrainScheduleVisualBlocks';
import { defineEmeiVisualBlocks } from './blocklyEmeiVisualBlocks';


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


