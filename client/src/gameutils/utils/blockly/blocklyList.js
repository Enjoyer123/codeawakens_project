// Blockly List Block Definitions
import * as Blockly from "blockly/core";

export function defineListBlocks() {
  Blockly.Blocks['lists_create_with'] = {
    init: function() {
      this.setColour(260);
      this.itemCount_ = 3;
      this.updateShape_();
      this.setOutput(true, 'Array');
      // Note: Mutator is not available in Blockly v12+ in the same way
      // We'll use a simpler approach without mutator
      this.setTooltip('สร้างลิสต์ด้วยไอเท็มจำนวนหนึ่ง');
    },
    mutationToDom: function() {
      var container = document.createElement('mutation');
      container.setAttribute('items', this.itemCount_);
      return container;
    },
    domToMutation: function(xmlElement) {
      this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
      this.updateShape_();
    },
    updateShape_: function() {
      if (this.itemCount_ && this.getInput('EMPTY')) {
        this.removeInput('EMPTY');
      } else if (!this.itemCount_ && !this.getInput('EMPTY')) {
        this.appendDummyInput('EMPTY')
            .appendField('สร้างลิสต์ว่าง');
      }
      for (var i = 0; i < this.itemCount_; i++) {
        if (!this.getInput('ADD' + i)) {
          var input = this.appendValueInput('ADD' + i);
          if (i == 0) {
            input.appendField('สร้างลิสต์ด้วย');
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
    init: function() {
      this.setColour(260);
      this.appendDummyInput().appendField('ลิสต์');
      this.appendStatementInput('STACK');
      this.setTooltip('เพิ่ม, ลบ, หรือจัดเรียงไอเท็ม');
      this.contextMenu = false;
    }
  };

  Blockly.Blocks['lists_create_with_item'] = {
    init: function() {
      this.setColour(260);
      this.appendDummyInput().appendField('ไอเท็ม');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('เพิ่มไอเท็ม');
      this.contextMenu = false;
    }
  };

  // List isEmpty block - override to fix message format issues
  // Blockly's standard lists_isEmpty may have JSON format problems
  Blockly.Blocks['lists_isEmpty'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('ลิสต์');
      this.appendValueInput('VALUE')
        .setCheck('Array');
      this.appendDummyInput()
        .appendField('ว่างหรือไม่');
      this.setOutput(true, 'Boolean');
      this.setColour(260);
      this.setTooltip('เช็คว่า list ว่างหรือไม่');
    }
  };
}

