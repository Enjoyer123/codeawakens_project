// Helper function to load Greedy Coin Change example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Greedy Coin Change Example XML
// Signature compatible with existing tests/calls: coinChange(amount, coins, index)
// Greedy strategy: repeatedly pick the largest coin <= amount from coins[index..] until amount == 0.
// Returns number of coins used, or -1 if impossible.
const greedyCoinChangeExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="coin_change_greedy_function" x="50" y="50">
    <field name="NAME">coinChange</field>
    <mutation>
      <arg name="amount"></arg>
      <arg name="coins"></arg>
      <arg name="index"></arg>
    </mutation>
    <comment pinned="false" h="90" w="420">Greedy: choose the largest coin &lt;= amount (scan coins[index..]) repeatedly. Return count, or -1 if stuck.</comment>
    <statement name="STACK">
      <!-- if amount == 0 return 0 -->
      <block type="if_only" id="ccg_if_amount_zero">
        <value name="CONDITION">
          <block type="logic_compare" id="ccg_amount_eq_0">
            <value name="A"><block type="variables_get" id="ccg_amount_get0"><field name="VAR">amount</field></block></value>
            <field name="OP">EQ</field>
            <value name="B"><block type="math_number" id="ccg_zero0"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO">
          <block type="procedures_return" id="ccg_return0">
            <value name="VALUE"><block type="math_number" id="ccg_zero_ret"><field name="NUM">0</field></block></value>
          </block>
        </statement>
        <next>
          <!-- n = coins.length -->
          <block type="variables_set" id="ccg_set_n">
            <field name="VAR">n</field>
            <value name="VALUE">
              <block type="lists_length" id="ccg_coins_len">
                <value name="VALUE"><block type="variables_get" id="ccg_coins_get_len"><field name="VAR">coins</field></block></value>
              </block>
            </value>
            <next>
              <!-- if index >= n return -1 -->
              <block type="if_only" id="ccg_if_index_oob">
                <value name="CONDITION">
                  <block type="logic_compare" id="ccg_index_gte_n">
                    <value name="A"><block type="variables_get" id="ccg_index_get_oob"><field name="VAR">index</field></block></value>
                    <field name="OP">GTE</field>
                    <value name="B"><block type="variables_get" id="ccg_n_get_oob"><field name="VAR">n</field></block></value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="procedures_return" id="ccg_return_neg1_oob">
                    <value name="VALUE"><block type="math_number" id="ccg_neg1_oob"><field name="NUM">-1</field></block></value>
                  </block>
                </statement>
                <next>
                  <!-- count = 0 -->
                  <block type="variables_set" id="ccg_set_count0">
                    <field name="VAR">count</field>
                    <value name="VALUE"><block type="math_number" id="ccg_count0"><field name="NUM">0</field></block></value>
                    <next>
                      <!-- while amount > 0 -->
                      <block type="while_loop" id="ccg_while_amount_gt0">
                        <value name="CONDITION">
                          <block type="logic_compare" id="ccg_amount_gt0">
                            <value name="A"><block type="variables_get" id="ccg_amount_get_gt0"><field name="VAR">amount</field></block></value>
                            <field name="OP">GT</field>
                            <value name="B"><block type="math_number" id="ccg_zero1"><field name="NUM">0</field></block></value>
                          </block>
                        </value>
                        <statement name="DO">
                          <!-- bestIndex = -1 -->
                          <block type="variables_set" id="ccg_set_bestIndex">
                            <field name="VAR">bestIndex</field>
                            <value name="VALUE"><block type="math_number" id="ccg_bestIndex_neg1"><field name="NUM">-1</field></block></value>
                            <next>
                              <!-- bestValue = 0 -->
                              <block type="variables_set" id="ccg_set_bestValue">
                                <field name="VAR">bestValue</field>
                                <value name="VALUE"><block type="math_number" id="ccg_bestValue0"><field name="NUM">0</field></block></value>
                                <next>
                                  <!-- for i=index..n-1 -->
                                  <block type="for_loop_dynamic" id="ccg_for_i">
                                    <field name="VAR">i</field>
                                    <value name="FROM"><block type="variables_get" id="ccg_index_get_from"><field name="VAR">index</field></block></value>
                                    <value name="TO">
                                      <block type="math_arithmetic" id="ccg_n_minus1">
                                        <value name="A"><block type="variables_get" id="ccg_n_get_m1"><field name="VAR">n</field></block></value>
                                        <field name="OP">MINUS</field>
                                        <value name="B"><block type="math_number" id="ccg_one_m1"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                    <statement name="DO">
                                      <!-- coin = coins[i] -->
                                      <block type="variables_set" id="ccg_set_coin">
                                        <field name="VAR">coin</field>
                                        <value name="VALUE">
                                          <block type="lists_get_at_index" id="ccg_coins_at_i">
                                            <value name="LIST"><block type="variables_get" id="ccg_coins_get_i"><field name="VAR">coins</field></block></value>
                                            <value name="INDEX"><block type="variables_get" id="ccg_i_get"><field name="VAR">i</field></block></value>
                                          </block>
                                        </value>
                                        <next>
                                          <!-- if (coin <= amount) AND (coin > bestValue) then bestValue=coin; bestIndex=i -->
                                          <block type="if_only" id="ccg_if_better">
                                            <value name="CONDITION">
                                              <block type="logic_operation" id="ccg_and_cond">
                                                <field name="OP">AND</field>
                                                <value name="A">
                                                  <block type="logic_compare" id="ccg_coin_lte_amount">
                                                    <value name="A"><block type="variables_get" id="ccg_coin_get_lte"><field name="VAR">coin</field></block></value>
                                                    <field name="OP">LTE</field>
                                                    <value name="B"><block type="variables_get" id="ccg_amount_get_lte"><field name="VAR">amount</field></block></value>
                                                  </block>
                                                </value>
                                                <value name="B">
                                                  <block type="logic_compare" id="ccg_coin_gt_best">
                                                    <value name="A"><block type="variables_get" id="ccg_coin_get_gt"><field name="VAR">coin</field></block></value>
                                                    <field name="OP">GT</field>
                                                    <value name="B"><block type="variables_get" id="ccg_bestValue_get_gt"><field name="VAR">bestValue</field></block></value>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                            <statement name="DO">
                                              <block type="variables_set" id="ccg_set_bestValue_coin">
                                                <field name="VAR">bestValue</field>
                                                <value name="VALUE"><block type="variables_get" id="ccg_coin_get_assign_best"><field name="VAR">coin</field></block></value>
                                                <next>
                                                  <block type="variables_set" id="ccg_set_bestIndex_i">
                                                    <field name="VAR">bestIndex</field>
                                                    <value name="VALUE"><block type="variables_get" id="ccg_i_get_assign_best"><field name="VAR">i</field></block></value>
                                                  </block>
                                                </next>
                                              </block>
                                            </statement>
                                          </block>
                                        </next>
                                      </block>
                                    </statement>
                                    <next>
                                      <!-- if bestIndex == -1 return -1 else select + update -->
                                      <block type="if_else" id="ccg_if_stuck">
                                        <value name="CONDITION">
                                          <block type="logic_compare" id="ccg_bestIndex_eq_neg1">
                                            <value name="A"><block type="variables_get" id="ccg_bestIndex_get_eq"><field name="VAR">bestIndex</field></block></value>
                                            <field name="OP">EQ</field>
                                            <value name="B"><block type="math_number" id="ccg_neg1_cmp"><field name="NUM">-1</field></block></value>
                                          </block>
                                        </value>
                                        <statement name="IF_DO">
                                          <block type="procedures_return" id="ccg_return_neg1_stuck">
                                            <value name="VALUE"><block type="math_number" id="ccg_neg1_stuck"><field name="NUM">-1</field></block></value>
                                          </block>
                                        </statement>
                                        <statement name="ELSE_DO">
                                          <block type="coin_change_add_warrior_to_selection" id="ccg_select_best_coin">
                                            <value name="WARRIOR_INDEX"><block type="variables_get" id="ccg_bestIndex_get_sel"><field name="VAR">bestIndex</field></block></value>
                                            <next>
                                              <block type="variables_set" id="ccg_set_amount_minus_best">
                                                <field name="VAR">amount</field>
                                                <value name="VALUE">
                                                  <block type="math_arithmetic" id="ccg_amount_minus_bestValue">
                                                    <value name="A"><block type="variables_get" id="ccg_amount_get_sub2"><field name="VAR">amount</field></block></value>
                                                    <field name="OP">MINUS</field>
                                                    <value name="B"><block type="variables_get" id="ccg_bestValue_get_sub2"><field name="VAR">bestValue</field></block></value>
                                                  </block>
                                                </value>
                                                <next>
                                                  <block type="variables_set" id="ccg_set_count_plus1">
                                                    <field name="VAR">count</field>
                                                    <value name="VALUE">
                                                      <block type="math_arithmetic" id="ccg_count_plus1">
                                                        <value name="A"><block type="variables_get" id="ccg_count_get_add"><field name="VAR">count</field></block></value>
                                                        <field name="OP">ADD</field>
                                                        <value name="B"><block type="math_number" id="ccg_one_add"><field name="NUM">1</field></block></value>
                                                      </block>
                                                    </value>
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
                          <!-- return count -->
                          <block type="procedures_return" id="ccg_return_count">
                            <value name="VALUE"><block type="variables_get" id="ccg_count_get_ret"><field name="VAR">count</field></block></value>
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

  <!-- Main: result = coinChange(monster_power, warriors, 0) -->
  <block type="variables_set" id="ccg_main_result_set" x="50" y="780">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="ccg_call_main">
        <mutation name="coinChange">
          <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
        </mutation>
        <field name="NAME">coinChange</field>
        <value name="ARG0"><block type="variables_get" id="ccg_monster_power_var"><field name="VAR">monster_power</field></block></value>
        <value name="ARG1"><block type="variables_get" id="ccg_warriors_var"><field name="VAR">warriors</field></block></value>
        <value name="ARG2"><block type="math_number" id="ccg_zero_index"><field name="NUM">0</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

export function loadGreedyCoinChangeExampleBlocks(workspace) {
  if (!workspace) {
    console.error('❌ Cannot load Greedy Coin Change example: workspace is null');
    return;
  }

  try {
    console.log('➕ Loading Greedy Coin Change example blocks into workspace...');
    workspace.clear();

    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(greedyCoinChangeExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        const variableNames = [
          'amount', 'coins', 'index',
          'monster_power', 'warriors', 'result',
          'n', 'count', 'bestIndex', 'bestValue', 'i', 'coin'
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

        console.log('✅ Greedy Coin Change example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Greedy Coin Change example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Greedy Coin Change example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadGreedyCoinChangeExampleBlocks:', error);
  }
}

export function getGreedyCoinChangeExampleXml() {
  return greedyCoinChangeExampleXml;
}


