/**
 * Hook for Blockly workspace initialization
 * จัดการการเตรียม Workspace ของ Blockly และเชื่อมต่อกับ Phaser
 */

// Import Modules ที่แยกออกมา (Decoupled Modules)
import { loadStarterXml } from './xmlLoader';
import { useSharedBlockly } from '../../../../gameutils/blockly/hooks/useSharedBlockly';

/**
 * Custom Hook: useBlocklySetup
 * [Flow A] Initialization: Hook สำหรับจัดการ Setup ทั้งหมด
 * หน้าที่: สร้างและตั้งค่า Blockly Workspace
 */
export function useBlocklySetup({
  blocklyRef,                  // DOM Element ที่จะใส่ Blockly
  workspaceRef,                // Ref สำหรับเก็บตัวแปร Workspace
  enabledBlocks,               // รายชื่อบล็อกที่อนุญาตให้ใช้ในด่านนี้
  setBlocklyLoaded,            // State บอกว่าโหลดเสร็จหรือยัง
  initPhaserGame,              // ฟังก์ชันเริ่มเกม Phaser
  starter_xml = null,          // โค้ดเริ่มต้น (XML String)
  blocklyLoaded = false,       // สถานะปัจจุบัน
  isTextCodeEnabled = false,   // โหมดพิมพ์โค้ดเอง?
  onCodeGenerated = null       // Callback เมื่อโค้ดเปลี่ยน
}) {

  // ดึง initBlockly จาก Shared Hook (autoInject = false เพื่อให้เราคุมจังหวะโหลดเอง)
  const { initBlockly } = useSharedBlockly({
    blocklyRef,
    workspaceRef,
    enabledBlocks,
    readOnly: false,
    autoInject: false,
  });

  // ============================================================================
  // [Flow A] Initialization: 2. สร้าง Workspace (Main Logic)
  // ฟังก์ชันหลัก: สร้าง Workspace และเริ่มระบบ
  // ============================================================================
  const initBlocklyAndPhaser = () => {
    if (!blocklyRef.current || Object.keys(enabledBlocks).length === 0) {
      return;
    }

    try {
      // 1. สร้าง Workspace จาก Shared Hook
      const workspace = initBlockly();

      if (!workspace) return;

      // 2. อัปเดตสถานะว่าพร้อมแล้ว (ให้ GameCore.jsx รู้)
      setBlocklyLoaded(true);

      // 4. เริ่มเกม Phaser ทันทีเพื่อให้หน้าจอไม่มืดดำตอนกำลัง Parse XML ของ 3 ด่านหิน!
      initPhaserGame();

      // 5. ปล่อยให้ Blockly โหลดบล็อก (ซึ่งกิน CPU มาก) หลังจาก Phaser เริ่มวาดจอโหลดไปแล้ว 50ms
      if (starter_xml && typeof starter_xml === 'string' && starter_xml.trim()) {
        setTimeout(() => {
          try {
            if (workspace) {
               loadStarterXml(workspace, starter_xml, isTextCodeEnabled, onCodeGenerated);
            }
          } catch(e) {}
        }, 50);
      }

    } catch (error) {
      console.error("Error initializing workspace:", error);
    }
  };

  return { initBlocklyAndPhaser };
}