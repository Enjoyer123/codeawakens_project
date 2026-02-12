// Blockly Initialization
import * as Blockly from "blockly/core";
import { ensureStandardBlocks } from './blocklyStandard/blocklyStandardBlocks';
import { createToolboxConfig } from './blocklyToolbox';

// Initialize Blockly workspace
export function initBlockly(containerRef, enabledBlocks) {
  if (!containerRef.current) return null;

  try {
    // Ensure standard blocks, generators, and procedure overrides
    // (ensureStandardBlocks calls applyProcedureOverrides internally)
    ensureStandardBlocks();

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

    const workspace = Blockly.inject(containerRef.current, workspaceConfig);

    return workspace;
  } catch (error) {
    console.error("Error initializing workspace:", error);
    throw new Error("เกิดข้อผิดพลาดในการสร้าง workspace");
  }
}
