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

// สร้าง Theme แนวคลาสสิก/คลีนๆ แบบหน้าเว็บ Official ของ Google Blockly
const GoogleDocsTheme = Blockly.Theme.defineTheme('GoogleDocsTheme', {
  base: ModernTheme,
  blockStyles: {
    'movement_blocks': { colourPrimary: '#4CAF50' },  // เขียว — เดิน/หมุน
    'combat_blocks': { colourPrimary: '#E53935' },  // แดง — โจมตี/ป้องกัน
    'logic_blocks': { colourPrimary: '#1E88E5' },  // น้ำเงิน — if/else
    'loop_blocks': { colourPrimary: '#43A047' },   // เขียวเข้ม — for/while
    'math_blocks': { colourPrimary: '#7B1FA2' },   // ม่วงเข้ม — ตัวเลข
    'list_blocks': { colourPrimary: '#9C27B0' },   // ม่วงอ่อน — อาเรย์
    'text_blocks': { colourPrimary: '#00897B' },   // เขียวน้ำทะเล — ข้อความ
    'hat_blocks': { colourPrimary: '#EF5350' },   // แดงสด — event/action
    'procedure_blocks': { colourPrimary: '#FF7043' },  // ส้ม — ฟังก์ชัน
    'variable_blocks': { colourPrimary: '#FF9800' },   // ส้มเหลือง — ตัวแปร
  },
  // 🏷️ กำหนดสีป้ายชื่อหมวดหมู่ใน Toolbox
  categoryStyles: {
    'logic_category': { colour: '#1E88E5' },
    'loop_category': { colour: '#43A047' },
    'math_category': { colour: '#7B1FA2' },
    'list_category': { colour: '#9C27B0' },
    'text_category': { colour: '#00897B' },
    'procedure_category': { colour: '#FF7043' },
    'variable_category': { colour: '#FF9800' },
  },
  fontStyle: {
    "family": "'Prompt', 'Kanit', 'Inter', 'Segoe UI', sans-serif",
    "weight": "400",
    "size": 14
  },
  componentStyles: {
    workspaceBackgroundColour: '#ffffff',
    toolboxBackgroundColour: '#f1f3f4',
    toolboxForegroundColour: '#3c4043',
    flyoutBackgroundColour: '#ffffff',
    flyoutForegroundColour: '#3c4043',
    flyoutOpacity: 0.95,
    scrollbarColour: '#dadce0',
    scrollbarOpacity: 0.8,
    insertionMarkerColour: '#1a73e8',
    insertionMarkerOpacity: 0.3,
    cursorColour: '#3c4043'
  }
});

import {
  ScrollOptions,
  ScrollBlockDragger,
  ScrollMetricsManager,
} from '@blockly/plugin-scroll-options';

import { createToolboxConfig } from '../core/toolbox';
import { ensureStandardBlocks } from '../core/standard';
import { defineAllBlocks } from '../core/definitions';
import { defineAllGenerators } from '../core/generators';
import { isMuted, getVolume } from '../../sound/soundManager';

