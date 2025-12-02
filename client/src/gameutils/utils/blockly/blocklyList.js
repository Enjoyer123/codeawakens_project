// Blockly List Block Definitions
import * as Blockly from "blockly/core";

export function defineListBlocks() {
  Blockly.Blocks['lists_create_with'] = {
    init: function() {
      this.setColour(260);
      this.itemCount_ = 3;
      this.updateShape_();
      this.setOutput(true, 'Array');
      this.setMutator(new Blockly.Mutator(['lists_create_with_item']));
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
    decompose: function(workspace) {
      var containerBlock = workspace.newBlock('lists_create_with_container');
      containerBlock.initSvg();
      var connection = containerBlock.getInput('STACK').connection;
      for (var i = 0; i < this.itemCount_; i++) {
        var itemBlock = workspace.newBlock('lists_create_with_item');
        itemBlock.initSvg();
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
      }
      return containerBlock;
    },
    compose: function(containerBlock) {
      var itemBlock = containerBlock.getInputTargetBlock('STACK');
      var connections = [];
      while (itemBlock) {
        connections.push(itemBlock.valueConnection_);
        itemBlock = itemBlock.nextConnection &&
            itemBlock.nextConnection.targetBlock();
      }
      for (var i = 0; i < this.itemCount_; i++) {
        var connection = this.getInput('ADD' + i).connection.targetConnection;
        if (connection && connections.indexOf(connection) == -1) {
          connection.disconnect();
        }
      }
      this.itemCount_ = connections.length;
      this.updateShape_();
      for (var i = 0; i < this.itemCount_; i++) {
        Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
      }
    },
    saveConnections: function(containerBlock) {
      var itemBlock = containerBlock.getInputTargetBlock('STACK');
      var i = 0;
      while (itemBlock) {
        var input = this.getInput('ADD' + i);
        itemBlock.valueConnection_ = input && input.connection.targetConnection;
        i++;
        itemBlock = itemBlock.nextConnection &&
            itemBlock.nextConnection.targetBlock();
      }
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
}

