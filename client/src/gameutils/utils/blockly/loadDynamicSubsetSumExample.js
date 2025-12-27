// Helper function to load Dynamic Programming Subset Sum example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dynamic Subset Sum Example XML - Bottom-up DP using rolling arrays (prev/curr)
// Keep signature compatible with existing SubsetSum tests/calls: subsetSum(arr, index, sum, target_sum)
// NOTE: This is the "short DP" variant: still DP (no recursion), but avoids full dp[n][target] table.
// Returns prev[remain] where remain = target_sum - sum, using items from index..end.
const dynamicSubsetSumExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="subset_sum_dp_function" x="40" y="40">
    <field name="NAME">subsetSum</field>
    <mutation>
      <arg name="arr"></arg>
      <arg name="index"></arg>
      <arg name="sum"></arg>
      <arg name="target_sum"></arg>
    </mutation>
    <comment pinned="false" h="90" w="360">DP bottom-up (rolling arrays): remain = target_sum - sum; items from index..end. Return prev[remain].</comment>
    <statement name="STACK">
      <!-- if sum == target_sum return true -->
      <block type="if_only" id="dp_ss_target_zero">
        <value name="CONDITION">
          <block type="logic_compare" id="dp_ss_sum_eq_target">
            <value name="A"><block type="variables_get" id="dp_ss_sum_get0"><field name="VAR">sum</field></block></value>
            <field name="OP">EQ</field>
            <value name="B"><block type="variables_get" id="dp_ss_target_get0"><field name="VAR">target_sum</field></block></value>
          </block>
        </value>
        <statement name="DO">
          <block type="procedures_return" id="dp_ss_return_true0">
            <value name="VALUE"><block type="logic_boolean" id="dp_ss_true0"><field name="BOOL">TRUE</field></block></value>
          </block>
        </statement>
        <next>
          <!-- remain = target_sum - sum -->
          <block type="variables_set" id="dp_ss_set_remain">
            <field name="VAR">remain</field>
            <value name="VALUE">
              <block type="math_arithmetic" id="dp_ss_target_minus_sum">
                <value name="A"><block type="variables_get" id="dp_ss_target_get_rem"><field name="VAR">target_sum</field></block></value>
                <field name="OP">MINUS</field>
                <value name="B"><block type="variables_get" id="dp_ss_sum_get_rem"><field name="VAR">sum</field></block></value>
              </block>
            </value>
            <next>
              <!-- if remain < 0 return false -->
              <block type="if_only" id="dp_ss_if_remain_neg">
                <value name="CONDITION">
                  <block type="logic_compare" id="dp_ss_remain_lt0">
                    <value name="A"><block type="variables_get" id="dp_ss_remain_get_lt0"><field name="VAR">remain</field></block></value>
                    <field name="OP">LT</field>
                    <value name="B"><block type="math_number" id="dp_ss_zero_rem"><field name="NUM">0</field></block></value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="procedures_return" id="dp_ss_return_false_neg">
                    <value name="VALUE"><block type="logic_boolean" id="dp_ss_false_neg"><field name="BOOL">FALSE</field></block></value>
                  </block>
                </statement>
                <next>
                  <!-- if index >= arr.length return false -->
                  <block type="if_only" id="dp_ss_if_index_oob">
                    <value name="CONDITION">
                      <block type="logic_compare" id="dp_ss_index_gte_len">
                        <value name="A"><block type="variables_get" id="dp_ss_index_get_oob"><field name="VAR">index</field></block></value>
                        <field name="OP">GTE</field>
                        <value name="B">
                          <block type="lists_length" id="dp_ss_arr_len2">
                            <value name="VALUE"><block type="variables_get" id="dp_ss_arr_get_len2"><field name="VAR">arr</field></block></value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="procedures_return" id="dp_ss_return_false_oob">
                        <value name="VALUE"><block type="logic_boolean" id="dp_ss_false_oob"><field name="BOOL">FALSE</field></block></value>
                      </block>
                    </statement>
                    <next>
          <!-- n = arr.length -->
          <block type="variables_set" id="dp_ss_set_n">
            <field name="VAR">n</field>
            <value name="VALUE">
              <block type="lists_length" id="dp_ss_arr_len">
                <value name="VALUE"><block type="variables_get" id="dp_ss_arr_get_len"><field name="VAR">arr</field></block></value>
              </block>
            </value>
            <next>
              <!-- prev = [] -->
              <block type="variables_set" id="dp_ss_set_prev_empty">
                <field name="VAR">prev</field>
                <value name="VALUE"><block type="lists_create_empty" id="dp_ss_prev_empty"></block></value>
                <next>
                  <!-- for cap=0..remain: prev.push(FALSE) -->
                  <block type="for_loop_dynamic" id="dp_ss_prev_init_loop">
                    <field name="VAR">cap</field>
                    <value name="FROM"><block type="math_number" id="dp_ss_cap_from0"><field name="NUM">0</field></block></value>
                    <value name="TO"><block type="variables_get" id="dp_ss_remain_get_to"><field name="VAR">remain</field></block></value>
                    <statement name="DO">
                      <block type="lists_add_item" id="dp_ss_prev_push_false">
                        <value name="LIST"><block type="variables_get" id="dp_ss_prev_get_push"><field name="VAR">prev</field></block></value>
                        <value name="ITEM"><block type="logic_boolean" id="dp_ss_false"><field name="BOOL">FALSE</field></block></value>
                      </block>
                    </statement>
                    <next>
                      <!-- prev[0] = TRUE -->
                      <block type="lists_setIndex" id="dp_ss_set_prev0_true">
                        <field name="MODE">SET</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get" id="dp_ss_prev_get0"><field name="VAR">prev</field></block></value>
                        <value name="AT"><block type="math_number" id="dp_ss_at0"><field name="NUM">0</field></block></value>
                        <value name="TO"><block type="logic_boolean" id="dp_ss_true0"><field name="BOOL">TRUE</field></block></value>
                        <next>
                          <!-- for itemIndex=0..n-1 -->
                          <block type="for_loop_dynamic" id="dp_ss_items_loop">
                            <field name="VAR">itemIndex</field>
                            <value name="FROM"><block type="variables_get" id="dp_ss_index_get_from"><field name="VAR">index</field></block></value>
                            <value name="TO">
                              <block type="math_arithmetic" id="dp_ss_n_minus1">
                                <value name="A"><block type="variables_get" id="dp_ss_n_get_m1"><field name="VAR">n</field></block></value>
                                <field name="OP">MINUS</field>
                                <value name="B"><block type="math_number" id="dp_ss_one_m1"><field name="NUM">1</field></block></value>
                              </block>
                            </value>
                            <statement name="DO">
                              <!-- curr = [] -->
                              <block type="variables_set" id="dp_ss_set_curr_empty">
                                <field name="VAR">curr</field>
                                <value name="VALUE"><block type="lists_create_empty" id="dp_ss_curr_empty"></block></value>
                                <next>
                                  <!-- for cap=0..remain: curr.push(FALSE) -->
                                  <block type="for_loop_dynamic" id="dp_ss_curr_init_loop">
                                    <field name="VAR">cap</field>
                                    <value name="FROM"><block type="math_number" id="dp_ss_cap_from0_2"><field name="NUM">0</field></block></value>
                                    <value name="TO"><block type="variables_get" id="dp_ss_remain_get_to2"><field name="VAR">remain</field></block></value>
                                    <statement name="DO">
                                      <block type="lists_add_item" id="dp_ss_curr_push_false">
                                        <value name="LIST"><block type="variables_get" id="dp_ss_curr_get_push"><field name="VAR">curr</field></block></value>
                                        <value name="ITEM"><block type="logic_boolean" id="dp_ss_false2"><field name="BOOL">FALSE</field></block></value>
                                      </block>
                                    </statement>
                                    <next>
                                      <!-- curr[0] = TRUE -->
                                      <block type="lists_setIndex" id="dp_ss_set_curr0_true">
                                        <field name="MODE">SET</field>
                                        <field name="WHERE">FROM_START</field>
                                        <value name="LIST"><block type="variables_get" id="dp_ss_curr_get0"><field name="VAR">curr</field></block></value>
                                        <value name="AT"><block type="math_number" id="dp_ss_at0_2"><field name="NUM">0</field></block></value>
                                        <value name="TO"><block type="logic_boolean" id="dp_ss_true0_2"><field name="BOOL">TRUE</field></block></value>
                                        <next>
                                          <!-- weight = arr[itemIndex] -->
                                          <block type="variables_set" id="dp_ss_set_weight">
                                            <field name="VAR">weight</field>
                                            <value name="VALUE">
                                              <block type="lists_get_at_index" id="dp_ss_arr_at_item">
                                                <value name="LIST"><block type="variables_get" id="dp_ss_arr_get_item"><field name="VAR">arr</field></block></value>
                                                <value name="INDEX"><block type="variables_get" id="dp_ss_item_get"><field name="VAR">itemIndex</field></block></value>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- for cap=1..remain -->
                                              <block type="for_loop_dynamic" id="dp_ss_cap_fill_loop">
                                                <field name="VAR">cap</field>
                                                <value name="FROM"><block type="math_number" id="dp_ss_cap_from1"><field name="NUM">1</field></block></value>
                                                <value name="TO"><block type="variables_get" id="dp_ss_remain_get_to3"><field name="VAR">remain</field></block></value>
                                                <statement name="DO">
                                                  <!-- if weight > cap => curr[cap] = prev[cap] else curr[cap] = prev[cap] OR prev[cap-weight] -->
                                                  <block type="if_else" id="dp_ss_if_weight_gt_cap">
                                                    <value name="CONDITION">
                                                      <block type="logic_compare" id="dp_ss_weight_gt_cap">
                                                        <value name="A"><block type="variables_get" id="dp_ss_weight_get"><field name="VAR">weight</field></block></value>
                                                        <field name="OP">GT</field>
                                                        <value name="B"><block type="variables_get" id="dp_ss_cap_get"><field name="VAR">cap</field></block></value>
                                                      </block>
                                                    </value>
                                                    <statement name="IF_DO">
                                                      <block type="lists_setIndex" id="dp_ss_set_curr_cap_prev">
                                                        <field name="MODE">SET</field>
                                                        <field name="WHERE">FROM_START</field>
                                                        <value name="LIST"><block type="variables_get" id="dp_ss_curr_get_set1"><field name="VAR">curr</field></block></value>
                                                        <value name="AT"><block type="variables_get" id="dp_ss_cap_get_at1"><field name="VAR">cap</field></block></value>
                                                        <value name="TO">
                                                          <block type="lists_get_at_index" id="dp_ss_prev_at_cap">
                                                            <value name="LIST"><block type="variables_get" id="dp_ss_prev_get_at"><field name="VAR">prev</field></block></value>
                                                            <value name="INDEX"><block type="variables_get" id="dp_ss_cap_get_at2"><field name="VAR">cap</field></block></value>
                                                          </block>
                                                        </value>
                                                      </block>
                                                    </statement>
                                                    <statement name="ELSE_DO">
                                                      <block type="lists_setIndex" id="dp_ss_set_curr_cap_or">
                                                        <field name="MODE">SET</field>
                                                        <field name="WHERE">FROM_START</field>
                                                        <value name="LIST"><block type="variables_get" id="dp_ss_curr_get_set2"><field name="VAR">curr</field></block></value>
                                                        <value name="AT"><block type="variables_get" id="dp_ss_cap_get_at3"><field name="VAR">cap</field></block></value>
                                                        <value name="TO">
                                                          <block type="logic_operation" id="dp_ss_or_expr">
                                                            <field name="OP">OR</field>
                                                            <value name="A">
                                                              <block type="lists_get_at_index" id="dp_ss_prev_at_cap2">
                                                                <value name="LIST"><block type="variables_get" id="dp_ss_prev_get_at2"><field name="VAR">prev</field></block></value>
                                                                <value name="INDEX"><block type="variables_get" id="dp_ss_cap_get_at4"><field name="VAR">cap</field></block></value>
                                                              </block>
                                                            </value>
                                                            <value name="B">
                                                              <block type="lists_get_at_index" id="dp_ss_prev_at_cap_minus_w">
                                                                <value name="LIST"><block type="variables_get" id="dp_ss_prev_get_at3"><field name="VAR">prev</field></block></value>
                                                                <value name="INDEX">
                                                                  <block type="math_arithmetic" id="dp_ss_cap_minus_weight">
                                                                    <value name="A"><block type="variables_get" id="dp_ss_cap_get_mw"><field name="VAR">cap</field></block></value>
                                                                    <field name="OP">MINUS</field>
                                                                    <value name="B"><block type="variables_get" id="dp_ss_weight_get2"><field name="VAR">weight</field></block></value>
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
                                                  <!-- prev = curr (CRITICAL: must happen each item iteration) -->
                                                  <block type="variables_set" id="dp_ss_set_prev_curr_inloop">
                                                    <field name="VAR">prev</field>
                                                    <value name="VALUE"><block type="variables_get" id="dp_ss_curr_get_assign_inloop"><field name="VAR">curr</field></block></value>
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
                            <next>
                              <!-- return prev[remain] (after item loop finishes) -->
                              <block type="procedures_return" id="dp_ss_return_prev_target">
                                <value name="VALUE">
                                  <block type="lists_get_at_index" id="dp_ss_prev_at_target">
                                    <value name="LIST"><block type="variables_get" id="dp_ss_prev_get_final"><field name="VAR">prev</field></block></value>
                                    <value name="INDEX"><block type="variables_get" id="dp_ss_remain_get_final"><field name="VAR">remain</field></block></value>
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
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <!-- Main: result = subsetSum(warriors, 0, 0, target_sum) -->
  <block type="variables_set" id="dp_ss_main_result" x="40" y="720">
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
  if (!workspace) {
    console.error('❌ Cannot load Dynamic Subset Sum example: workspace is null');
    return;
  }

  try {
    console.log('➕ Loading Dynamic Subset Sum (DP) example blocks into workspace...');
    workspace.clear();

    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dynamicSubsetSumExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        const variableNames = [
          'arr', 'index', 'sum', 'target_sum',
          'warriors', 'result',
          'n', 'remain', 'prev', 'curr', 'cap', 'itemIndex', 'weight'
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

        console.log('✅ Dynamic Subset Sum (DP) example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Dynamic Subset Sum example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Dynamic Subset Sum example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDynamicSubsetSumExampleBlocks:', error);
  }
}

export function getDynamicSubsetSumExampleXml() {
  return dynamicSubsetSumExampleXml;
}


