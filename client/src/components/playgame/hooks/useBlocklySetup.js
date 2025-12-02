/**
 * Hook for Blockly workspace initialization
 */

import * as Blockly from "blockly/core";
import {
  createToolboxConfig,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../gameutils/utils/blocklyUtils';
import { defineAllGenerators } from '../../../gameutils/utils/blockly/blocklyGenerators';

/**
 * Hook for Blockly setup
 * @param {Object} params - Parameters object
 * @returns {Function} initBlocklyAndPhaser function
 */
export function useBlocklySetup({
  blocklyRef,
  workspaceRef,
  enabledBlocks,
  enabledBlockKeySignature,
  setBlocklyLoaded,
  setBlocklyJavaScriptReady,
  setCurrentHint,
  initPhaserGame
}) {
  const initBlocklyAndPhaser = () => {
    console.log("initBlocklyAndPhaser called");
    console.log("blocklyRef.current:", !!blocklyRef.current);
    console.log("enabledBlocks:", enabledBlocks);
    console.log("enabledBlocks length:", Object.keys(enabledBlocks).length);

    if (!blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      console.log("Early return - missing ref or no enabled blocks");
      return;
    }

    // Add delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Clean up existing workspace first
        setBlocklyLoaded(false);
        if (workspaceRef.current) {
          console.log("Disposing existing workspace...");
          try {
            workspaceRef.current.dispose();
          } catch (disposeError) {
            console.warn("Error disposing workspace:", disposeError);
          }
          workspaceRef.current = null;
        }

        // Clear the container and ensure it's ready
        if (blocklyRef.current) {
          blocklyRef.current.innerHTML = '';
          // Ensure the container is properly attached to DOM
          if (!blocklyRef.current.parentNode) {
            console.error("Blockly container is not attached to DOM!");
            return;
          }
        }

        // Initialize improved variable handling
        initializeImprovedVariableHandling();

        // Ensure standard blocks are available (this will call defineAllBlocks internally)
        console.log("🔧 Ensuring standard blocks...");
        ensureStandardBlocks();
        
        // Define all JavaScript generators
        console.log("🔧 Defining JavaScript generators...");
        defineAllGenerators();

        // Initialize Blockly
        console.log("🔧 Creating toolbox with enabledBlocks:", enabledBlocks);
        console.log("🔧 Enabled block keys:", Object.keys(enabledBlocks));
        const toolbox = createToolboxConfig(enabledBlocks);
        console.log("🔧 Toolbox created:", toolbox);
        console.log("🔧 Toolbox categories count:", toolbox?.categories?.length || 0);
        if (toolbox?.categories) {
          toolbox.categories.forEach((cat, idx) => {
            console.log(`🔧 Category ${idx}: ${cat.name}, blocks: ${cat.contents?.length || 0}`);
          });
        }

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
          // Enable variable management only if variable blocks are enabled
          variables: enabledBlocks["variables_get"] || 
                     enabledBlocks["variables_set"] || 
                     enabledBlocks["var_math"] || 
                     enabledBlocks["get_var_value"] || false,
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

        console.log("Creating Blockly workspace...");
        const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
        console.log("Blockly workspace created:", workspace);
        workspaceRef.current = workspace;
        setBlocklyLoaded(true);
        
        // Set blocklyJavaScriptReady to true after workspace is created
        setBlocklyJavaScriptReady(true);

        // Set up Variable Manager for variable renaming
        if (workspace.getVariableMap) {
          const variableMap = workspace.getVariableMap();
          if (variableMap) {
            console.log("Variable Map available:", variableMap);
          }
        }

        // Ensure common variables exist
        ensureCommonVariables(workspace);

        // Add error handler for workspace
        workspace.addChangeListener((event) => {
          if (event.type === Blockly.Events.ERROR) {
            console.warn("Blockly error event:", event);
          }
        });

        // Add variable management - simplified
        workspace.addChangeListener((event) => {
          if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_CHANGE) {
            // Ensure variables exist when blocks are created or changed
            const block = workspace.getBlockById(event.blockId);
            if (block && block.getField) {
              const varField = block.getField('VAR');
              if (varField && varField.getValue) {
                const varName = varField.getValue();
                const variable = workspace.getVariable(varName);
                if (!variable) {
                  console.log(`Creating variable: ${varName}`);
                  try {
                    workspace.createVariable(varName);
                  } catch (error) {
                    console.error(`Failed to create variable ${varName}:`, error);
                  }
                }
              }
            }
          }
        });

        // Initialize Phaser
        console.log("Initializing Phaser game...");
        initPhaserGame();

        // Trigger pattern analysis setup after workspace is created
        console.log("🔍 Workspace created, triggering pattern analysis setup");

        // Force re-evaluation of pattern analysis useEffect
        setTimeout(() => {
          console.log("🔍 Forcing pattern analysis setup after workspace creation");
        }, 50);
      } catch (error) {
        console.error("Error initializing workspace:", error);
        setCurrentHint("❌ เกิดข้อผิดพลาดในการสร้าง workspace");
      }
    }, 100); // 100ms delay to ensure DOM is ready
  };

  return { initBlocklyAndPhaser };
}

