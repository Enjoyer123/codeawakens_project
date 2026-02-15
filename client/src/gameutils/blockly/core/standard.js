import { defineAllBlocks } from './definitions';
import { defineAllGenerators } from './generators';
import { applyProcedureOverrides } from '../blocks/procedures/overrides';

export const ensureStandardBlocks = () => {
  // console.log("Ensuring standard blocks are defined...");
  defineAllBlocks();
  defineAllGenerators();
  applyProcedureOverrides();
};
