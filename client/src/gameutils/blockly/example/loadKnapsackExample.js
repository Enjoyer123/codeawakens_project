import * as Blockly from "blockly/core";

const knapsackExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="knapsack_bt" x="50" y="50">
    <mutation>
      <arg name="w"></arg>
      <arg name="v"></arg>
      <arg name="i"></arg>
      <arg name="j"></arg>
    </mutation>
    <field name="NAME">knapsack</field>
    <comment pinned="false" h="80" w="200">Knapsack Backtracking with Trace</comment>
    <statement name="STACK">
      <block type="knapsack_consider_item">
        <value name="ITEM_INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
        <next>
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_operation">
                <field name="OP">OR</field>
                <value name="A">
                  <block type="logic_compare">
                    <field name="OP">LT</field>
                    <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                    <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
                  </block>
                </value>
                <value name="B">
                  <block type="logic_compare">
                    <field name="OP">LTE</field>
                    <value name="A"><block type="variables_get"><field name="VAR">j</field></block></value>
                    <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="procedures_return">
                <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </statement>
            <next>
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A">
                      <block type="lists_get_at_index">
                        <value name="LIST"><block type="variables_get"><field name="VAR">w</field></block></value>
                        <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                      </block>
                    </value>
                    <value name="B"><block type="variables_get"><field name="VAR">j</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="procedures_return">
                    <value name="VALUE">
                      <block type="procedures_callreturn">
                        <mutation name="knapsack">
                          <arg name="w"></arg><arg name="v"></arg><arg name="i"></arg><arg name="j"></arg>
                        </mutation>
                        <value name="ARG0"><block type="variables_get"><field name="VAR">w</field></block></value>
                        <value name="ARG1"><block type="variables_get"><field name="VAR">v</field></block></value>
                        <value name="ARG2">
                          <block type="math_arithmetic">
                            <field name="OP">MINUS</field>
                            <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                          </block>
                        </value>
                        <value name="ARG3"><block type="variables_get"><field name="VAR">j</field></block></value>
                      </block>
                    </value>
                  </block>
                </statement>
                <next>
                  <block type="variables_set">
                    <field name="VAR">without_item</field>
                    <value name="VALUE">
                      <block type="procedures_callreturn">
                        <mutation name="knapsack">
                          <arg name="w"></arg><arg name="v"></arg><arg name="i"></arg><arg name="j"></arg>
                        </mutation>
                        <value name="ARG0"><block type="variables_get"><field name="VAR">w</field></block></value>
                        <value name="ARG1"><block type="variables_get"><field name="VAR">v</field></block></value>
                        <value name="ARG2">
                          <block type="math_arithmetic">
                            <field name="OP">MINUS</field>
                            <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                          </block>
                        </value>
                        <value name="ARG3"><block type="variables_get"><field name="VAR">j</field></block></value>
                      </block>
                    </value>
                    <next>
                      <block type="knapsack_pick_item">
                        <value name="ITEM_INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                        <next>
                          <block type="variables_set">
                            <field name="VAR">with_item</field>
                            <value name="VALUE">
                              <block type="math_arithmetic">
                                <field name="OP">ADD</field>
                                <value name="A">
                                  <block type="lists_get_at_index">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">v</field></block></value>
                                    <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                  </block>
                                </value>
                                <value name="B">
                                  <block type="procedures_callreturn">
                                    <mutation name="knapsack">
                                      <arg name="w"></arg><arg name="v"></arg><arg name="i"></arg><arg name="j"></arg>
                                    </mutation>
                                    <value name="ARG0"><block type="variables_get"><field name="VAR">w</field></block></value>
                                    <value name="ARG1"><block type="variables_get"><field name="VAR">v</field></block></value>
                                    <value name="ARG2">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                    <value name="ARG3">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">j</field></block></value>
                                        <value name="B">
                                          <block type="lists_get_at_index">
                                            <value name="LIST"><block type="variables_get"><field name="VAR">w</field></block></value>
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <next>
                              <block type="knapsack_remove_item">
                                <next>
                                  <block type="procedures_return">
                                    <value name="VALUE">
                                      <block type="math_on_list">
                                        <mutation op="MAX"></mutation>
                                        <field name="OP">MAX</field>
                                        <value name="LIST">
                                          <block type="lists_create_with">
                                            <mutation items="2"></mutation>
                                            <value name="ADD0"><block type="variables_get"><field name="VAR">without_item</field></block></value>
                                            <value name="ADD1"><block type="variables_get"><field name="VAR">with_item</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <block type="variables_set" x="50" y="600">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn">
        <mutation name="knapsack">
          <arg name="w"></arg><arg name="v"></arg><arg name="i"></arg><arg name="j"></arg>
        </mutation>
        <value name="ARG0"><block type="variables_get"><field name="VAR">weights</field></block></value>
        <value name="ARG1"><block type="variables_get"><field name="VAR">values</field></block></value>
        <value name="ARG2">
          <block type="math_arithmetic">
            <field name="OP">MINUS</field>
            <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <value name="ARG3"><block type="variables_get"><field name="VAR">capacity</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

const knapsackDpExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="knapsack_dp" x="50" y="50">
    <field name="NAME">knapsackDP</field>
    <statement name="STACK">
      <block type="variables_set">
        <field name="VAR">dp</field>
        <value name="VALUE">
          <block type="lists_create_empty"></block>
        </value>
        <next>
          <!-- Init DP 2D array -->
          <block type="controls_for">
            <field name="VAR">r</field>
            <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
            <value name="TO"><block type="variables_get"><field name="VAR">n</field></block></value>
            <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
            <statement name="DO">
              <block type="variables_set">
                <field name="VAR">rowArr</field>
                <value name="VALUE"><block type="lists_create_empty"></block></value>
                <next>
                  <block type="controls_for">
                    <field name="VAR">c</field>
                    <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                    <value name="TO"><block type="variables_get"><field name="VAR">capacity</field></block></value>
                    <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                    <statement name="DO">
                      <block type="lists_setIndex">
                        <mutation at="true"></mutation>
                        <field name="MODE">SET</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">rowArr</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">c</field></block></value>
                        <value name="TO"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block>
                    </statement>
                    <next>
                      <block type="lists_setIndex">
                        <mutation at="true"></mutation>
                        <field name="MODE">SET</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">r</field></block></value>
                        <value name="TO"><block type="variables_get"><field name="VAR">rowArr</field></block></value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
            <next>
              <!-- DP Logic -->
              <block type="controls_for">
                <field name="VAR">i</field>
                <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
                <value name="TO"><block type="variables_get"><field name="VAR">n</field></block></value>
                <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                <statement name="DO">
                  <block type="knapsack_consider_item">
                    <value name="ITEM_INDEX">
                      <block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                      </block>
                    </value>
                    <next>
                      <block type="variables_set">
                        <field name="VAR">wi</field>
                        <value name="VALUE">
                          <block type="lists_get_at_index">
                            <value name="LIST"><block type="variables_get"><field name="VAR">weights</field></block></value>
                            <value name="INDEX">
                              <block type="math_arithmetic">
                                <field name="OP">MINUS</field>
                                <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                              </block>
                            </value>
                          </block>
                        </value>
                        <next>
                          <block type="variables_set">
                            <field name="VAR">vi</field>
                            <value name="VALUE">
                              <block type="lists_get_at_index">
                                <value name="LIST"><block type="variables_get"><field name="VAR">values</field></block></value>
                                <value name="INDEX">
                                  <block type="math_arithmetic">
                                    <field name="OP">MINUS</field>
                                    <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <next>
                              <block type="controls_for">
                                <field name="VAR">w</field>
                                <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
                                <value name="TO"><block type="variables_get"><field name="VAR">capacity</field></block></value>
                                <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                                <statement name="DO">
                                  <!-- Extract dp[i-1][w] -->
                                  <block type="variables_set">
                                    <field name="VAR">prevRow</field>
                                    <value name="VALUE">
                                      <block type="lists_get_at_index">
                                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                        <value name="INDEX">
                                          <block type="math_arithmetic">
                                            <field name="OP">MINUS</field>
                                            <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                                            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                    <next>
                                      <block type="variables_set">
                                        <field name="VAR">dp_i1_w</field>
                                        <value name="VALUE">
                                          <block type="lists_get_at_index">
                                            <value name="LIST"><block type="variables_get"><field name="VAR">prevRow</field></block></value>
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">w</field></block></value>
                                          </block>
                                        </value>
                                        <next>
                                          <block type="controls_if">
                                            <mutation else="1"></mutation>
                                            <value name="IF0">
                                              <block type="logic_compare">
                                                <field name="OP">LTE</field>
                                                <value name="A"><block type="variables_get"><field name="VAR">wi</field></block></value>
                                                <value name="B"><block type="variables_get"><field name="VAR">w</field></block></value>
                                              </block>
                                            </value>
                                            <!-- DO: dp[i][w] = max(dp[i-1][w], v[i-1] + dp[i-1][w-wi]) -->
                                            <statement name="DO0">
                                              <block type="variables_set">
                                                <field name="VAR">dp_i1_w_wi</field>
                                                <value name="VALUE">
                                                  <block type="lists_get_at_index">
                                                    <value name="LIST"><block type="variables_get"><field name="VAR">prevRow</field></block></value>
                                                    <value name="INDEX">
                                                      <block type="math_arithmetic">
                                                        <field name="OP">MINUS</field>
                                                        <value name="A"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                        <value name="B"><block type="variables_get"><field name="VAR">wi</field></block></value>
                                                      </block>
                                                    </value>
                                                  </block>
                                                </value>
                                                <next>
                                                  <block type="variables_set">
                                                    <field name="VAR">currRow</field>
                                                    <value name="VALUE">
                                                      <block type="lists_get_at_index">
                                                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                                        <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                                      </block>
                                                    </value>
                                                    <next>
                                                      <block type="lists_setIndex">
                                                        <mutation at="true"></mutation>
                                                        <field name="MODE">SET</field>
                                                        <field name="WHERE">FROM_START</field>
                                                        <value name="LIST"><block type="variables_get"><field name="VAR">currRow</field></block></value>
                                                        <value name="AT"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                        <value name="TO">
                                                          <block type="math_on_list">
                                                            <mutation op="MAX"></mutation>
                                                            <field name="OP">MAX</field>
                                                            <value name="LIST">
                                                              <block type="lists_create_with">
                                                                <mutation items="2"></mutation>
                                                                <value name="ADD0"><block type="variables_get"><field name="VAR">dp_i1_w</field></block></value>
                                                                <value name="ADD1">
                                                                  <block type="math_arithmetic">
                                                                    <field name="OP">ADD</field>
                                                                    <value name="A"><block type="variables_get"><field name="VAR">vi</field></block></value>
                                                                    <value name="B"><block type="variables_get"><field name="VAR">dp_i1_w_wi</field></block></value>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                          </block>
                                                        </value>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </statement>
                                            <!-- ELSE: dp[i][w] = dp[i-1][w] -->
                                            <statement name="ELSE">
                                              <block type="variables_set">
                                                <field name="VAR">currRow</field>
                                                <value name="VALUE">
                                                  <block type="lists_get_at_index">
                                                    <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                                    <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                                  </block>
                                                </value>
                                                <next>
                                                  <block type="lists_setIndex">
                                                    <mutation at="true"></mutation>
                                                    <field name="MODE">SET</field>
                                                    <field name="WHERE">FROM_START</field>
                                                    <value name="LIST"><block type="variables_get"><field name="VAR">currRow</field></block></value>
                                                    <value name="AT"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                    <value name="TO"><block type="variables_get"><field name="VAR">dp_i1_w</field></block></value>
                                                  </block>
                                                </next>
                                              </block>
                                            </statement>
                                            <next>
                                              <block type="knapsack_dp_update">
                                                <value name="ITEM_INDEX">
                                                  <block type="math_arithmetic">
                                                    <field name="OP">MINUS</field>
                                                    <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                                                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                                  </block>
                                                </value>
                                                <value name="CAPACITY"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                <value name="VALUE">
                                                  <block type="lists_get_at_index">
                                                    <value name="LIST">
                                                      <block type="lists_get_at_index">
                                                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                                        <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                                      </block>
                                                    </value>
                                                    <value name="INDEX"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                  </block>
                                                </value>
                                              </block>
                                            </next>
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
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="procedures_return">
                    <value name="VALUE">
                      <block type="lists_get_at_index">
                        <value name="LIST">
                          <block type="lists_get_at_index">
                            <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                            <value name="INDEX"><block type="variables_get"><field name="VAR">n</field></block></value>
                          </block>
                        </value>
                        <value name="INDEX"><block type="variables_get"><field name="VAR">capacity</field></block></value>
                      </block>
                    </value>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <block type="variables_set" x="50" y="800">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn">
        <mutation name="knapsackDP"></mutation>
      </block>
    </value>
  </block>