export function useSharedBlockly({
  blocklyRef,                  // DOM Element
  workspaceRef: externalRef,   // Optional external ref for workspace
  enabledBlocks,               // รายชื่อบล็อกที่อนุญาตให้ใช้
  readOnly = false,            // Mode: true สำหรับ Preview/Play, false สำหรับ Editor
  autoInject = true,           // ถ้า true จะ inject ตอน mount ทันที
  refReady = true,             // ไว้เช็คว่า DOM Ref Mount เสร็จหรือยัง (สำหรับ Dependency)
  onWorkspaceReady = null,     // Callback เมื่อ inject เสร็จ
  hideToolbox = false          // เพิ่ม option ซ่อน toolbox เกลี้ยง
}) {
  const internalRef = useRef(null);
  const workspaceRef = externalRef || internalRef;
  const [blocklyLoaded, setBlocklyLoaded] = useState(false);

  const initBlockly = useCallback(() => {
    if (!blocklyRef.current || !enabledBlocks || Object.keys(enabledBlocks).length === 0) {
      return null;
    }
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
    }
    blocklyRef.current.innerHTML = '';

    // Set up standard blocks, definitions, and generators
    ensureStandardBlocks();
    defineAllBlocks();
    defineAllGenerators();

    const toolbox = hideToolbox ? undefined : createToolboxConfig(enabledBlocks);

    const workspaceConfig = {
      theme: GoogleDocsTheme,
      renderer: 'thrasos', // กลับมาใช้ 'geras' ซึ่งเป็นดีไซน์บล็อกมาตรฐานของหน้า Google Blockly
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
      sounds: true,
      oneBasedIndex: false, // หรือ true ขึ้นอยู่กับการใช้งาน (เดิม GameCore ใช้ false, Admin ใช้ true แต่จริงๆ ไม่น่ากระทบมาก)
      variables: enabledBlocks["variables_get"] ||
        enabledBlocks["variables_set"] ||
        enabledBlocks["var_math"] ||
        enabledBlocks["get_var_value"] || false,
      grid: {
        spacing: 20,
        length: 3,
        colour: "#f1f3f4", // จุดตารางสีเทาอ่อนๆ บนพื้นขาว
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
    };

    Blockly.Scrollbar.scrollbarThickness = 8;

    const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
    workspaceRef.current = workspace;

    // Sync Blockly sounds with our global Sound Manager (Mute & Volume slider)
    if (workspace.getAudioManager) {
      const audioManager = workspace.getAudioManager();
      if (audioManager && !audioManager._originalPlay) {
        audioManager._originalPlay = audioManager.play;
        audioManager.play = function (name, volume) {
          if (isMuted()) return;
          const defaultVol = typeof volume === 'number' ? volume : 1;
          this._originalPlay.call(this, name, defaultVol * getVolume());
        };
      }
    }

    // Install Scroll Options plugin for standard smooth scrolling
    const scrollOptions = new ScrollOptions(workspace);
    scrollOptions.init();

    // 🌟 ลูกเล่นแสงกระพริบ: ฉีด CSS Keyframes แอนิเมชันสำหรับบล็อก
    if (!document.getElementById('blockly-snap-style')) {
      const style = document.createElement('style');
      style.id = 'blockly-snap-style';
      // ใช้ drop-shadow สีม่วงสว่างพร้อมเร่งความสว่าง 1.4 เท่าเพื่อให้บล็อกเรืองแสงสวยๆ
      style.innerHTML = `
        @keyframes blocklySnapGlow {
          0% { filter: drop-shadow(0 0 18px rgba(168, 85, 247, 0.95)) brightness(1.3); }
          100% { filter: drop-shadow(0 0 0px transparent) brightness(1); }
        }
        .blockly-snap-effect {
          animation: blocklySnapGlow 0.6s ease-out;
        }
      `;
      document.head.appendChild(style);
    }

    // 🌟 ดักจับ Events เวลาต่อบล็อกเข้าด้วยกันสำเร็จ
    workspace.addChangeListener((event) => {
      // เช็คว่าเป็น Event การย้ายบล็อก และบล็อกนี้เกาะติดกับบล็อกอื่นแล้ว (มี newParentId)
      if (event.type === Blockly.Events.BLOCK_MOVE && event.newParentId) {
        const block = workspace.getBlockById(event.blockId);
        if (block) {
          const svgRoot = block.getSvgRoot(); // ดึงก้อน SVG ของบล็อกนั้นมา
          if (svgRoot) {
            // เอา Class ออกก่อนแล้วรีเซ็ตทริกเกอร์ (เพื่อให้กระพริบซ้ำได้ถ้ารัวๆ)
            svgRoot.classList.remove('blockly-snap-effect');
            void svgRoot.offsetWidth; // บังคับให้เบราว์เซอร์ล้างคิววาดหน้าจอ (Reflow)
            // ใส่ Class แอนิเมชันกระพริบ
            svgRoot.classList.add('blockly-snap-effect');

            // ตั้งเวลาทิ้งคลาสออกหลังกระพริบเสร็จ
            setTimeout(() => {
              if (svgRoot.classList.contains('blockly-snap-effect')) {
                svgRoot.classList.remove('blockly-snap-effect');
              }
            }, 600);
          }
        }
      }
    });

    setBlocklyLoaded(true);

    if (onWorkspaceReady) {
      onWorkspaceReady(workspace);
    }

    return workspace;
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

  return { initBlockly, workspaceRef, blocklyLoaded };
}
