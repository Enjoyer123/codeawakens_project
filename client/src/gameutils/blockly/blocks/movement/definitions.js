// Blockly Movement Block Definitions
import * as Blockly from "blockly/core";

export function defineMovementBlocks() {
  Blockly.Blocks["move_forward"] = {
    init: function () {
      this.appendDummyInput().appendField("Move Forward");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("เดินไปข้างหน้า 1 ช่อง (ตามทิศทางที่หัน)");
    },
  };

  Blockly.Blocks["turn_left"] = {
    init: function () {
      this.appendDummyInput().appendField("Turn Left");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("หันไปทางซ้าย");
    },
  };

  Blockly.Blocks["turn_right"] = {
    init: function () {
      this.appendDummyInput().appendField("Turn Right");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks'); // Green (Stamina)
      this.setTooltip("หันไปทางขวา");
    },
  };

  Blockly.Blocks["hit"] = {
    init: function () {
      this.appendDummyInput().appendField("Attack");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks'); // Red (Attack/HP)
      this.setTooltip("โจมตี Monster ในระยะ");
    },
  };

  Blockly.Blocks["cast_spell"] = {
    init: function () {
      this.appendDummyInput().appendField("Cast Spell");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks'); // Red (Attack/HP)
      this.setTooltip("ร่ายเวทมนตร์");
    },
  };

  Blockly.Blocks["move_to_node"] = {
    init: function () {
      this.appendValueInput("NODE_ID")
        .setCheck("Number")
        .appendField("Go to Node");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
      this.setTooltip("เดินไปที่ node ที่กำหนดs");
    },
  };

  // Move along path (for DFS)
  Blockly.Blocks["move_along_path"] = {
    init: function () {
      this.appendValueInput("PATH")
        .setCheck("Array")
        .appendField("Follow Path");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
      this.setTooltip("เดินตาม path ที่กำหนด (list of nodes)");
    },
  };

  Blockly.Blocks["say"] = {
    init: function () {
      this.appendDummyInput().appendField("Say").appendField(new Blockly.FieldTextInput("Hello!"), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks');
      this.setTooltip("พูดข้อความ");
    },
  };

  Blockly.Blocks["Defend"] = {
    init: function () {
      this.appendDummyInput().appendField("Defend");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('combat_blocks'); // แดง #E53935 — ดูสีได้ที่ GoogleDocsTheme
      this.setTooltip("ยกโล่ป้องกัน");
    },
  };

  // ── [สำรอง] Dash — วิ่ง 2 ช่อง ──
  // Blockly.Blocks["dash"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Dash");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('loop_blocks');
  //     this.setTooltip("วิ่งไปข้างหน้า 2 ช่อง");
  //   },
  // };

  // ── [สำรอง] Spin — หมุนตัว ──
  Blockly.Blocks["spin"] = {
    init: function () {
      this.appendDummyInput().appendField("Spin");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks');
      this.setTooltip("หมุนตัว 360 องศา");
    },
  };

  // ── [สำรอง] Heal — ฮีล HP ──
  Blockly.Blocks["heal"] = {
    init: function () {
      this.appendDummyInput().appendField("Heal");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('hat_blocks');
      this.setTooltip("เติม HP +20");
    },
  };

  // ── [สำรอง] Teleport — วาร์ปไป Node ──
  Blockly.Blocks["teleport"] = {
    init: function () {
      this.appendValueInput("NODE_ID")
        .setCheck("Number")
        .appendField("Teleport to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setStyle('loop_blocks');
      this.setTooltip("วาร์ปไปยัง Node ที่กำหนด");
    },
  };

  // ── [สำรอง] Wait — รอ N วินาที ──
  // Blockly.Blocks["wait"] = {
  //   init: function () {
  //     this.appendDummyInput()
  //       .appendField("Wait")
  //       .appendField(new Blockly.FieldNumber(1, 0.5, 5, 0.5), "SECONDS")
  //       .appendField("sec");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('loop_blocks');
  //     this.setTooltip("รอเวลาตามที่กำหนด");
  //   },
  // };

  // ── [สำรอง] Dodge — หลบ (ขยับข้างแล้วกลับ) ──
  // Blockly.Blocks["dodge"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Dodge");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('loop_blocks');
  //     this.setTooltip("หลบการโจมตี");
  //   },
  // };

  // ── [สำรอง] Shield — กันดาเมจ 1 ครั้ง ──
  // Blockly.Blocks["shield"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Shield");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('combat_blocks');
  //     this.setTooltip("กันดาเมจ 1 ครั้ง");
  //   },
  // };

  // ── [สำรอง] MoveBackward — เดินถอยหลัง (น่าโดนถามมาก!) ──
  // Blockly.Blocks["move_backward"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Move Backward");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('loop_blocks');
  //     this.setTooltip("เดินถอยหลัง 1 ช่อง");
  //   },
  // };

  // ── [สำรอง] DoubleHit — ตี 2 ครั้ง (Combo) ──
  // Blockly.Blocks["double_hit"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("Double Hit");
  //     this.setPreviousStatement(true, null);
  //     this.setNextStatement(true, null);
  //     this.setStyle('hat_blocks');
  //     this.setTooltip("โจมตี 2 ครั้งติด");
  //   },
  // };

  // ── [สำรอง] CheckHP — เช็ค HP ตัวเอง (Sensor! ⚠️ บล็อกคืนค่า ไม่ใช่ action) ──
  // Blockly.Blocks["check_hp"] = {
  //   init: function () {
  //     this.appendDummyInput().appendField("My HP");
  //     this.setOutput(true, "Number");   // ← คืนค่าตัวเลข ไม่ใช่ statement!
  //     this.setStyle('hat_blocks');
  //     this.setTooltip("คืนค่า HP ปัจจุบันของผู้เล่น");
  //   },
  // };

}
