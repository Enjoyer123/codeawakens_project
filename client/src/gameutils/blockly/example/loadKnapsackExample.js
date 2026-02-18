// Helper function to load Knapsack example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Knapsack Example XML - Backtracking recursive solution
const knapsackExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Knapsack Function Definition -->
  <block type="procedures_defreturn" id="knapsack_function" x="50" y="50">
    <field name="NAME">knapsack</field>
    <comment pinned="false" h="80" w="200">Backtracking recursive solution for Knapsack problem. Returns maximum value that can be achieved.</comment>
    <statement name="STACK">
      <!-- Base case: if i < 0 or j <= 0, return 0 -->
      <block type="controls_if" id="base_case">
        <value name="IF0">
          <block type="logic_operation" id="i_or_j_zero">
            <field name="OP">OR</field>
            <value name="A">
              <block type="logic_compare" id="i_less_zero">
                <value name="A">
                  <block type="variables_get" id="i_var_base">
                    <field name="VAR">i</field>
                  </block>
                </value>
                <field name="OP">LT</field>
                <value name="B">
                  <block type="math_number" id="zero_1">
                    <field name="NUM">0</field>
                  </block>
                </value>
              </block>
            </value>
            <value name="B">
              <block type="logic_compare" id="j_less_equal_zero">
                <value name="A">
                  <block type="variables_get" id="j_var_base">
                    <field name="VAR">j</field>
                  </block>
                </value>
                <field name="OP">LTE</field>
                <value name="B">
                  <block type="math_number" id="zero_2">
                    <field name="NUM">0</field>
                  </block>
                </value>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="procedures_return" id="return_zero">
            <value name="VALUE">
              <block type="math_number" id="zero_return">
                <field name="NUM">0</field>
              </block>
            </value>
          </block>
        </statement>
        <next>
          <!-- If weight[i] > j, skip item -->
          <block type="controls_if" id="weight_too_heavy">
            <value name="IF0">
              <block type="logic_compare" id="weight_compare">
                <value name="A">
                  <block type="lists_get_at_index" id="get_weight">
                    <value name="LIST">
                      <block type="variables_get" id="w_var">
                        <field name="VAR">w</field>
                      </block>
                    </value>
                    <value name="INDEX">
                      <block type="variables_get" id="i_var_weight">
                        <field name="VAR">i</field>
                      </block>
                    </value>
                  </block>
                </value>
                <field name="OP">GT</field>
                <value name="B">
                  <block type="variables_get" id="j_var_weight">
                    <field name="VAR">j</field>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <!-- Return knapsack(w, v, i-1, j) -->
              <block type="procedures_return" id="return_skip">
                <value name="VALUE">
                  <block type="procedures_callreturn" id="call_skip">
                    <mutation name="knapsack">
                      <arg name="w"></arg>
                      <arg name="v"></arg>
                      <arg name="i"></arg>
                      <arg name="j"></arg>
                    </mutation>
                    <field name="NAME">knapsack</field>
                    <value name="ARG0">
                      <block type="variables_get" id="w_var_skip">
                        <field name="VAR">w</field>
                      </block>
                    </value>
                    <value name="ARG1">
                      <block type="variables_get" id="v_var_skip">
                        <field name="VAR">v</field>
                      </block>
                    </value>
                    <value name="ARG2">
                      <block type="math_arithmetic" id="i_minus_one_skip">
                        <value name="A">
                          <block type="variables_get" id="i_var_skip">
                            <field name="VAR">i</field>
                          </block>
                        </value>
                        <field name="OP">MINUS</field>
                        <value name="B">
                          <block type="math_number" id="one_skip">
                            <field name="NUM">1</field>
                          </block>
                        </value>
                      </block>
                    </value>
                    <value name="ARG3">
                      <block type="variables_get" id="j_var_skip">
                        <field name="VAR">j</field>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </statement>
            <next>
              <!-- Else: return MAX(knapsack(w, v, i-1, j), v[i] + knapsack(w, v, i-1, j-w[i])) -->
              <block type="procedures_return" id="return_max">
                <value name="VALUE">
                  <block type="math_max" id="max_value">
                    <value name="A">
                      <!-- knapsack(w, v, i-1, j) -->
                      <block type="procedures_callreturn" id="call_without_item">
                        <mutation name="knapsack">
                          <arg name="w"></arg>
                          <arg name="v"></arg>
                          <arg name="i"></arg>
                          <arg name="j"></arg>
                        </mutation>
                        <field name="NAME">knapsack</field>
                        <value name="ARG0">
                          <block type="variables_get" id="w_var_without">
                            <field name="VAR">w</field>
                          </block>
                        </value>
                        <value name="ARG1">
                          <block type="variables_get" id="v_var_without">
                            <field name="VAR">v</field>
                          </block>
                        </value>
                        <value name="ARG2">
                          <block type="math_arithmetic" id="i_minus_one_without">
                            <value name="A">
                              <block type="variables_get" id="i_var_without">
                                <field name="VAR">i</field>
                              </block>
                            </value>
                            <field name="OP">MINUS</field>
                            <value name="B">
                              <block type="math_number" id="one_without">
                                <field name="NUM">1</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <value name="ARG3">
                          <block type="variables_get" id="j_var_without">
                            <field name="VAR">j</field>
                          </block>
                        </value>
                      </block>
                    </value>
                    <value name="B">
                      <!-- v[i] + knapsack(w, v, i-1, j-w[i]) -->
                      <block type="math_arithmetic" id="add_value">
                        <value name="A">
                          <block type="lists_get_at_index" id="get_value">
                            <value name="LIST">
                              <block type="variables_get" id="v_var_add">
                                <field name="VAR">v</field>
                              </block>
                            </value>
                            <value name="INDEX">
                              <block type="variables_get" id="i_var_add">
                                <field name="VAR">i</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <field name="OP">ADD</field>
                        <value name="B">
                          <block type="procedures_callreturn" id="call_with_item">
                            <mutation name="knapsack">
                              <arg name="w"></arg>
                              <arg name="v"></arg>
                              <arg name="i"></arg>
                              <arg name="j"></arg>
                            </mutation>
                            <field name="NAME">knapsack</field>
                            <value name="ARG0">
                              <block type="variables_get" id="w_var_with">
                                <field name="VAR">w</field>
                              </block>
                            </value>
                            <value name="ARG1">
                              <block type="variables_get" id="v_var_with">
                                <field name="VAR">v</field>
                              </block>
                            </value>
                            <value name="ARG2">
                              <block type="math_arithmetic" id="i_minus_one_with">
                                <value name="A">
                                  <block type="variables_get" id="i_var_with">
                                    <field name="VAR">i</field>
                                  </block>
                                </value>
                                <field name="OP">MINUS</field>
                                <value name="B">
                                  <block type="math_number" id="one_with">
                                    <field name="NUM">1</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <value name="ARG3">
                              <block type="math_arithmetic" id="j_minus_weight">
                                <value name="A">
                                  <block type="variables_get" id="j_var_minus">
                                    <field name="VAR">j</field>
                                  </block>
                                </value>
                                <field name="OP">MINUS</field>
                                <value name="B">
                                  <block type="lists_get_at_index" id="get_weight_minus">
                                    <value name="LIST">
                                      <block type="variables_get" id="w_var_minus">
                                        <field name="VAR">w</field>
                                      </block>
                                    </value>
                                    <value name="INDEX">
                                      <block type="variables_get" id="i_var_minus">
                                        <field name="VAR">i</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                              </block>
                            </value>
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
  </block>
  
  <!-- Main code: result = knapsack(weights, values, n-1, capacity) -->
  <!-- Note: You need to define these variables before running:
       - weights: array of weights [weight1, weight2, ...]
       - values: array of values [value1, value2, ...]
       - n: number of items
       - capacity: maximum weight capacity -->
  <block type="variables_set" id="main_result_set" x="50" y="600">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="knapsack">
          <arg name="w"></arg>
          <arg name="v"></arg>
          <arg name="i"></arg>
          <arg name="j"></arg>
        </mutation>
        <field name="NAME">knapsack</field>
        <value name="ARG0">
          <block type="variables_get" id="weights_var">
            <field name="VAR">weights</field>
          </block>
        </value>
        <value name="ARG1">
          <block type="variables_get" id="values_var">
            <field name="VAR">values</field>
          </block>
        </value>
        <value name="ARG2">
          <block type="math_arithmetic" id="n_minus_one">
            <value name="A">
              <block type="variables_get" id="n_var">
                <field name="VAR">n</field>
              </block>
            </value>
            <field name="OP">MINUS</field>
            <value name="B">
              <block type="math_number" id="one_main">
                <field name="NUM">1</field>
              </block>
            </value>
          </block>
        </value>
        <value name="ARG3">
          <block type="variables_get" id="capacity_var">
            <field name="VAR">capacity</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`;

/**
 * Load Knapsack example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace to load blocks into
 */
export function loadKnapsackExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Knapsack example blocks: workspace is null');
    return;
  }

  try {
    // console.log removed('📦 Loading Knapsack example blocks into workspace...');

    // Clear workspace first
    workspace.clear();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(knapsackExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = ['w', 'v', 'i', 'j', 'weights', 'values', 'n', 'capacity', 'result'];
        variableNames.forEach(varName => {
          try {
            // Check if variable already exists
            const variableMap = workspace.getVariableMap();
            if (variableMap) {
              const existingVar = variableMap.getVariable(varName);
              if (!existingVar) {
                workspace.createVariable(varName);
                // console.log removed(`Created variable: ${varName}`);
              } else {
                console.debug(`Variable ${varName} already exists`);
              }
            } else {
              workspace.createVariable(varName);
              // console.log removed(`Created variable: ${varName} (no variable map)`);
            }
          } catch (e) {
            // Variable might already exist
            console.debug(`Variable ${varName} already exists or error creating:`, e);
          }
        });

        // console.log removed('✅ Knapsack example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Knapsack example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Knapsack example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadKnapsackExampleBlocks:', error);
  }
}

/**
 * Get Knapsack example XML as string
 * @returns {string} XML string
 */
export function getKnapsackExampleXml() {
  return knapsackExampleXml;
}

