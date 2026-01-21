// Helper function to load Dynamic Programming Knapsack example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dynamic Knapsack Example XML - Bottom-up DP WITH explicit memory table M[row][cap]
// IMPORTANT: In a statement input, Blockly only accepts a single top-level block chain.
// So everything must be connected via <next>. (Otherwise you'll see "only a tiny part".)
const dynamicKnapsackExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="knapsack_dp_function" x="40" y="40">
    <field name="NAME">knapsack</field>
    <mutation>
      <arg name="w"></arg>
      <arg name="v"></arg>
      <arg name="i"></arg>
      <arg name="j"></arg>
    </mutation>
    <comment pinned="false" h="90" w="320">DP bottom-up with memory table M: build rows 0..i, caps 0..j. Return M[i][j].</comment>
    <statement name="STACK">
      <block type="if_only" id="dp_base_if">
        <value name="CONDITION">
          <block type="logic_operation" id="dp_base_or">
            <field name="OP">OR</field>
            <value name="A">
              <block type="logic_compare" id="dp_i_lt_0">
                <value name="A"><block type="variables_get" id="dp_i_get"><field name="VAR">i</field></block></value>
                <field name="OP">LT</field>
                <value name="B"><block type="math_number" id="dp_zero_i"><field name="NUM">0</field></block></value>
              </block>
            </value>
            <value name="B">
              <block type="logic_compare" id="dp_j_lte_0">
                <value name="A"><block type="variables_get" id="dp_j_get"><field name="VAR">j</field></block></value>
                <field name="OP">LTE</field>
                <value name="B"><block type="math_number" id="dp_zero_j"><field name="NUM">0</field></block></value>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO">
          <block type="procedures_return" id="dp_return_0">
            <value name="VALUE"><block type="math_number" id="dp_return_0_num"><field name="NUM">0</field></block></value>
          </block>
        </statement>
        <next>
          <block type="variables_set" id="dp_set_M_empty">
            <field name="VAR">M</field>
            <value name="VALUE"><block type="lists_create_empty" id="dp_M_empty"></block></value>
            <next>
              <block type="variables_set" id="dp_set_prev_empty">
                <field name="VAR">prev</field>
                <value name="VALUE"><block type="lists_create_empty" id="dp_prev_empty"></block></value>
                <next>
                  <block type="for_loop_dynamic" id="dp_init_prev_loop">
                    <field name="VAR">cap</field>
                    <value name="FROM"><block type="math_number" id="dp_cap_from0_init"><field name="NUM">0</field></block></value>
                    <value name="TO"><block type="variables_get" id="dp_cap_to_j_init"><field name="VAR">j</field></block></value>
                    <statement name="DO">
                      <block type="lists_add_item" id="dp_prev_push0">
                        <value name="LIST"><block type="variables_get" id="dp_prev_get_for_push"><field name="VAR">prev</field></block></value>
                        <value name="ITEM"><block type="math_number" id="dp_push0_num"><field name="NUM">0</field></block></value>
                      </block>
                    </statement>
                    <next>
                      <block type="for_loop_dynamic" id="dp_items_loop">
                        <field name="VAR">item</field>
                        <value name="FROM"><block type="math_number" id="dp_item_from0"><field name="NUM">0</field></block></value>
                        <value name="TO"><block type="variables_get" id="dp_item_to_i"><field name="VAR">i</field></block></value>
                        <statement name="DO">
                          <block type="variables_set" id="dp_set_curr_empty">
                            <field name="VAR">curr</field>
                            <value name="VALUE"><block type="lists_create_empty" id="dp_curr_empty"></block></value>
                            <next>
                              <block type="for_loop_dynamic" id="dp_cap_loop">
                                <field name="VAR">cap</field>
                                <value name="FROM"><block type="math_number" id="dp_cap_from0"><field name="NUM">0</field></block></value>
                                <value name="TO"><block type="variables_get" id="dp_cap_to_j"><field name="VAR">j</field></block></value>
                                <statement name="DO">
                                  <block type="if_else" id="dp_if_weight_gt_cap">
                                    <value name="CONDITION">
                                      <block type="logic_compare" id="dp_weight_gt_cap">
                                        <value name="A">
                                          <block type="lists_get_at_index" id="dp_get_weight_item">
                                            <value name="LIST"><block type="variables_get" id="dp_w_get"><field name="VAR">w</field></block></value>
                                            <value name="INDEX"><block type="variables_get" id="dp_item_get_w"><field name="VAR">item</field></block></value>
                                          </block>
                                        </value>
                                        <field name="OP">GT</field>
                                        <value name="B"><block type="variables_get" id="dp_cap_get_cmp"><field name="VAR">cap</field></block></value>
                                      </block>
                                    </value>
                                    <statement name="IF_DO">
                                      <block type="lists_add_item" id="dp_curr_push_prev_cap">
                                        <value name="LIST"><block type="variables_get" id="dp_curr_get_push1"><field name="VAR">curr</field></block></value>
                                        <value name="ITEM">
                                          <block type="lists_get_at_index" id="dp_prev_at_cap">
                                            <value name="LIST"><block type="variables_get" id="dp_prev_get_cap"><field name="VAR">prev</field></block></value>
                                            <value name="INDEX"><block type="variables_get" id="dp_cap_get_1"><field name="VAR">cap</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </statement>
                                    <statement name="ELSE_DO">
                                      <block type="lists_add_item" id="dp_curr_push_max">
                                        <value name="LIST"><block type="variables_get" id="dp_curr_get_push2"><field name="VAR">curr</field></block></value>
                                        <value name="ITEM">
                                          <block type="math_max" id="dp_max_expr">
                                            <value name="A">
                                              <block type="lists_get_at_index" id="dp_prev_at_cap_2">
                                                <value name="LIST"><block type="variables_get" id="dp_prev_get_cap_2"><field name="VAR">prev</field></block></value>
                                                <value name="INDEX"><block type="variables_get" id="dp_cap_get_2"><field name="VAR">cap</field></block></value>
                                              </block>
                                            </value>
                                            <value name="B">
                                              <block type="math_arithmetic" id="dp_v_plus_prev">
                                                <value name="A">
                                                  <block type="lists_get_at_index" id="dp_get_value_item">
                                                    <value name="LIST"><block type="variables_get" id="dp_v_get"><field name="VAR">v</field></block></value>
                                                    <value name="INDEX"><block type="variables_get" id="dp_item_get_v"><field name="VAR">item</field></block></value>
                                                  </block>
                                                </value>
                                                <field name="OP">ADD</field>
                                                <value name="B">
                                                  <block type="lists_get_at_index" id="dp_prev_at_cap_minus_w">
                                                    <value name="LIST"><block type="variables_get" id="dp_prev_get_3"><field name="VAR">prev</field></block></value>
                                                    <value name="INDEX">
                                                      <block type="math_arithmetic" id="dp_cap_minus_w">
                                                        <value name="A"><block type="variables_get" id="dp_cap_get_3"><field name="VAR">cap</field></block></value>
                                                        <field name="OP">MINUS</field>
                                                        <value name="B">
                                                          <block type="lists_get_at_index" id="dp_get_weight_item_2">
                                                            <value name="LIST"><block type="variables_get" id="dp_w_get2"><field name="VAR">w</field></block></value>
                                                            <value name="INDEX"><block type="variables_get" id="dp_item_get_w2"><field name="VAR">item</field></block></value>
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
                                    </statement>
                                  </block>
                                </statement>
                                <next>
                                  <block type="lists_add_item" id="dp_M_push_curr">
                                    <value name="LIST"><block type="variables_get" id="dp_M_get_for_push"><field name="VAR">M</field></block></value>
                                    <value name="ITEM"><block type="variables_get" id="dp_curr_get_for_M"><field name="VAR">curr</field></block></value>
                                    <next>
                                      <block type="variables_set" id="dp_set_prev_curr">
                                        <field name="VAR">prev</field>
                                        <value name="VALUE"><block type="variables_get" id="dp_curr_get_assign"><field name="VAR">curr</field></block></value>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </statement>
                        <next>
                          <block type="procedures_return" id="dp_return_M_ij">
                            <value name="VALUE">
                              <block type="lists_get_at_index" id="dp_get_row_i">
                                <value name="LIST">
                                  <block type="lists_get_at_index" id="dp_get_M_i">
                                    <value name="LIST"><block type="variables_get" id="dp_M_get_final"><field name="VAR">M</field></block></value>
                                    <value name="INDEX"><block type="variables_get" id="dp_i_get_final"><field name="VAR">i</field></block></value>
                                  </block>
                                </value>
                                <value name="INDEX"><block type="variables_get" id="dp_j_get_final"><field name="VAR">j</field></block></value>
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
    </statement>
  </block>

  <block type="variables_set" id="dp_main_result" x="40" y="680">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="dp_call_main">
        <mutation name="knapsack">
          <arg name="w"></arg><arg name="v"></arg><arg name="i"></arg><arg name="j"></arg>
        </mutation>
        <field name="NAME">knapsack</field>
        <value name="ARG0"><block type="variables_get" id="dp_weights_get"><field name="VAR">weights</field></block></value>
        <value name="ARG1"><block type="variables_get" id="dp_values_get"><field name="VAR">values</field></block></value>
        <value name="ARG2">
          <block type="math_arithmetic" id="dp_n_minus_1">
            <value name="A"><block type="variables_get" id="dp_n_get"><field name="VAR">n</field></block></value>
            <field name="OP">MINUS</field>
            <value name="B"><block type="math_number" id="dp_one"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <value name="ARG3"><block type="variables_get" id="dp_capacity_get"><field name="VAR">capacity</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

export function loadDynamicKnapsackExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Dynamic Knapsack example blocks: workspace is null');
    return;
  }

  try {
    console.log('📦 Loading Dynamic Knapsack (DP) example blocks into workspace...');
    workspace.clear();

    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dynamicKnapsackExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = [
          'w', 'v', 'i', 'j',
          'weights', 'values', 'n', 'capacity', 'result',
          'M', 'prev', 'curr', 'item', 'cap'
        ];
        variableNames.forEach(varName => {
          try {
            const variableMap = workspace.getVariableMap();
            if (variableMap) {
              const existingVar = variableMap.getVariable(varName);
              if (!existingVar) workspace.createVariable(varName);
            } else {
              workspace.createVariable(varName);
            }
          } catch (e) {
            // ignore
          }
        });

        console.log('✅ Dynamic Knapsack (DP) example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Dynamic Knapsack example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Dynamic Knapsack example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDynamicKnapsackExampleBlocks:', error);
  }
}

export function getDynamicKnapsackExampleXml() {
  return dynamicKnapsackExampleXml;
}


