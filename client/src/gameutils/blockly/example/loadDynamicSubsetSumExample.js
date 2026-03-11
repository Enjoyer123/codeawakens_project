import * as Blockly from "blockly/core";

export const dynamicSubsetSumExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="subset_sum_dp_function" x="40" y="40">
    <field name="NAME">subsetSum</field>
    <mutation>
      <arg name="arr"></arg>
      <arg name="index"></arg>
      <arg name="sum"></arg>
      <arg name="target_sum"></arg>
    </mutation>
    <comment pinned="false" h="90" w="360">2D DP approach: dp[i][j] = boolean</comment>
    <statement name="STACK">
      <!-- n = arr.length -->
      <block type="variables_set" id="dp_set_n">
        <field name="VAR">n</field>
        <value name="VALUE">
          <block type="lists_length">
            <value name="VALUE"><block type="variables_get"><field name="VAR">arr</field></block></value>
          </block>
        </value>
        <next>
          <!-- dp = [] -->
          <block type="variables_set" id="dp_set_dp">
            <field name="VAR">dp</field>
            <value name="VALUE"><block type="lists_create_empty"></block></value>
            <next>
              <!-- for i = 0 to n -->
              <block type="for_loop_dynamic" id="dp_loop_i_init">
                <field name="VAR">i</field>
                <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                <value name="TO"><block type="variables_get"><field name="VAR">n</field></block></value>
                <statement name="DO">
                  <!-- row = [] -->
                  <block type="variables_set" id="dp_set_row">
                    <field name="VAR">row</field>
                    <value name="VALUE"><block type="lists_create_empty"></block></value>
                    <next>
                      <!-- for j = 0 to target_sum -->
                      <block type="for_loop_dynamic" id="dp_loop_j_init">
                        <field name="VAR">j</field>
                        <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                        <value name="TO"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
                        <statement name="DO">
                          <!-- row.push(FALSE) -->
                          <block type="lists_add_item">
                            <value name="LIST"><block type="variables_get"><field name="VAR">row</field></block></value>
                            <value name="ITEM"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
                          </block>
                        </statement>
                        <next>
                          <!-- dp.push(row) -->
                          <block type="lists_add_item">
                            <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                            <value name="ITEM"><block type="variables_get"><field name="VAR">row</field></block></value>
                            <next>
                              <!-- dp[i][0] = TRUE -->
                              <block type="lists_setIndex">
                                <field name="MODE">SET</field>
                                <field name="WHERE">FROM_START</field>
                                <value name="LIST">
                                  <block type="lists_get_at_index">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                    <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                  </block>
                                </value>
                                <value name="AT"><block type="math_number"><field name="NUM">0</field></block></value>
                                <value name="TO"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <!-- MAIN DP LOOP: for i = 1 to n -->
                  <block type="for_loop_dynamic" id="dp_loop_i_main">
                    <field name="VAR">i</field>
                    <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
                    <value name="TO"><block type="variables_get"><field name="VAR">n</field></block></value>
                    <statement name="DO">
                      <!-- val = arr[i - 1] -->
                      <block type="variables_set" id="dp_set_val">
                        <field name="VAR">val</field>
                        <value name="VALUE">
                          <block type="lists_get_at_index">
                            <value name="LIST"><block type="variables_get"><field name="VAR">arr</field></block></value>
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
                          <!-- for j = 1 to target_sum -->
                          <block type="for_loop_dynamic" id="dp_loop_j_main">
                            <field name="VAR">j</field>
                            <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
                            <value name="TO"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
                            <statement name="DO">
                              <!-- if val > j -->
                              <block type="controls_if"><mutation else="1"></mutation>
                                <value name="IF0">
                                  <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A"><block type="variables_get"><field name="VAR">val</field></block></value>
                                    <value name="B"><block type="variables_get"><field name="VAR">j</field></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <!-- dp[i][j] = dp[i-1][j] -->
                                  <block type="lists_setIndex">
                                    <field name="MODE">SET</field>
                                    <field name="WHERE">FROM_START</field>
                                    <value name="LIST">
                                      <block type="lists_get_at_index">
                                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                        <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                      </block>
                                    </value>
                                    <value name="AT"><block type="variables_get"><field name="VAR">j</field></block></value>
                                    <value name="TO">
                                      <block type="lists_get_at_index">
                                        <value name="LIST">
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
                                        <value name="INDEX"><block type="variables_get"><field name="VAR">j</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                                <statement name="ELSE">
                                  <!-- dp[i][j] = dp[i-1][j] OR dp[i-1][j-val] -->
                                  <block type="lists_setIndex">
                                    <field name="MODE">SET</field>
                                    <field name="WHERE">FROM_START</field>
                                    <value name="LIST">
                                      <block type="lists_get_at_index">
                                        <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                        <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                      </block>
                                    </value>
                                    <value name="AT"><block type="variables_get"><field name="VAR">j</field></block></value>
                                    <value name="TO">
                                      <block type="logic_operation">
                                        <field name="OP">OR</field>
                                        <value name="A">
                                          <block type="lists_get_at_index">
                                            <value name="LIST">
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
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">j</field></block></value>
                                          </block>
                                        </value>
                                        <value name="B">
                                          <block type="lists_get_at_index">
                                            <value name="LIST">
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
                                            <value name="INDEX">
                                              <block type="math_arithmetic">
                                                <field name="OP">MINUS</field>
                                                <value name="A"><block type="variables_get"><field name="VAR">j</field></block></value>
                                                <value name="B"><block type="variables_get"><field name="VAR">val</field></block></value>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                                <next>
                                  <!-- Trace: subset_sum_dp_update -->
                                  <block type="subset_sum_dp_update">
                                    <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                    <value name="SUM"><block type="variables_get"><field name="VAR">j</field></block></value>
                                    <value name="VALUE">
                                      <block type="lists_get_at_index">
                                        <value name="LIST">
                                          <block type="lists_get_at_index">
                                            <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                          </block>
                                        </value>
                                        <value name="INDEX"><block type="variables_get"><field name="VAR">j</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </next>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </statement>
                    <next>
                      <!-- return dp[n][target_sum] -->
                      <block type="procedures_return">
                        <value name="VALUE">
                          <block type="lists_get_at_index">
                            <value name="LIST">
                              <block type="lists_get_at_index">
                                <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                <value name="INDEX"><block type="variables_get"><field name="VAR">n</field></block></value>
                              </block>
                            </value>
                            <value name="INDEX"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
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
    </statement>
  </block>

  <!-- Main: result = subsetSum(warriors, 0, 0, target_sum) -->
  <block type="variables_set" id="dp_ss_main_result" x="40" y="800">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="dp_ss_call_main">
        <mutation name="subsetSum">
          <arg name="arr"></arg><arg name="index"></arg><arg name="sum"></arg><arg name="target_sum"></arg>
        </mutation>
        <field name="NAME">subsetSum</field>
        <value name="ARG0"><block type="variables_get" id="dp_ss_warriors_get"><field name="VAR">warriors</field></block></value>
        <value name="ARG1"><block type="math_number" id="dp_ss_zero_index"><field name="NUM">0</field></block></value>
        <value name="ARG2"><block type="math_number" id="dp_ss_zero_sum"><field name="NUM">0</field></block></value>
        <value name="ARG3"><block type="variables_get" id="dp_ss_target_get_main"><field name="VAR">target_sum</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

export function loadDynamicSubsetSumExampleBlocks(workspace) {
  if (!workspace) return;
  try {
    if (workspace._starterListener) {
      workspace.removeChangeListener(workspace._starterListener);
      workspace._starterListener = null;
    }
    Blockly.Events.disable();
    workspace.clear();
    Blockly.Events.enable();
    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dynamicSubsetSumExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        ['arr', 'target_sum', 'n', 'dp', 'row', 'i', 'j', 'val', 'index', 'sum', 'result', 'warriors'].forEach(varName => {
          try {
            const variableMap = workspace.getVariableMap();
            if (variableMap && !variableMap.getVariable(varName)) {
              workspace.createVariable(varName);
            }
          } catch (e) { }
        });
      } catch (error) {
        console.error('❌ Error loading Dynamic Subset Sum XML:', error);
      }
    }, 100);
  } catch (error) {
    console.error(error);
  }
}

export function getDynamicSubsetSumExampleXml() {
  return dynamicSubsetSumExampleXml;
}
