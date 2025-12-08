// Blockly Utility Functions - Re-export hub
// This file now acts as a re-export hub for all Blockly-related functionality

// Core Blockly imports
import * as Blockly from "blockly/core";
import "blockly/blocks";
import "blockly/javascript";

// CRITICAL: Override procedure blocks IMMEDIATELY after importing Blockly
// This must happen before any other code uses procedure blocks
// Use setTimeout to ensure blocks are loaded
console.log('[blocklyUtils] Setting up procedure blocks override...');

function overrideProcedureBlocksInUtils() {
  console.log('[blocklyUtils] Overriding procedure blocks...');
  // Override procedure definition blocks
  ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      console.log(`[blocklyUtils] Found ${blockType}, overriding...`);
      const originalRename = Blockly.Blocks[blockType].renameProcedure;
      const originalLoadExtraState = Blockly.Blocks[blockType].loadExtraState;
      
      // Override renameProcedure
      // CRITICAL: This must completely replace the original to prevent calling .replace() on undefined
      // Note: originalRename may be undefined if blocklyStandardBlocks.js already overrode it
      Blockly.Blocks[blockType].renameProcedure = function(oldName, newName) {
        // CRITICAL: Early return to prevent calling original with undefined
        if (oldName === undefined || oldName === null || newName === undefined || newName === null) {
      return;
    }
    
        // Convert to string safely
        const safeOldName = String(oldName).trim();
        const safeNewName = String(newName).trim();
        
        if (!safeOldName || !safeNewName) {
      return;
    }
    
        // Only call original if it exists and is a function
        // originalRename may be undefined if blocklyStandardBlocks.js already overrode it
        if (originalRename && typeof originalRename === 'function') {
          try {
            return originalRename.call(this, safeOldName, safeNewName);
          } catch (e) {
            console.error(`[${blockType}] renameProcedure error in original:`, e);
          }
        }
        // If originalRename is undefined, it means blocklyStandardBlocks.js already handled it
        // So we can just return without doing anything
      };
      
      // CRITICAL: Override loadExtraState to NEVER call renameProcedure
      // Store original to check if it exists
      console.log(`[blocklyUtils] Original loadExtraState for ${blockType}:`, typeof originalLoadExtraState);
      Blockly.Blocks[blockType].loadExtraState = function(state) {
        console.log(`[${blockType}] loadExtraState (blocklyUtils) called:`, { 
          state, 
          stateName: state?.name, 
          stateParams: state?.params,
          thisBlock: this.id || 'new block',
          hasOriginal: !!originalLoadExtraState
        });
        try {
          if (!state || typeof state !== 'object') {
            state = {};
          }
          
          let safeName = 'function';
          if (state.name && typeof state.name === 'string' && state.name.trim()) {
            const trimmedName = state.name.trim();
            if (trimmedName && trimmedName !== 'unnamed' && trimmedName !== 'undefined') {
              safeName = trimmedName;
            }
          }
          
          const safeParams = Array.isArray(state.params) ? state.params : [];
          
          // Set name field directly WITHOUT calling renameProcedure
          try {
            const nameField = this.getField('NAME');
            if (nameField) {
              nameField.setValue(safeName);
              console.log(`[${blockType}] loadExtraState: set name field to:`, safeName);
            } else {
              console.warn(`[${blockType}] loadExtraState: nameField not found`);
            }
    } catch (e) {
            console.error(`[${blockType}] loadExtraState error setting name:`, e);
          }
          
          // Handle params
          if (safeParams.length > 0) {
            try {
              if (this.mutationToDom && this.domToMutation) {
                const mutation = this.mutationToDom();
                if (mutation) {
                  mutation.setAttribute('name', safeName);
                  mutation.setAttribute('params', JSON.stringify(safeParams));
                  this.domToMutation(mutation);
                }
              }
    } catch (e) {
              console.error(`[${blockType}] loadExtraState error updating mutation:`, e);
            }
          }
          
          return { name: safeName, params: safeParams };
    } catch (e) {
          console.error(`[${blockType}] loadExtraState error:`, e);
          return { name: 'function', params: [] };
        }
      };
      
      console.log(`[blocklyUtils] Overridden ${blockType}`);
      console.log(`[blocklyUtils] ${blockType} loadExtraState type:`, typeof Blockly.Blocks[blockType].loadExtraState);
      console.log(`[blocklyUtils] ${blockType} renameProcedure type:`, typeof Blockly.Blocks[blockType].renameProcedure);
    } else {
      console.warn(`[blocklyUtils] ${blockType} not found yet`);
    }
  });
  console.log('[blocklyUtils] Procedure blocks override completed');
  
  // Override procedure call blocks (created automatically by custom: "PROCEDURE")
  ['procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      console.log(`[blocklyUtils] Found ${blockType}, overriding...`);
      const originalRename = Blockly.Blocks[blockType].renameProcedure;
      
      if (originalRename) {
        Blockly.Blocks[blockType].renameProcedure = function(oldName, newName) {
          if (!oldName || !newName || oldName === undefined || newName === undefined) {
            return;
          }
          
          try {
            const safeOldName = String(oldName).trim();
            const safeNewName = String(newName).trim();
            
            if (!safeOldName || !safeNewName || safeOldName === 'undefined' || safeNewName === 'undefined') {
              return;
            }
            
            // Only call original if it exists and is a function
            if (originalRename && typeof originalRename === 'function') {
              try {
                return originalRename.call(this, safeOldName, safeNewName);
              } catch (innerError) {
                // If original fails, just return without error
                console.debug(`[${blockType}] Original renameProcedure failed, skipping:`, innerError);
                return;
              }
            }
            // If no original function, just return (no-op)
            return;
          } catch (e) {
            console.error(`[${blockType}] renameProcedure error:`, e);
          }
        };
      }
      
      console.log(`[blocklyUtils] Overridden ${blockType}`);
    }
  });
  
  // Verify override worked
  ['procedures_defreturn', 'procedures_defnoreturn', 'procedures_callreturn', 'procedures_callnoreturn'].forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      const renameProcedure = Blockly.Blocks[blockType].renameProcedure;
      console.log(`[blocklyUtils] Verification - ${blockType}:`, {
        hasRenameProcedure: typeof renameProcedure === 'function'
      });
    }
  });
}

