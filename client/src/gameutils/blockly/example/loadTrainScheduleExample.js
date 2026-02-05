// Helper function to load Train Schedule example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Train Schedule Example XML
// Greedy Interval Partitioning:
// 1. Sort trains by start time.
// 2. Maintain list of 'platform_ends' (time when each platform usually becomes free).
// 3. For each train, try to put on existing platform where end_time <= train.start logic.
// 4. Update platform end time.
const trainScheduleExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="trains">trains</variable>
    <variable id="train">train</variable>
    <variable id="platforms">platforms</variable>
    <variable id="j">j</variable>
    <variable id="assigned_index">assigned_index</variable>
    <variable id="platform_count">platform_count</variable>
  </variables>
  <block type="procedures_defreturn" x="50" y="50">
    <mutation>
      <arg name="trains" varid="trains"></arg>
    </mutation>
    <field name="NAME">solve</field>
    <comment pinned="false" h="80" w="160">Describe this function...</comment>
    <statement name="STACK">
      <block type="variables_set">
        <field name="VAR" id="platforms">platforms</field>
        <value name="VALUE">
          <block type="lists_create_with">
            <mutation items="0"></mutation>
          </block>
        </value>
        <next>
          <block type="sort_trains">
            <next>
              <block type="controls_forEach">
                <field name="VAR" id="train">train</field>
                <value name="LIST">
                  <block type="variables_get">
                    <field name="VAR" id="trains">trains</field>
                  </block>
                </value>
                <statement name="DO">
                  <block type="variables_set">
                    <field name="VAR" id="assigned_index">assigned_index</field>
                    <value name="VALUE">
                      <block type="math_number">
                        <field name="NUM">-1</field>
                      </block>
                    </value>
                    <next>
                      <block type="controls_for">
                        <field name="VAR" id="j">j</field>
                        <value name="FROM">
                          <shadow type="math_number">
                            <field name="NUM">1</field>
                          </shadow>
                        </value>
                        <value name="TO">
                          <shadow type="math_number">
                            <field name="NUM">10</field>
                          </shadow>
                          <block type="lists_length">
                            <value name="VALUE">
                              <block type="variables_get">
                                <field name="VAR" id="platforms">platforms</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <value name="BY">
                          <shadow type="math_number">
                            <field name="NUM">1</field>
                          </shadow>
                        </value>
                        <statement name="DO">
                          <block type="controls_if">
                            <value name="IF0">
                              <block type="logic_compare">
                                <field name="OP">LTE</field>
                                <value name="A">
                                  <block type="lists_getIndex">
                                    <mutation statement="false" at="true"></mutation>
                                    <field name="MODE">GET</field>
                                    <field name="WHERE">FROM_START</field>
                                    <value name="VALUE">
                                      <block type="variables_get">
                                        <field name="VAR" id="platforms">platforms</field>
                                      </block>
                                    </value>
                                    <value name="AT">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A">
                                          <shadow type="math_number">
                                            <field name="NUM">1</field>
                                          </shadow>
                                          <block type="variables_get">
                                            <field name="VAR" id="j">j</field>
                                          </block>
                                        </value>
                                        <value name="B">
                                          <shadow type="math_number">
                                            <field name="NUM">1</field>
                                          </shadow>
                                        </value>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <value name="B">
                                  <block type="get_train_value">
                                    <field name="KEY">arrive</field>
                                    <value name="TRAIN">
                                      <block type="variables_get">
                                        <field name="VAR" id="train">train</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="variables_set">
                                <field name="VAR" id="assigned_index">assigned_index</field>
                                <value name="VALUE">
                                  <block type="math_arithmetic">
                                    <field name="OP">MINUS</field>
                                    <value name="A">
                                      <shadow type="math_number">
                                        <field name="NUM">1</field>
                                      </shadow>
                                      <block type="variables_get">
                                        <field name="VAR" id="j">j</field>
                                      </block>
                                    </value>
                                    <value name="B">
                                      <shadow type="math_number">
                                        <field name="NUM">1</field>
                                      </shadow>
                                    </value>
                                  </block>
                                </value>
                                <next>
                                  <block type="controls_flow_statements">
                                    <field name="FLOW">BREAK</field>
                                  </block>
                                </next>
                              </block>
                            </statement>
                          </block>
                        </statement>
                        <next>
                          <block type="controls_if">
                            <mutation else="1"></mutation>
                            <value name="IF0">
                              <block type="logic_compare">
                                <field name="OP">NEQ</field>
                                <value name="A">
                                  <block type="variables_get">
                                    <field name="VAR" id="assigned_index">assigned_index</field>
                                  </block>
                                </value>
                                <value name="B">
                                  <block type="math_number">
                                    <field name="NUM">-1</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="lists_setIndex">
                                <mutation at="true"></mutation>
                                <field name="MODE">SET</field>
                                <field name="WHERE">FROM_START</field>
                                <value name="LIST">
                                  <block type="variables_get">
                                    <field name="VAR" id="platforms">platforms</field>
                                  </block>
                                </value>
                                <value name="AT">
                                  <block type="variables_get">
                                    <field name="VAR" id="assigned_index">assigned_index</field>
                                  </block>
                                </value>
                                <value name="TO">
                                  <block type="get_train_value">
                                    <field name="KEY">depart</field>
                                    <value name="TRAIN">
                                      <block type="variables_get">
                                        <field name="VAR" id="train">train</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <next>
                                  <block type="assign_train_visual">
                                    <value name="TRAIN">
                                      <block type="variables_get">
                                        <field name="VAR" id="train">train</field>
                                      </block>
                                    </value>
                                    <value name="PLATFORM">
                                      <block type="variables_get">
                                        <field name="VAR" id="assigned_index">assigned_index</field>
                                      </block>
                                    </value>
                                  </block>
                                </next>
                              </block>
                            </statement>
                            <statement name="ELSE">
                              <block type="lists_add_item">
                                <value name="LIST">
                                  <block type="variables_get">
                                    <field name="VAR" id="platforms">platforms</field>
                                  </block>
                                </value>
                                <value name="ITEM">
                                  <block type="get_train_value">
                                    <field name="KEY">depart</field>
                                    <value name="TRAIN">
                                      <block type="variables_get">
                                        <field name="VAR" id="train">train</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <next>
                                  <block type="assign_train_visual">
                                    <value name="TRAIN">
                                      <block type="variables_get">
                                        <field name="VAR" id="train">train</field>
                                      </block>
                                    </value>
                                    <value name="PLATFORM">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A">
                                          <shadow type="math_number">
                                            <field name="NUM">1</field>
                                          </shadow>
                                          <block type="lists_length">
                                            <value name="VALUE">
                                              <block type="variables_get">
                                                <field name="VAR" id="platforms">platforms</field>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <value name="B">
                                          <shadow type="math_number">
                                            <field name="NUM">1</field>
                                          </shadow>
                                        </value>
                                      </block>
                                    </value>
                                  </block>
                                </next>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <value name="RETURN">
      <block type="lists_length">
        <value name="VALUE">
          <block type="variables_get">
            <field name="VAR" id="platforms">platforms</field>
          </block>
        </value>
      </block>
    </value>
  </block>
  <block type="variables_set" x="50" y="800">
    <field name="VAR" id="platform_count">platform_count</field>
    <value name="VALUE">
      <block type="procedures_callreturn">
        <mutation name="solve">
          <arg name="trains"></arg>
        </mutation>
        <field name="NAME">solve</field>
        <value name="ARG0">
          <block type="variables_get">
            <field name="VAR" id="trains">trains</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`;

export function loadTrainScheduleExampleBlocks(workspace) {
  if (!workspace) return;
  try {
    workspace.clear();
    const xmlDom = Blockly.utils.xml.textToDom(trainScheduleExampleXml);
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    // Create variables
    const vars = ['trains', 'train', 'platforms', 'j', 'assigned_index'];
    vars.forEach(v => {
      try { workspace.createVariable(v); } catch (e) { }
    });
  } catch (err) {
    console.error("Failed to load Train Schedule blocks", err);
  }
}