</xml>`;

export function loadKnapsackExampleBlocks(workspace, type = 'BACKTRACK') {
  if (!workspace) return;
  try {
    workspace.clear();
    setTimeout(() => {
      try {
        const xmlToLoad = type === 'DP' ? knapsackDpExampleXml : knapsackExampleXml;
        const xmlDom = Blockly.utils.xml.textToDom(xmlToLoad);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        const varNames = ['w', 'v', 'i', 'j', 'weights', 'values', 'n', 'capacity', 'result', 'without_item', 'with_item', 'dp', 'r', 'c', 'rowArr', 'currRow', 'prevRow', 'wi', 'vi', 'dp_i1_w', 'dp_i1_w_wi'];
        varNames.forEach(v => {
          if (workspace.getVariableMap()) {
            if (!workspace.getVariable(v)) workspace.createVariable(v);
          } else {
            workspace.createVariable(v);
          }
        });
      } catch (error) {
        console.error('Error loading Knapsack example blocks:', error);
      }
    }, 100);
  } catch (error) {
    console.error('Error in loadKnapsackExampleBlocks:', error);
  }
}

export function getKnapsackExampleXml() {
  return knapsackExampleXml;
}

export function getKnapsackDpExampleXml() {
  return knapsackDpExampleXml;
}

