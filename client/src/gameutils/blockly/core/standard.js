import { defineAllBlocks } from './definitions';
import { defineAllGenerators } from './generators';
import { applyProcedureOverrides } from '../blocks/procedures/overrides';

export const ensureStandardBlocks = () => {
  defineAllBlocks();
  defineAllGenerators();
  applyProcedureOverrides();
};
