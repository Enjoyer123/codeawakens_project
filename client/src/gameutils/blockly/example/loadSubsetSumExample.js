// Helper function to load Subset Sum example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Subset Sum Example XML - Backtracking recursive solution
const subsetSumExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Subset Sum Function Definition -->
  <block type="procedures_defreturn" id="subset_sum_function" x="50" y="50">
    <field name="NAME">subsetSum</field>
    <comment pinned="false" h="80" w="200">Backtracking recursive solution for Subset Sum problem. Returns true if there exists a subset that sums to target, false otherwise.</comment>
    <statement name="STACK">
      <!-- Base case: if sum == target_sum, return true -->
      <block type="controls_if" id="base_case_sum_equals_target">
        <value name="IF0">
          <block type="logic_compare" id="sum_equals_target">
            <value name="A">
              <block type="variables_get" id="sum_var_base">
                <field name="VAR">sum</field>
              </block>
            </value>
            <field name="OP">EQ</field>
            <value name="B">
              <block type="variables_get" id="target_var_base">
                <field name="VAR">target_sum</field>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="procedures_return" id="return_true">
            <value name="VALUE">
              <block type="logic_boolean" id="true_value">
                <field name="BOOL">TRUE</field>
              </block>
            </value>
          </block>
        </statement>
        <next>
          <!-- Base case: if index >= arr.length, return false -->
          <block type="controls_if" id="base_case_index_out_of_bounds">
            <value name="IF0">
              <block type="logic_compare" id="index_gte_length">
                <value name="A">
                  <block type="variables_get" id="index_var_base">
                    <field name="VAR">index</field>
                  </block>
                </value>
                <field name="OP">GTE</field>
                <value name="B">
                  <block type="lists_length" id="arr_length">
                    <value name="VALUE">
                      <block type="variables_get" id="arr_var_base">
                        <field name="VAR">arr</field>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="procedures_return" id="return_false">
                <value name="VALUE">
                  <block type="logic_boolean" id="false_value">
                    <field name="BOOL">FALSE</field>
                  </block>
                </value>
              </block>
            </statement>
            <next>
              <!-- Try including current item: add warrior to side1, then check if subsetSum returns true -->
              <!-- Add warrior to side1 (visual feedback) BEFORE recursive call -->
              <block type="subset_sum_add_warrior_to_side1" id="add_warrior_side1">
                <value name="WARRIOR_INDEX">
                  <block type="variables_get" id="index_var_visual">
                    <field name="VAR">index</field>
                  </block>
                </value>
                <next>
                  <!-- if subsetSum(arr, index+1, sum + arr[index], target_sum), return true -->
                  <block type="controls_if" id="try_include_item">
                    <value name="IF0">
                  <block type="procedures_callreturn" id="call_include">
                    <mutation name="subsetSum">
                      <arg name="arr"></arg>
                      <arg name="index"></arg>
                      <arg name="sum"></arg>
                      <arg name="target_sum"></arg>
                    </mutation>
                    <field name="NAME">subsetSum</field>
                    <value name="ARG0">
                      <block type="variables_get" id="arr_var_include">
                        <field name="VAR">arr</field>
                      </block>
                    </value>
                    <value name="ARG1">
                      <block type="math_arithmetic" id="index_plus_one_include">
                        <value name="A">
                          <block type="variables_get" id="index_var_include">
                            <field name="VAR">index</field>
                          </block>
                        </value>
                        <field name="OP">ADD</field>
                        <value name="B">
                          <block type="math_number" id="one_include">
                            <field name="NUM">1</field>
                          </block>
                        </value>
                      </block>
                    </value>
                    <value name="ARG2">
                      <block type="math_arithmetic" id="sum_plus_arr_index">
                        <value name="A">
                          <block type="variables_get" id="sum_var_include">
                            <field name="VAR">sum</field>
                          </block>
                        </value>
                        <field name="OP">ADD</field>
                        <value name="B">
                          <block type="lists_get_at_index" id="get_arr_index_include">
                            <value name="LIST">
                              <block type="variables_get" id="arr_var_get_include">
                                <field name="VAR">arr</field>
                              </block>
                            </value>
                            <value name="INDEX">
                              <block type="variables_get" id="index_var_get_include">
                                <field name="VAR">index</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <value name="ARG3">
                      <block type="variables_get" id="target_var_include">
                        <field name="VAR">target_sum</field>
                      </block>
                    </value>
                  </block>
                    </value>
                    <statement name="DO0">
                      <block type="procedures_return" id="return_true_include">
                        <value name="VALUE">
                          <block type="logic_boolean" id="true_value_include">
                            <field name="BOOL">TRUE</field>
                          </block>
                        </value>
                      </block>
                    </statement>
                  </block>
                  <next>
                  <!-- Try excluding current item: add warrior to side2, then return subsetSum(arr, index+1, sum, target_sum) -->
                  <!-- Add warrior to side2 (visual feedback) BEFORE recursive call when excluding -->
                  <block type="subset_sum_add_warrior_to_side2" id="add_warrior_side2">
                    <value name="WARRIOR_INDEX">
                      <block type="variables_get" id="index_var_visual_exclude">
                        <field name="VAR">index</field>
                      </block>
                    </value>
                    <next>
                      <!-- return subsetSum(arr, index+1, sum, target_sum) -->
                      <block type="procedures_return" id="return_exclude">
                        <value name="VALUE">
                          <block type="procedures_callreturn" id="call_exclude">
                        <mutation name="subsetSum">
                          <arg name="arr"></arg>
                          <arg name="index"></arg>
                          <arg name="sum"></arg>
                          <arg name="target_sum"></arg>
                        </mutation>
                        <field name="NAME">subsetSum</field>
                        <value name="ARG0">
                          <block type="variables_get" id="arr_var_exclude">
                            <field name="VAR">arr</field>
                          </block>
                        </value>
                        <value name="ARG1">
                          <block type="math_arithmetic" id="index_plus_one_exclude">
                            <value name="A">
                              <block type="variables_get" id="index_var_exclude">
                                <field name="VAR">index</field>
                              </block>
                            </value>
                            <field name="OP">ADD</field>
                            <value name="B">
                              <block type="math_number" id="one_exclude">
                                <field name="NUM">1</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <value name="ARG2">
                          <block type="variables_get" id="sum_var_exclude">
                            <field name="VAR">sum</field>
                          </block>
                        </value>
                        <value name="ARG3">
                          <block type="variables_get" id="target_var_exclude">
                            <field name="VAR">target_sum</field>
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
    </statement>
  </block>
  
  <!-- Main code: result = subsetSum(warriors, 0, 0, target_sum) -->
  <block type="variables_set" id="main_result_set" x="50" y="600">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="subsetSum">
          <arg name="arr"></arg>
          <arg name="index"></arg>
          <arg name="sum"></arg>
          <arg name="target_sum"></arg>
        </mutation>
        <field name="NAME">subsetSum</field>
        <value name="ARG0">
          <block type="variables_get" id="warriors_var">
            <field name="VAR">warriors</field>
          </block>
        </value>
        <value name="ARG1">
          <block type="math_number" id="zero_index">
            <field name="NUM">0</field>
          </block>
        </value>
        <value name="ARG2">
          <block type="math_number" id="zero_sum">
            <field name="NUM">0</field>
          </block>
        </value>
        <value name="ARG3">
          <block type="variables_get" id="target_sum_var">
            <field name="VAR">target_sum</field>
          </block>
        </value>
      </block>
    </value>
  </block>
</xml>`;

/**
 * Load Subset Sum example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace to load blocks into
 */
export function loadSubsetSumExampleBlocks(workspace) {
  if (!workspace) {
    console.error('❌ Cannot load Subset Sum example: workspace is null');
    return;
  }

  try {
    // console.log removed('📦 Loading Subset Sum example blocks...');

    // Parse XML
    const xml = Blockly.utils.xml.textToDom(subsetSumExampleXml);

    // Ensure necessary variables exist
    const variableNames = ['arr', 'index', 'sum', 'target_sum', 'warriors', 'result'];
    variableNames.forEach(varName => {
      if (!workspace.getVariable(varName)) {
        workspace.createVariable(varName);
      }
    });

    // Load blocks into workspace
    Blockly.Xml.domToWorkspace(xml, workspace);

    // console.log removed('✅ Subset Sum example blocks loaded successfully');
  } catch (error) {
    console.error('❌ Error loading Subset Sum example blocks:', error);
    alert(`เกิดข้อผิดพลาดในการโหลด Subset Sum example blocks: ${error.message}`);
  }
}

