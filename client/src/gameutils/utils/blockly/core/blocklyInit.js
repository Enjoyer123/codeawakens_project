// Blockly Initialization
import * as Blockly from "blockly/core";
import { defineAllBlocks } from './blocklyBlocks';
import { defineListBlocks } from '../data/blocklyList';
import { createToolboxConfig } from './blocklyToolbox';
import { defineAllGenerators } from './blocklyGenerators';
console.log('blocklyInit.js loaded - reloading generators v3');
import { ensureStandardBlocks } from './blocklyStandardBlocks';

// Helper function to completely override procedure blocks
function overrideProcedureBlocks() {
  ['procedures_defreturn', 'procedures_defnoreturn'].forEach(blockType => {
    if (!Blockly.Blocks[blockType]) {
      console.warn(`${blockType} not found`);
      return;
    }

    console.log(`Overriding ${blockType}...`);

    // Store original methods
    const originalInit = Blockly.Blocks[blockType].init;
    const originalRenameProcedure = Blockly.Blocks[blockType].renameProcedure;

    // Override init to set default name
    if (originalInit) {
      Blockly.Blocks[blockType].init = function () {
        originalInit.call(this);

        // Set default name immediately
        const nameField = this.getField('NAME');
        if (nameField && !nameField.getValue()) {
          nameField.setValue('do_something');
        }
      };
    }

    // COMPLETELY replace renameProcedure - don't call original at all
    Blockly.Blocks[blockType].renameProcedure = function (oldName, newName) {
      console.log(`${blockType}.renameProcedure:`, { oldName, newName });

      // Just do nothing - this prevents all errors
      // The block will keep its current name
      return;
    };

    // COMPLETELY replace loadExtraState - don't call original at all  
    Blockly.Blocks[blockType].loadExtraState = function (state) {
      console.log(`${blockType}.loadExtraState:`, state);

      try {
        // Get safe name
        let name = 'do_something';
        if (state && state.name && typeof state.name === 'string') {
          name = state.name;
        }

        // Get safe params
        let params = [];
        if (state && Array.isArray(state.params)) {
          params = state.params;
        }

        console.log(`${blockType}.loadExtraState: using name="${name}", params=`, params);

        // Set name field directly
        const nameField = this.getField('NAME');
        if (nameField) {
          nameField.setValue(name);
        }

        // Store params on the block
        this.arguments_ = params;

        // Update block shape if method exists
        if (this.updateShape_) {
          this.updateShape_();
        }

        return { name, params };
      } catch (e) {
        console.error(`${blockType}.loadExtraState error:`, e);
        return { name: 'do_something', params: [] };
      }
    };

    console.log(`${blockType} overridden successfully`);
  });
}

// Initialize Blockly workspace
export function initBlockly(containerRef, enabledBlocks) {
  if (!containerRef.current) return null;

  try {
    console.log('=== Starting Blockly initialization ===');

    // Override standard blocks first
    ensureStandardBlocks();
    defineListBlocks();
    defineAllBlocks();
    defineAllGenerators();

    // Override procedure blocks BEFORE creating workspace
    console.log('Overriding procedure blocks...');
    overrideProcedureBlocks();

    const toolbox = createToolboxConfig(enabledBlocks);

    const workspaceConfig = {
      toolbox,
      collapse: true,
      comments: true,
      disable: true,
      maxBlocks: Infinity,
      trashcan: true,
      horizontalLayout: false,
      toolboxPosition: "start",
      css: true,
      media: "https://blockly-demo.appspot.com/static/media/",
      rtl: false,
      scrollbars: true,
      sounds: false,
      oneBasedIndex: true,
      variables: true,
      variableMap: true,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#ccc",
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.8,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
    };

    console.log('Creating workspace...');
    const workspace = Blockly.inject(containerRef.current, workspaceConfig);

    // Override again after workspace creation
    console.log('Overriding procedure blocks again after workspace creation...');
    overrideProcedureBlocks();

    console.log('=== Blockly initialization complete ===');

    return workspace;
  } catch (error) {
    console.error("Error initializing workspace:", error);
    throw new Error("เกิดข้อผิดพลาดในการสร้าง workspace");
  }
}