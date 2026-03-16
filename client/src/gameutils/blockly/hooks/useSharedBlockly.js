/**
 * Universal Hook: useSharedBlockly
 * จัดการการเตรียม Workspace ของ Blockly ใช้ได้กับทั้ง GameCore, Admin (Level/Pattern)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
import ModernTheme from '@blockly/theme-modern';
import {
  ScrollOptions,
  ScrollBlockDragger,
  ScrollMetricsManager,
} from '@blockly/plugin-scroll-options';

import { createToolboxConfig } from '../core/toolbox';
import { ensureStandardBlocks } from '../core/standard';
import { defineAllBlocks } from '../core/definitions';
import { defineAllGenerators } from '../core/generators';

export function useSharedBlockly({
  blocklyRef,                  // DOM Element
  workspaceRef: externalRef,   // Optional external ref for workspace
  enabledBlocks,               // รายชื่อบล็อกที่อนุญาตให้ใช้
  readOnly = false,            // Mode: true สำหรับ Preview/Play, false สำหรับ Editor
  autoInject = true,           // ถ้า true จะ inject ตอน mount ทันที
  refReady = true,             // ไว้เช็คว่า DOM Ref Mount เสร็จหรือยัง (สำหรับ Dependency)
  onWorkspaceReady = null      // Callback เมื่อ inject เสร็จ
}) {
  const internalRef = useRef(null);
  const workspaceRef = externalRef || internalRef;
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);
  const [error, setError] = useState(null);

  const initBlockly = useCallback(() => {
    if (!blocklyRef.current || !enabledBlocks || Object.keys(enabledBlocks).length === 0) {
      return null;
    }

    try {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
      blocklyRef.current.innerHTML = '';

      // Set up standard blocks, definitions, and generators
      ensureStandardBlocks();
      defineAllBlocks();
      defineAllGenerators();

      const toolbox = createToolboxConfig(enabledBlocks);

      const workspaceConfig = {
        theme: ModernTheme,
        renderer: 'geras',
        toolbox,
        collapse: true,
        comments: true,
        disable: false, // อนุญาตให้ disable blocks ได้
        maxBlocks: Infinity,
        trashcan: !readOnly, // ซ่อนถังขยะในโหมดอ่านอย่างเดียว
        horizontalLayout: false,
        toolboxPosition: "start",
        css: true,
        media: "https://blockly-demo.appspot.com/static/media/",
        rtl: false,
        readOnly: readOnly,
        move: {
          scrollbars: { horizontal: true, vertical: true },
          drag: !readOnly,
          wheel: true,
        },
        plugins: {
          blockDragger: ScrollBlockDragger,
          metricsManager: ScrollMetricsManager,
        },
        sounds: false,
        oneBasedIndex: false, // หรือ true ขึ้นอยู่กับการใช้งาน (เดิม GameCore ใช้ false, Admin ใช้ true แต่จริงๆ ไม่น่ากระทบมาก)
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

      Blockly.Scrollbar.scrollbarThickness = 8;

      const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
      workspaceRef.current = workspace;

      // Install Scroll Options plugin for standard smooth scrolling
      const scrollOptions = new ScrollOptions(workspace);
      scrollOptions.init();

      setBlocklyLoaded(true);

      if (onWorkspaceReady) {
          onWorkspaceReady(workspace);
      }

      return workspace;

    } catch (err) {
      console.error("Error initializing Blockly:", err);
      setError('เกิดข้อผิดพลาดในการโหลด Blockly: ' + (err?.message || 'ไม่ทราบสาเหตุ'));
      return null;
    }
  }, [enabledBlocks, readOnly, blocklyRef, refReady]);

  useEffect(() => {
    if (autoInject) {
        initBlockly();
    }
    return () => {
      if (autoInject && workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
        setBlocklyLoaded(false);
      }
    };
  }, [initBlockly, autoInject]);

  return { initBlockly, workspaceRef, blocklyLoaded, error };
}
