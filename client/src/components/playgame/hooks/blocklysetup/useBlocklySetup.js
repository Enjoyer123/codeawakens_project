/**
 * Hook for Blockly workspace initialization
 * จัดการการเตรียม Workspace ของ Blockly และเชื่อมต่อกับ Phaser
 */

import React, { useEffect } from 'react';
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/msg/en";
import { javascriptGenerator } from "blockly/javascript";
import ModernTheme from '@blockly/theme-modern';

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

    setTimeout(() => {
      try {
        // 1.1 เคลียร์ Workspace เก่า (ถ้ามี)
        setBlocklyLoaded(false);
        if (workspaceRef.current) {
          try {
            workspaceRef.current.dispose();
          } catch (disposeError) {
            console.warn("Error disposing workspace:", disposeError);
          }
          workspaceRef.current = null;
        }

        // 1.2 เคลียร์ HTML Container
        if (blocklyRef.current) {
          blocklyRef.current.innerHTML = '';
          if (!blocklyRef.current.parentNode) {
            console.error("Blockly container is not attached to DOM!");
            return;
          }
        }

        // 1.3 เตรียมระบบภายใน (Definitions & Generators)
        initializeImprovedVariableHandling(); // ระบบจัดการตัวแปร
        ensureStandardBlocks();               // โหลดบล็อกมาตรฐาน
        defineAllGenerators();                // โหลดตัวสร้างโค้ด JS

        // Patch: แก้ไข Generator ของฟังก์ชัน (เฉพาะกิจ)
        const customProcGen = javascriptGenerator.forBlock["procedures_defreturn"];
        if (customProcGen) {
          javascriptGenerator.forBlock["procedures_defreturn"] = customProcGen;
        }

        // 1.4 สร้าง Toolbox Config (เมนูด้านซ้าย)
        const toolbox = createToolboxConfig(enabledBlocks);

        // 1.5 กำหนดค่า Workspace (Theme, Grid, Zoom)
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
            scrollbars: { horizontal: false, vertical: false },
            drag: true,
            wheel: true,
          },
          sounds: false,
          oneBasedIndex: true,
          // เปิดใช้งาน Variables ถ้ามีบล็อกที่เกี่ยวข้อง
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

        // 1.6 Inject Workspace ลงใน DOM
        const workspace = Blockly.inject(blocklyRef.current, workspaceConfig);
        workspaceRef.current = workspace;

        // อัปเดตสถานะว่าพร้อมแล้ว
        setBlocklyLoaded(true);
        setBlocklyJavaScriptReady(true);

        // 1.7 เตรียมตัวแปรเริ่มต้น (Common Variables)
        ensureCommonVariables(workspace);

        // 1.8 ลงทะเบียน Event Handlers (ดักจับการเปลี่ยนแปลง)
        registerProcedureEventHandlers(workspace);
        registerVariableEventHandlers(workspace);

        // 1.9 เริ่มเกม Phaser
        initPhaserGame();

      } catch (error) {
        console.error("Error initializing workspace:", error);
      }
    }, 100);
  };

  // ============================================================================
  // [Flow A] Initialization: 3. โหลด Starter XML (Load Code)
  // ส่วนจัดการ Starter XML (โหลดโค้ดเริ่มต้น)
  // ============================================================================

  // ใช้ Ref ป้องกันการโหลดซ้ำ XML เดิม
  const lastLoadedXmlRef = React.useRef(null);

  useEffect(() => {
    // ถ้า Workspace ยังไม่พร้อม -> รอไปก่อน
    if (!workspaceRef.current) return;

    // ถ้า XML ตัวนี้โหลดไปแล้ว -> ไม่ต้องโหลดซ้ำ
    if (lastLoadedXmlRef.current === starter_xml) return;

    if (starter_xml && typeof starter_xml === 'string' && starter_xml.trim()) {
      // รอแป๊บนึงเพื่อให้ Workspace นิ่ง แล้วค่อยโหลด
      setTimeout(() => {
        loadStarterXml(
          workspaceRef.current,
          starter_xml,
          isTextCodeEnabled,
          onCodeGenerated,
          // setCurrentHint
        );
        lastLoadedXmlRef.current = starter_xml; // จำไว้ว่าโหลดแล้ว
      }, 200);
    } else {
      // ถ้าไม่มี XML ให้รีเซ็ตตัวจำ
      if (lastLoadedXmlRef.current !== null) {
        lastLoadedXmlRef.current = null;
      }
    }
  }, [starter_xml, blocklyLoaded]);
  //  }, [starter_xml, blocklyLoaded, setCurrentHint]);

  return { initBlocklyAndPhaser };
}