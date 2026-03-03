/**
 * Hook for Blockly workspace initialization
 * จัดการการเตรียม Workspace ของ Blockly และเชื่อมต่อกับ Phaser
 */

import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
import { javascriptGenerator } from "blockly/javascript";
import ModernTheme from '@blockly/theme-modern';
import {
  ScrollOptions,
  ScrollBlockDragger,
  ScrollMetricsManager,
} from '@blockly/plugin-scroll-options';

// Import Blockly Core Modules
import {
  createToolboxConfig,
  ensureStandardBlocks,
  ensureCommonVariables,
  initializeImprovedVariableHandling
} from '../../../../gameutils/blockly';
import { defineAllBlocks } from '@/gameutils/blockly/core/definitions';
import { defineAllGenerators } from '@/gameutils/blockly/core/generators';

// Import Modules ที่แยกออกมา (Decoupled Modules)
import {
  registerProcedureEventHandlers,
  registerVariableEventHandlers
} from './blocklyEvents';
import { loadStarterXml } from './xmlLoader';

/**
 * Custom Hook: useBlocklySetup
 * [Flow A] Initialization: Hook สำหรับจัดการ Setup ทั้งหมด
 * หน้าที่: สร้างและตั้งค่า Blockly Workspace
 */
export function useBlocklySetup({
  blocklyRef,                  // DOM Element ที่จะใส่ Blockly
  workspaceRef,                // Ref สำหรับเก็บตัวแปร Workspace
  enabledBlocks,               // รายชื่อบล็อกที่อนุญาตให้ใช้ในด่านนี้
  // enabledBlockKeySignature,    // Signature สำหรับเช็คว่า block config เปลี่ยนหรือไม่
  setBlocklyLoaded,            // State บอกว่าโหลดเสร็จหรือยัง
  setBlocklyJavaScriptReady,   // State บอกว่า JS Generator พร้อมไหม
  // setCurrentHint,              // ฟังก์ชันแสดง Hint/Error
  initPhaserGame,              // ฟังก์ชันเริ่มเกม Phaser
  starter_xml = null,          // โค้ดเริ่มต้น (XML String)
  blocklyLoaded = false,       // สถานะปัจจุบัน
  isTextCodeEnabled = false,   // โหมดพิมพ์โค้ดเอง?
  onCodeGenerated = null       // Callback เมื่อโค้ดเปลี่ยน
}) {

  // ============================================================================
  // [Flow A] Initialization: 2. สร้าง Workspace (Main Logic)
  // ฟังก์ชันหลัก: สร้าง Workspace และเริ่มระบบ
  // ============================================================================
  const initBlocklyAndPhaser = () => {
    // ถ้ายังไม่มี DOM หรือไม่มี Config บล็อก -> ไม่ทำอะไร
    if (!blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    try {
      // Dispose old workspace if exists
      if (workspaceRef.current) {
        try {
          workspaceRef.current.dispose();
        } catch (disposeError) {
          console.warn("Error disposing workspace:", disposeError);
        }
        workspaceRef.current = null;
      }

      // เคลียร์ HTML Container
      if (blocklyRef.current) {
        blocklyRef.current.innerHTML = '';
        if (!blocklyRef.current.parentNode) {
          console.error("Blockly container is not attached to DOM!");
          return;
        }
      }

      // เตรียมระบบภายใน (Definitions & Generators)
      initializeImprovedVariableHandling();
      ensureStandardBlocks();
      defineAllGenerators();

      // Patch: แก้ไข Generator ของฟังก์ชัน (เฉพาะกิจ)
      const customProcGen = javascriptGenerator.forBlock["procedures_defreturn"];
      if (customProcGen) {
        javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
      }

      // สร้าง Toolbox Config (เมนูด้านซ้าย)
      const toolbox = createToolboxConfig(enabledBlocks);

      // กำหนดค่า Workspace (Theme, Grid, Zoom)
      const workspaceConfig = {
        theme: ModernTheme,
        renderer: 'geras',
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
        move: {
          scrollbars: { horizontal: true, vertical: true },
          drag: true,
          wheel: true,
        },
        plugins: {
          blockDragger: ScrollBlockDragger,
          metricsManager: ScrollMetricsManager,
        },
        sounds: false,
        oneBasedIndex: true,
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

      // Set scrollbar thickness
      Blockly.Scrollbar.scrollbarThickness = 8;

      // Inject Workspace ลงใน DOM
      const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
      workspaceRef.current = workspace;

      // Initialize scroll-options plugin
      const scrollOptions = new ScrollOptions(workspace);
      scrollOptions.init();

      // อัปเดตสถานะว่าพร้อมแล้ว
      setBlocklyLoaded(v => v + 1);
      setBlocklyJavaScriptReady(true);

      // เตรียมตัวแปรเริ่มต้น (Common Variables)
      ensureCommonVariables(workspace);

      // ลงทะเบียน Event Handlers (ดักจับการเปลี่ยนแปลง)
      registerProcedureEventHandlers(workspace);
      registerVariableEventHandlers(workspace);

      // โหลด Starter XML (จุดเดียว — ไม่มี useEffect ซ้ำอีก)
      if (starter_xml && typeof starter_xml === 'string' && starter_xml.trim()) {
        loadStarterXml(workspace, starter_xml, isTextCodeEnabled, onCodeGenerated);
      }

      // เริ่มเกม Phaser
      initPhaserGame();

    } catch (error) {
      console.error("Error initializing workspace:", error);
    }
  };

  return { initBlocklyAndPhaser };
}