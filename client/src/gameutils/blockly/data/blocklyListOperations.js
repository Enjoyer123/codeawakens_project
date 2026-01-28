// Blockly List Operations Block Definitions (for DFS/BFS)
import * as Blockly from "blockly/core";
import { ensureVariableExists } from "./blocklyVariable";

export function defineListOperationsBlocks() {
  // Add item to list
  Blockly.Blocks["lists_add_item"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📝 เพิ่ม");
      this.appendValueInput("ITEM")
        .setCheck(null)
        .appendField("เข้า");
      this.appendDummyInput()
        .appendField("ลิสต์");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("เพิ่ม item เข้า list (push)");
    },
  };

  // Remove last from list (pop) - statement version
  Blockly.Blocks["lists_remove_last"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("🗑️ ลบตัวสุดท้ายจาก");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ลบ item สุดท้ายออกจาก list (pop)");
    },
  };

  // Remove last from list and return value (for DFS)
  Blockly.Blocks["lists_remove_last_return"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📤 ดึงและลบตัวสุดท้ายจาก");
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip("ดึง item สุดท้ายออกจาก list และลบออก (pop with return)");
    },
  };

  // Get last item from list
  Blockly.Blocks["lists_get_last"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📖 ดึงตัวสุดท้ายจาก");
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip("ดึง item สุดท้ายจาก list");
    },
  };

  // Remove first from list and return value (for BFS - queue)
  Blockly.Blocks["lists_remove_first_return"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📤 ดึงและลบตัวแรกจาก");
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip("ดึง item แรกออกจาก list และลบออก (shift with return - สำหรับ queue)");
    },
  };

  // Get first item from list
  Blockly.Blocks["lists_get_first"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📖 ดึงตัวแรกจาก");
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip("ดึง item แรกจาก list");
    },
  };

  // Check if item is in list
  Blockly.Blocks["lists_contains"] = {
    init: function () {
      this.appendValueInput("ITEM")
        .setCheck(null)
        .appendField("🔍 มี");
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("อยู่ใน");
      this.setOutput(true, "Boolean");
      this.setColour(260);
      this.setTooltip("เช็คว่า item อยู่ใน list หรือไม่");
    },
  };

  // Concatenate lists
  Blockly.Blocks["lists_concat"] = {
    init: function () {
      this.appendValueInput("LIST1")
        .setCheck("Array")
        .appendField("🔗 รวม");
      this.appendValueInput("LIST2")
        .setCheck("Array")
        .appendField("กับ");
      this.setOutput(true, "Array");
      this.setColour(260);
      this.setTooltip("รวม list สองตัวเข้าด้วยกัน");
    },
  };

  // For each item in list (for DFS - iterate through neighbors)
  Blockly.Blocks["for_each_in_list"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("🔄 สำหรับแต่ละ")
        .appendField(new Blockly.FieldVariable("item"), "VAR")
        .appendField("ใน");
      this.appendValueInput("LIST")
        .setCheck("Array");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("ทำ");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("วนลูปผ่านแต่ละ item ใน list");

      this.setOnChange(function (event) {
        if (!event || !this.workspace) return;

        // Don't create variables when block is in flyout (toolbox)
        if (this.isInFlyout) {
          return;
        }

        if (event.type === Blockly.Events.BLOCK_CREATE && event.blockId === this.id) {
          // เมื่อบล็อกถูกสร้าง ให้ตรวจสอบและสร้างตัวแปร (ถ้ายังไม่มี)
          setTimeout(() => {
            ensureVariableExists(this, 'VAR', 'item');
          }, 10);
        } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
          // เมื่อตัวแปรในบล็อกเปลี่ยน ให้ตรวจสอบและสร้างตัวแปรใหม่ (ถ้ายังไม่มี)
          if (event.element === 'field' && event.name === 'VAR') {
            const newValue = event.newValue || 'item';
            ensureVariableExists(this, 'VAR', newValue);
          }
        }
      });
    },
  };

  // Find index of minimum value in list (for Priority Queue)
  Blockly.Blocks["lists_find_min_index"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("🔍 หา index ของค่าน้อยที่สุดใน");
      this.appendValueInput("EXCLUDE")
        .setCheck("Array")

        .appendField("ยกเว้น (Boolean Array)");
      this.appendDummyInput()
        .appendField("(สำหรับ Priority Queue)");
      this.setOutput(true, "Number");
      this.setColour(260);
      this.setTooltip("หา index ของ item ที่มีค่าน้อยที่สุดใน list (สำหรับ Priority Queue)");
    },
  };

  // Find index of maximum value in list (for Max-Capacity Priority Queue)
  Blockly.Blocks["lists_find_max_index"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("🔍 หา index ของค่ามากที่สุดใน");
      this.appendValueInput("EXCLUDE")
        .setCheck("Array")

        .appendField("ยกเว้น (Boolean Array)");
      this.appendDummyInput()
        .appendField("(สำหรับ Priority Queue)");
      this.setOutput(true, "Number");
      this.setColour(260);
      this.setTooltip("หา index ของ item ที่มีค่ามากที่สุดใน list (สำหรับ Max-Capacity Priority Queue)");
    },
  };

  // Get item at index (simplified array access)
  Blockly.Blocks["lists_get_at_index"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📖 ดึง item ที่ index");
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("จาก");
      this.setOutput(true, null);
      this.setColour(260);
      this.setTooltip("ดึง item จาก list ที่ index ที่กำหนด");
    },
  };

  // Remove item at index
  Blockly.Blocks["lists_remove_at_index"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("🗑️ ลบ item ที่ index");
      this.appendValueInput("INDEX")
        .setCheck("Number")
        .appendField("จาก");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setTooltip("ลบ item จาก list ที่ index ที่กำหนด");
    },
  };

  // Sort list by weight (for Kruskal - sort edges by weight)
  Blockly.Blocks["lists_sort_by_weight"] = {
    init: function () {
      this.appendValueInput("LIST")
        .setCheck("Array")
        .appendField("📊 เรียง");
      this.appendDummyInput()
        .appendField("ตาม weight (น้อยไปมาก)");
      this.setOutput(true, "Array");
      this.setColour(260);
      this.setTooltip("เรียง list ของ edges ตาม weight จากน้อยไปมาก (สำหรับ Kruskal)");
    },
  };
}