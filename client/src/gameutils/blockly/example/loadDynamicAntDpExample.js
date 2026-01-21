// Helper function to load Dynamic Programming Ant DP (Max Sugar Path) example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dynamic Ant DP Example XML (Robust) - Grid DP demo for visualization
// Signature: antDp(start, goal, sugarGrid)
// Notes:
// - start/goal are dictionaries/objects: {r, c}
// - Uses injected level variables (startR/startC/goalR/goalC/sugarGrid) if present
const dynamicAntDpExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="antdp_function" x="40" y="40">
    <field name="NAME">antDp</field>
    <mutation>
      <arg name="start"></arg>
      <arg name="goal"></arg>
      <arg name="sugarGrid"></arg>
    </mutation>
    <comment pinned="false" h="110" w="520">ตัวอย่าง (ผ่านทุก test): DP เดินขวา/ลง เก็บน้ำตาลรวมมากที่สุด
dp[r][c] = sugar + max(dp[r-1][c], dp[r][c-1]) (เริ่มที่ start)</comment>
    <statement name="STACK">
      <block type="variables_set" id="antdp_set_rows">
        <field name="VAR">rows</field>
        <value name="VALUE">
          <block type="lists_length" id="antdp_rows_len">
            <value name="VALUE">
              <block type="variables_get" id="antdp_sugarGrid_get_rows">
                <field name="VAR">sugarGrid</field>
              </block>
            </value>
          </block>
        </value>
        <next>
          <block type="variables_set" id="antdp_set_cols">
            <field name="VAR">cols</field>
            <value name="VALUE">
              <block type="lists_length" id="antdp_cols_len">
                <value name="VALUE">
                  <block type="lists_get_at_index" id="antdp_get_row0">
                    <value name="LIST">
                      <block type="variables_get" id="antdp_sugarGrid_get_cols">
                        <field name="VAR">sugarGrid</field>
                      </block>
                    </value>
                    <value name="INDEX">
                      <block type="math_number" id="antdp_zero_row0">
                        <field name="NUM">0</field>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
            <next>
              <block type="variables_set" id="antdp_set_gr">
                <field name="VAR">gr</field>
                <value name="VALUE">
                  <block type="dict_get" id="antdp_goal_get_r">
                    <value name="DICT"><block type="variables_get" id="antdp_goal_get_for_r"><field name="VAR">goal</field></block></value>
                    <value name="KEY"><block type="text" id="antdp_key_r2"><field name="TEXT">r</field></block></value>
                  </block>
                </value>
                <next>
                  <block type="variables_set" id="antdp_set_gc">
                    <field name="VAR">gc</field>
                    <value name="VALUE">
                      <block type="dict_get" id="antdp_goal_get_c">
                        <value name="DICT"><block type="variables_get" id="antdp_goal_get_for_c"><field name="VAR">goal</field></block></value>
                        <value name="KEY"><block type="text" id="antdp_key_c2"><field name="TEXT">c</field></block></value>
                      </block>
                    </value>
                    <next>
                      <block type="variables_set" id="antdp_set_sr">
                        <field name="VAR">sr</field>
                        <value name="VALUE">
                          <block type="dict_get" id="antdp_start_get_r">
                            <value name="DICT"><block type="variables_get" id="antdp_start_get_for_r"><field name="VAR">start</field></block></value>
                            <value name="KEY"><block type="text" id="antdp_key_sr"><field name="TEXT">r</field></block></value>
                          </block>
                        </value>
                        <next>
                          <block type="variables_set" id="antdp_set_sc">
                            <field name="VAR">sc</field>
                            <value name="VALUE">
                              <block type="dict_get" id="antdp_start_get_c">
                                <value name="DICT"><block type="variables_get" id="antdp_start_get_for_c"><field name="VAR">start</field></block></value>
                                <value name="KEY"><block type="text" id="antdp_key_sc"><field name="TEXT">c</field></block></value>
                              </block>
                            </value>
                            <next>
                              <block type="variables_set" id="antdp_set_dp_empty">
                                <field name="VAR">dp</field>
                                <value name="VALUE"><block type="lists_create_empty" id="antdp_dp_empty"></block></value>
                                <next>
                                  <block type="variables_set" id="antdp_set_rows_m1">
                                    <field name="VAR">rowsMinus1</field>
                                    <value name="VALUE">
                                      <block type="math_arithmetic" id="antdp_rows_minus_1">
                                        <value name="A"><block type="variables_get" id="antdp_rows_get_m1"><field name="VAR">rows</field></block></value>
                                        <field name="OP">MINUS</field>
                                        <value name="B"><block type="math_number" id="antdp_one_rows_m1"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                    <next>
                                      <block type="variables_set" id="antdp_set_cols_m1">
                                        <field name="VAR">colsMinus1</field>
                                        <value name="VALUE">
                                          <block type="math_arithmetic" id="antdp_cols_minus_1">
                                            <value name="A"><block type="variables_get" id="antdp_cols_get_m1"><field name="VAR">cols</field></block></value>
                                            <field name="OP">MINUS</field>
                                            <value name="B"><block type="math_number" id="antdp_one_cols_m1"><field name="NUM">1</field></block></value>
                                          </block>
                                        </value>
                                        <next>
                                          <!-- grid loops -->
                                          <block type="for_loop_dynamic" id="antdp_r_loop">
                                            <field name="VAR">r</field>
                                            <value name="FROM"><block type="math_number" id="antdp_r_from_zero"><field name="NUM">0</field></block></value>
                                            <value name="TO"><block type="variables_get" id="antdp_rows_m1_get_for_r"><field name="VAR">rowsMinus1</field></block></value>
                                            <statement name="DO">
                                              <block type="variables_set" id="antdp_set_dpRow_empty">
                                                <field name="VAR">dpRow</field>
                                                <value name="VALUE"><block type="lists_create_empty" id="antdp_dpRow_empty"></block></value>
                                                <next>
                                                  <block type="for_loop_dynamic" id="antdp_c_loop">
                                                    <field name="VAR">c</field>
                                                    <value name="FROM"><block type="math_number" id="antdp_c_from_zero"><field name="NUM">0</field></block></value>
                                                    <value name="TO"><block type="variables_get" id="antdp_cols_m1_get_for_c"><field name="VAR">colsMinus1</field></block></value>
                                                    <statement name="DO">
                                                      <block type="variables_set" id="antdp_set_sugar">
                                                        <field name="VAR">sugar</field>
                                                        <value name="VALUE">
                                                          <block type="lists_get_at_index" id="antdp_grid_r_c">
                                                            <value name="LIST">
                                                              <block type="lists_get_at_index" id="antdp_grid_at_r">
                                                                <value name="LIST"><block type="variables_get" id="antdp_grid_get"><field name="VAR">sugarGrid</field></block></value>
                                                                <value name="INDEX"><block type="variables_get" id="antdp_r_get_grid"><field name="VAR">r</field></block></value>
                                                              </block>
                                                            </value>
                                                            <value name="INDEX"><block type="variables_get" id="antdp_c_get_grid"><field name="VAR">c</field></block></value>
                                                          </block>
                                                        </value>
                                                        <next>
                                                          <!-- Reachability Check: (r >= sr AND c >= sc) -->
                                                          <block type="if_else" id="antdp_reach_if">
                                                            <value name="CONDITION">
                                                              <block type="logic_operation" id="antdp_and_reachable">
                                                                <field name="OP">AND</field>
                                                                <value name="A">
                                                                  <block type="logic_compare" id="antdp_r_gte_sr">
                                                                    <field name="OP">GTE</field>
                                                                    <value name="A"><block type="variables_get" id="antdp_r_check_reach"><field name="VAR">r</field></block></value>
                                                                    <value name="B"><block type="variables_get" id="antdp_sr_check_reach"><field name="VAR">sr</field></block></value>
                                                                  </block>
                                                                </value>
                                                                <value name="B">
                                                                  <block type="logic_compare" id="antdp_c_gte_sc">
                                                                    <field name="OP">GTE</field>
                                                                    <value name="A"><block type="variables_get" id="antdp_c_check_reach"><field name="VAR">c</field></block></value>
                                                                    <value name="B"><block type="variables_get" id="antdp_sc_check_reach"><field name="VAR">sc</field></block></value>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                            <statement name="IF_DO">
                                                              <!-- Reachable: calculate best -->
                                                              <block type="variables_set" id="antdp_set_best">
                                                                <field name="VAR">best</field>
                                                                <value name="VALUE"><block type="math_number" id="antdp_best_init"><field name="NUM">0</field></block></value>
                                                                <next>
                                                                  <!-- If r > sr, check top -->
                                                                  <block type="if_only" id="antdp_if_r_gt_sr">
                                                                    <value name="CONDITION">
                                                                      <block type="logic_compare" id="antdp_r_gt_sr">
                                                                        <field name="OP">GT</field>
                                                                        <value name="A"><block type="variables_get" id="antdp_r_check_top"><field name="VAR">r</field></block></value>
                                                                        <value name="B"><block type="variables_get" id="antdp_sr_check_top"><field name="VAR">sr</field></block></value>
                                                                      </block>
                                                                    </value>
                                                                    <statement name="DO">
                                                                      <block type="variables_set" id="antdp_set_top">
                                                                        <field name="VAR">top</field>
                                                                        <value name="VALUE">
                                                                          <block type="lists_get_at_index" id="antdp_get_top_val">
                                                                            <value name="LIST">
                                                                              <block type="lists_get_at_index" id="antdp_get_prev_row">
                                                                                <value name="LIST"><block type="variables_get" id="antdp_dp_get_top"><field name="VAR">dp</field></block></value>
                                                                                <value name="INDEX">
                                                                                  <block type="math_arithmetic" id="antdp_r_minus_1_top">
                                                                                    <value name="A"><block type="variables_get" id="antdp_r_get_top"><field name="VAR">r</field></block></value>
                                                                                    <field name="OP">MINUS</field>
                                                                                    <value name="B"><block type="math_number" id="antdp_one_top"><field name="NUM">1</field></block></value>
                                                                                  </block>
                                                                                </value>
                                                                              </block>
                                                                            </value>
                                                                            <value name="INDEX"><block type="variables_get" id="antdp_c_get_top"><field name="VAR">c</field></block></value>
                                                                          </block>
                                                                        </value>
                                                                        <next>
                                                                          <block type="variables_set" id="antdp_best_max_top">
                                                                            <field name="VAR">best</field>
                                                                            <value name="VALUE">
                                                                              <block type="math_max" id="antdp_max_top">
                                                                                <value name="A"><block type="variables_get" id="antdp_best_get_max_top"><field name="VAR">best</field></block></value>
                                                                                <value name="B"><block type="variables_get" id="antdp_top_get_max_top"><field name="VAR">top</field></block></value>
                                                                              </block>
                                                                            </value>
                                                                          </block>
                                                                        </next>
                                                                      </block>
                                                                    </statement>
                                                                    <next>
                                                                      <!-- If c > sc, check left -->
                                                                      <block type="if_only" id="antdp_if_c_gt_sc">
                                                                        <value name="CONDITION">
                                                                          <block type="logic_compare" id="antdp_c_gt_sc">
                                                                            <field name="OP">GT</field>
                                                                            <value name="A"><block type="variables_get" id="antdp_c_check_left"><field name="VAR" >c</field></block></value>
                                                                            <value name="B"><block type="variables_get" id="antdp_sc_check_left"><field name="VAR" >sc</field></block></value>
                                                                          </block>
                                                                        </value>
                                                                        <statement name="DO">
                                                                          <block type="variables_set" id="antdp_set_left">
                                                                            <field name="VAR">left</field>
                                                                            <value name="VALUE">
                                                                              <block type="lists_get_at_index" id="antdp_get_left_val">
                                                                                <value name="LIST"><block type="variables_get" id="antdp_dpRow_get_left"><field name="VAR">dpRow</field></block></value>
                                                                                <value name="INDEX">
                                                                                  <block type="math_arithmetic" id="antdp_c_minus_1_left">
                                                                                    <value name="A"><block type="variables_get" id="antdp_c_get_left"><field name="VAR">c</field></block></value>
                                                                                    <field name="OP">MINUS</field>
                                                                                    <value name="B"><block type="math_number" id="antdp_one_left"><field name="NUM">1</field></block></value>
                                                                                  </block>
                                                                                </value>
                                                                              </block>
                                                                            </value>
                                                                            <next>
                                                                              <block type="variables_set" id="antdp_best_max_left">
                                                                                <field name="VAR" >best</field>
                                                                                <value name="VALUE">
                                                                                  <block type="math_max" id="antdp_max_left">
                                                                                    <value name="A"><block type="variables_get" id="antdp_best_get_max_left"><field name="VAR">best</field></block></value>
                                                                                    <value name="B" ><block type="variables_get" id="antdp_left_get_max_left"><field name="VAR">left</field></block></value>
                                                                                  </block>
                                                                                </value>
                                                                              </block>
                                                                            </next>
                                                                          </block>
                                                                        </statement>
                                                                        <next>
                                                                          <!-- dpVal = sugar + best -->
                                                                          <block type="variables_set" id="antdp_set_dpVal_calc">
                                                                            <field name="VAR">dpVal</field>
                                                                            <value name="VALUE">
                                                                              <block type="math_arithmetic" id="antdp_sugar_plus_best">
                                                                                <value name="A"><block type="variables_get" id="antdp_sugar_get_plus"><field name="VAR">sugar</field></block></value>
                                                                                <field name="OP">ADD</field>
                                                                                <value name="B"><block type="variables_get" id="antdp_best_get_plus"><field name="VAR">best</field></block></value>
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
                                                            <statement name="ELSE_DO">
                                                              <!-- Unreachable: dpVal = 0 -->
                                                              <block type="variables_set" id="antdp_set_dpVal_0">
                                                                <field name="VAR">dpVal</field>
                                                                <value name="VALUE"><block type="math_number" id="antdp_val_0"><field name="NUM">0</field></block></value>
                                                              </block>
                                                            </statement>
                                                            <next>
                                                              <block type="lists_setIndex" id="antdp_set_cell_demo">
                                                                <field name="MODE">SET</field>
                                                                <field name="WHERE">FROM_START</field>
                                                                <value name="LIST"><block type="variables_get" id="antdp_dpRow_get_set"><field name="VAR">dpRow</field></block></value>
                                                                <value name="AT"><block type="variables_get" id="antdp_c_get_set"><field name="VAR">c</field></block></value>
                                                                <value name="TO"><block type="variables_get" id="antdp_dpVal_get_set"><field name="VAR">dpVal</field></block></value>
                                                              </block>
                                                            </next>
                                                          </block>
                                                        </next>
                                                      </block>
                                                    </statement>
                                                    <next>
                                                      <block type="lists_add_item" id="antdp_dp_push_row">
                                                        <value name="LIST"><block type="variables_get" id="antdp_dp_get_for_push_row"><field name="VAR">dp</field></block></value>
                                                        <value name="ITEM"><block type="variables_get" id="antdp_dpRow_get_for_dp_push"><field name="VAR">dpRow</field></block></value>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </statement>
                                            <next>
                                              <block type="procedures_return" id="antdp_return_goal">
                                                <value name="VALUE">
                                                  <block type="lists_get_at_index" id="antdp_dp_goal_col">
                                                    <value name="LIST">
                                                      <block type="lists_get_at_index" id="antdp_dp_goal_row">
                                                        <value name="LIST"><block type="variables_get" id="antdp_dp_get_goal"><field name="VAR">dp</field></block></value>
                                                        <value name="INDEX"><block type="variables_get" id="antdp_gr_get_return"><field name="VAR">gr</field></block></value>
                                                      </block>
                                                    </value>
                                                    <value name="INDEX"><block type="variables_get" id="antdp_gc_get_return"><field name="VAR">gc</field></block></value>
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
        </next>
      </block>
    </statement>
  </block>

  <!-- Main code -->
  <block type="variables_set" id="antdp_main_set_start" x="40" y="820">
    <field name="VAR">start</field>
    <value name="VALUE"><block type="dict_create" id="antdp_main_start_create"></block></value>
    <next>
      <block type="dict_set" id="antdp_main_start_set_r">
        <value name="DICT"><block type="variables_get" id="antdp_main_start_get1"><field name="VAR">start</field></block></value>
        <value name="KEY"><block type="text" id="antdp_main_key_r"><field name="TEXT">r</field></block></value>
        <value name="VALUE"><block type="variables_get" id="antdp_main_startR"><field name="VAR">startR</field></block></value>
        <next>
          <block type="dict_set" id="antdp_main_start_set_c">
            <value name="DICT"><block type="variables_get" id="antdp_main_start_get2"><field name="VAR">start</field></block></value>
            <value name="KEY"><block type="text" id="antdp_main_key_c"><field name="TEXT">c</field></block></value>
            <value name="VALUE"><block type="variables_get" id="antdp_main_startC"><field name="VAR">startC</field></block></value>
            <next>
              <block type="variables_set" id="antdp_main_set_goal">
                <field name="VAR">goal</field>
                <value name="VALUE"><block type="dict_create" id="antdp_main_goal_create"></block></value>
                <next>
                  <block type="dict_set" id="antdp_main_goal_set_r">
                    <value name="DICT"><block type="variables_get" id="antdp_main_goal_get1"><field name="VAR">goal</field></block></value>
                    <value name="KEY"><block type="text" id="antdp_main_goal_key_r"><field name="TEXT">r</field></block></value>
                    <value name="VALUE"><block type="variables_get" id="antdp_main_goalR"><field name="VAR">goalR</field></block></value>
                    <next>
                      <block type="dict_set" id="antdp_main_goal_set_c">
                        <value name="DICT"><block type="variables_get" id="antdp_main_goal_get2"><field name="VAR">goal</field></block></value>
                        <value name="KEY"><block type="text" id="antdp_main_goal_key_c"><field name="TEXT">c</field></block></value>
                        <value name="VALUE"><block type="variables_get" id="antdp_main_goalC"><field name="VAR">goalC</field></block></value>
                        <next>
                          <block type="variables_set" id="antdp_main_set_result">
                            <field name="VAR">result</field>
                            <value name="VALUE">
                              <block type="procedures_callreturn" id="antdp_main_call">
                                <mutation name="antDp">
                                  <arg name="start"></arg><arg name="goal"></arg><arg name="sugarGrid"></arg>
                                </mutation>
                                <field name="NAME">antDp</field>
                                <value name="ARG0"><block type="variables_get" id="antdp_main_start_arg"><field name="VAR">start</field></block></value>
                                <value name="ARG1"><block type="variables_get" id="antdp_main_goal_arg"><field name="VAR">goal</field></block></value>
                                <value name="ARG2"><block type="variables_get" id="antdp_main_grid_arg"><field name="VAR">sugarGrid</field></block></value>
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
</xml>`;

export function loadDynamicAntDpExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Dynamic Ant DP example blocks: workspace is null');
    return;
  }

  try {
    console.log('📦 Loading Dynamic Ant DP example blocks into workspace...');
    workspace.clear();

    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dynamicAntDpExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist (even if toolbox doesn't include them)
        const variableNames = [
          'start', 'goal', 'sugarGrid',
          'rows', 'cols',
          'sr', 'sc', 'gr', 'gc',
          'rowsMinus1', 'colsMinus1',
          'dp', 'dpRow', 'prevRow',
          'r', 'c', 'sugar',
          'result',
          // injected by useCodeExecution for Ant levels:
          'startR', 'startC', 'goalR', 'goalC'
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

        console.log('✅ Dynamic Ant DP example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Dynamic Ant DP example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Dynamic Ant DP example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDynamicAntDpExampleBlocks:', error);
  }
}

export function getDynamicAntDpExampleXml() {
  return dynamicAntDpExampleXml;
}