// Try to override immediately
overrideProcedureBlocksInUtils();

// Also try after a short delay in case blocks load asynchronously
setTimeout(() => {
  console.log('[blocklyUtils] Retrying procedure blocks override after delay...');
  overrideProcedureBlocksInUtils();
}, 100);

// Re-export from sub-modules
export { ensureDefaultBlocks } from './blockly/blocklyDefault';
export { 
  ensureCommonVariables, 
  initializeImprovedVariableHandling 
} from './blockly/blocklyVariable';
export { ensureStandardBlocks } from './blockly/blocklyStandardBlocks';
export { defineAllBlocks } from './blockly/blocklyBlocks';
export { defineListBlocks } from './blockly/blocklyList';
export { createToolboxConfig } from './blockly/blocklyToolbox';
export { initBlockly } from './blockly/blocklyInit';

// Re-export helper functions
export {
  turnLeft,
  turnRight,
  collectCoin,
  haveCoin,
  swapCoins,
  compareCoins,
  getCoinValue,
  getCoinCount,
  isSorted,
  rescuePerson,
  rescuePersonAtNode,
  hasPerson,
  personRescued,
  getPersonCount,
  allPeopleRescued,
  getRescuedPeople,
  clearRescuedPeople,
  resetAllPeople,
  moveToNode,
  moveAlongPath,
  getCurrentNode,
  getGraphNeighbors,
  getNodeValue,
  getStack,
  pushNode,
  popNode,
  keepItem,
  hasTreasure,
  treasureCollected,
  stackEmpty,
  stackCount,
  clearStack
} from './blockly/blocklyHelpers';

// Re-export DFS visual feedback functions
export { 
  getGraphNeighborsWithVisual,
  getGraphNeighborsWithVisualSync,
  markVisitedWithVisual, 
  showPathUpdateWithVisual, 
  clearDfsVisuals,
  highlightNode,
  highlightEdge,
  markNodeAsVisited,
  showCurrentPath
} from './blockly/blocklyDfsVisual';
