// Blockly List Block Definitions
import * as Blockly from "blockly/core";

export function defineListBlocks() {
  Blockly.Blocks['lists_create_with'] = {
    init: function () {
      this.setColour(260);
      this.itemCount_ = 1; // เปลี่ยนจาก 3 เป็น 1 เพื่อให้ตรงกับ pattern ที่รับค่าเดียว
      this.updateShape_();
      this.setOutput(true, 'Array');
      // Note: Mutator is not available in Blockly v12+ in the same way
      // We'll use a simpler approach without mutator
      this.setTooltip('สร้างลิสต์ด้วยไอเท็มจำนวนหนึ่ง');
    },
    mutationToDom: function () {
      var container = document.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    domToMutation: function (xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    },
    updateShape_: function () {
      if (this.itemCount_ && this.getInput('EMPTY')) {
        this.removeInput('EMPTY');
      } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
        this.appendDummyInput('EMPTY')
          .appendField('create empty list');
      }
      for (var i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          var input = this.appendValueInput('ADD' + i);
          if (i == 0) {
            input.appendField('create list with');
          }
        }
      }
      while (this.getInput('ADD' + i)) {
        this.removeInput('ADD' + i);
        i++;
      }
    }
  };

  Blockly.Blocks['lists_create_with_container'] = {
    init: function () {
      this.setColour(260);
      this.appendDummyInput().appendField('list');
      this.appendStatementInput('STACK');
      this.setTooltip('เพิ่ม, ลบ, หรือจัดเรียงไอเท็ม');
      this.contextMenu = false;
    }
  };

  Blockly.Blocks['lists_create_with_item'] = {
    init: function () {
      this.setColour(260);
      this.appendDummyInput().appendField('item');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('เพิ่มไอเท็ม');
      this.contextMenu = false;
    }
  };

  // List isEmpty block - override to fix message format issues
  // Blockly's standard lists_isEmpty may have JSON format problems
  Blockly.Blocks['lists_isEmpty'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('list');
      this.appendValueInput('VALUE')
        .setCheck('Array');
      this.appendDummyInput()
        .appendField('is empty');
      this.setOutput(true, 'Boolean');
      this.setColour(260);
      this.setTooltip('เช็คว่า list ว่างหรือไม่');
    }
  };

  // List length block - override to fix message format issues
  // Blockly's standard lists_length may have JSON format problems
  Blockly.Blocks['lists_length'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('length of');
      this.appendValueInput('VALUE')
        .setCheck('Array');
      this.appendDummyInput()
        .appendField('list');
      this.setOutput(true, 'Number');
      this.setColour(260);
      this.setTooltip('นับจำนวน items ใน list');
    }
  };

  // Create empty list block - dedicated block for creating empty lists
  Blockly.Blocks['lists_create_empty'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('create empty list');
      this.setOutput(true, 'Array');
      this.setColour(260);
      this.setTooltip('สร้างลิสต์ว่าง (ไม่มี items)');
    }
  };
}

