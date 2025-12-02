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
}

