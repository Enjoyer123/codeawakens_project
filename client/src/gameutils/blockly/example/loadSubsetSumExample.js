// Helper function to load Subset Sum example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Subset Sum Example XML - Real Backtracking with chosen array (push/pop)
const subsetSumExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Subset Sum Function Definition -->
  <block type="procedures_defreturn" id="subset_sum_function" x="50" y="50">
    <mutation>
      <arg name="arr"></arg>
      <arg name="index"></arg>
      <arg name="currentSum"></arg>
      <arg name="target_sum"></arg>
    </mutation>
    <field name="NAME">subsetSum</field>
    <comment pinned="false" h="80" w="200">Real Backtracking: uses chosen.push/pop for mutable state</comment>
    <statement name="STACK">
      <!-- Consider current item -->
      <block type="subset_sum_consider" id="consider_item">
        <value name="WARRIOR_INDEX">
          <block type="variables_get"><field name="VAR">index</field></block>
        </value>
        <next>
          <!-- Base case: currentSum == target_sum → return true -->
          <block type="controls_if" id="base_case_found">
            <value name="IF0">
              <block type="logic_compare">
                <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                <field name="OP">EQ</field>
                <value name="B"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="procedures_return">
                <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
              </block>
            </statement>
            <next>
              <!-- Base case: index >= arr.length → return false -->
              <block type="controls_if" id="base_case_oob">
                <value name="IF0">
                  <block type="logic_compare">
                    <value name="A"><block type="variables_get"><field name="VAR">index</field></block></value>
                    <field name="OP">GTE</field>
                    <value name="B">
                      <block type="lists_length">
                        <value name="VALUE"><block type="variables_get"><field name="VAR">arr</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="procedures_return">
                    <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
                  </block>
                </statement>
                <next>
                  <!-- PRUNING CHECK before Include: if (currentSum + arr[index] > target_sum) -->
                  <block type="controls_if">
                    <mutation else="1"></mutation>
                    <value name="IF0">
                      <block type="logic_compare">
                        <field name="OP">GT</field>
                        <value name="A">
                          <block type="math_arithmetic">
                            <field name="OP">ADD</field>
                            <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                            <value name="B">
                              <block type="lists_get_at_index">
                                <value name="LIST"><block type="variables_get"><field name="VAR">arr</field></block></value>
                                <value name="INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                              </block>
                            </value>
                          </block>
                        </value>
                        <value name="B"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="subset_sum_prune_exclude">
                        <value name="WARRIOR_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                      </block>
                    </statement>
                    <statement name="ELSE">
                      <!-- === INCLUDE BRANCH === -->
                      <!-- REAL BACKTRACK: push warrior to chosen -->
                      <block type="lists_add_item" id="push_chosen">
                        <value name="LIST"><block type="variables_get"><field name="VAR">chosen</field></block></value>
                        <value name="ITEM">
                          <block type="lists_get_at_index">
                            <value name="LIST"><block type="variables_get"><field name="VAR">arr</field></block></value>
                            <value name="INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                          </block>
                        </value>
                        <next>
                          <!-- Trace: include (for animation) -->
                          <block type="subset_sum_include" id="include_trace">
                            <value name="WARRIOR_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                            <next>
                              <!-- if subsetSum(arr, index+1, currentSum + arr[index], target_sum) return true -->
                              <block type="controls_if" id="try_include">
                                <value name="IF0">
                                  <block type="procedures_callreturn">
                                    <mutation name="subsetSum"><arg name="arr"></arg><arg name="index"></arg><arg name="currentSum"></arg><arg name="target_sum"></arg></mutation>
                                    <value name="ARG0"><block type="variables_get"><field name="VAR">arr</field></block></value>
                                    <value name="ARG1">
                                      <block type="math_arithmetic">
                                        <value name="A"><block type="variables_get"><field name="VAR">index</field></block></value>
                                        <field name="OP">ADD</field>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                    <value name="ARG2">
                                      <block type="math_arithmetic">
                                        <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                                        <field name="OP">ADD</field>
                                        <value name="B">
                                          <block type="lists_get_at_index">
                                            <value name="LIST"><block type="variables_get"><field name="VAR">arr</field></block></value>
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                    <value name="ARG3"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <block type="procedures_return">
                                    <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                                  </block>
                                </statement>
                                <next>
                                  <!-- REAL BACKTRACK: pop from chosen -->
                                  <block type="lists_remove_last" id="pop_chosen">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">chosen</field></block></value>
                                    <next>
                                      <!-- Trace: reset (for animation) -->
                                      <block type="subset_sum_reset" id="reset_trace">
                                        <value name="WARRIOR_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
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
                    <next>
                      <!-- === EXCLUDE BRANCH === -->
                                      <block type="subset_sum_exclude" id="exclude_trace">
                                        <value name="WARRIOR_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                        <next>
                                          <!-- if subsetSum(arr, index+1, currentSum, target_sum) return true -->
                                          <block type="controls_if" id="try_exclude">
                                            <value name="IF0">
                                              <block type="procedures_callreturn">
                                                <mutation name="subsetSum"><arg name="arr"></arg><arg name="index"></arg><arg name="currentSum"></arg><arg name="target_sum"></arg></mutation>
                                                <value name="ARG0"><block type="variables_get"><field name="VAR">arr</field></block></value>
                                                <value name="ARG1">
                                                  <block type="math_arithmetic">
                                                    <value name="A"><block type="variables_get"><field name="VAR">index</field></block></value>
                                                    <field name="OP">ADD</field>
                                                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                                  </block>
                                                </value>
                                                <value name="ARG2"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                                                <value name="ARG3"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
                                              </block>
                                            </value>
                                            <statement name="DO0">
                                              <block type="procedures_return">
                                                <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                                              </block>
                                            </statement>
                                            <next>
                                              <!-- return false -->
                                              <block type="procedures_return" id="return_false_end">
                                                <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
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
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
  
  <!-- Main: call subsetSum then set result = chosen -->
  <block type="variables_set" id="call_main_wrapper" x="50" y="600">
    <field name="VAR">_unused</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="subsetSum"><arg name="arr"></arg><arg name="index"></arg><arg name="currentSum"></arg><arg name="target_sum"></arg></mutation>
        <value name="ARG0"><block type="variables_get"><field name="VAR">warriors</field></block></value>
        <value name="ARG1"><block type="math_number"><field name="NUM">0</field></block></value>
        <value name="ARG2"><block type="math_number"><field name="NUM">0</field></block></value>
        <value name="ARG3"><block type="variables_get"><field name="VAR">target_sum</field></block></value>
      </block>
    </value>
    <next>
      <block type="variables_set" id="main_result_set">
        <field name="VAR">result</field>
        <value name="VALUE">
          <block type="variables_get"><field name="VAR">chosen</field></block>
        </value>
      </block>
    </next>
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
    // Parse XML
    const xml = Blockly.utils.xml.textToDom(subsetSumExampleXml);

    // Ensure necessary variables exist
    const variableNames = ['arr', 'index', 'currentSum', 'target_sum', 'warriors', 'result', 'chosen'];
    variableNames.forEach(varName => {
      if (!workspace.getVariable(varName)) {
        workspace.createVariable(varName);
      }
    });

    // Clear existing blocks before loading to prevent duplicate function definitions
    if (workspace._starterListener) {
      workspace.removeChangeListener(workspace._starterListener);
      workspace._starterListener = null;
    }
    Blockly.Events.disable();
    workspace.clear();
    Blockly.Events.enable();

    // Load blocks into workspace
    Blockly.Xml.domToWorkspace(xml, workspace);
  } catch (error) {
    console.error('❌ Error loading Subset Sum example blocks:', error);
    alert(`เกิดข้อผิดพลาดในการโหลด Subset Sum example blocks: ${error.message}`);
  }
}
