// Helper function to load Dynamic Programming Coin Change example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dynamic Coin Change Example XML - Bottom-up DP (unbounded) for minimum coins
// Signature compatible with existing tests/calls: coinChange(amount, coins, index)
// Uses coins from index..end only. Returns min coins, or -1 if impossible.
const dynamicCoinChangeExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="coin_change_dp_function" x="50" y="50">
    <field name="NAME">coinChange</field>
    <mutation>
      <arg name="amount"></arg>
      <arg name="coins"></arg>
      <arg name="index"></arg>
    </mutation>
    <comment pinned="false" h="90" w="380">DP bottom-up (unbounded): dp[a]=min coins to make a using coins[index..]. Return -1 if impossible.</comment>
    <statement name="STACK">
      <!-- if amount == 0 return 0 -->
      <block type="if_only" id="cc_dp_if_amount_zero">
        <value name="CONDITION">
          <block type="logic_compare" id="cc_dp_amount_eq_0">
            <value name="A"><block type="variables_get" id="cc_dp_amount_get0"><field name="VAR">amount</field></block></value>
            <field name="OP">EQ</field>
            <value name="B"><block type="math_number" id="cc_dp_zero0"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO">
          <block type="procedures_return" id="cc_dp_return_0">
            <value name="VALUE"><block type="math_number" id="cc_dp_zero_ret"><field name="NUM">0</field></block></value>
          </block>
        </statement>
        <next>
          <!-- if amount < 0 return -1 -->
          <block type="if_only" id="cc_dp_if_amount_neg">
            <value name="CONDITION">
              <block type="logic_compare" id="cc_dp_amount_lt_0">
                <value name="A"><block type="variables_get" id="cc_dp_amount_get_neg"><field name="VAR">amount</field></block></value>
                <field name="OP">LT</field>
                <value name="B"><block type="math_number" id="cc_dp_zero1"><field name="NUM">0</field></block></value>
              </block>
            </value>
            <statement name="DO">
              <block type="procedures_return" id="cc_dp_return_neg1a">
                <value name="VALUE"><block type="math_number" id="cc_dp_neg1a"><field name="NUM">-1</field></block></value>
              </block>
            </statement>
            <next>
              <!-- n = coins.length -->
              <block type="variables_set" id="cc_dp_set_n">
                <field name="VAR">n</field>
                <value name="VALUE">
                  <block type="lists_length" id="cc_dp_coins_len">
                    <value name="VALUE"><block type="variables_get" id="cc_dp_coins_get_len"><field name="VAR">coins</field></block></value>
                  </block>
                </value>
                <next>
                  <!-- if index >= n return -1 -->
                  <block type="if_only" id="cc_dp_if_index_oob">
                    <value name="CONDITION">
                      <block type="logic_compare" id="cc_dp_index_gte_n">
                        <value name="A"><block type="variables_get" id="cc_dp_index_get_oob"><field name="VAR">index</field></block></value>
                        <field name="OP">GTE</field>
                        <value name="B"><block type="variables_get" id="cc_dp_n_get_oob"><field name="VAR">n</field></block></value>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="procedures_return" id="cc_dp_return_neg1b">
                        <value name="VALUE"><block type="math_number" id="cc_dp_neg1b"><field name="NUM">-1</field></block></value>
                      </block>
                    </statement>
                    <next>
                      <!-- INF = 999999 -->
                      <block type="variables_set" id="cc_dp_set_inf">
                        <field name="VAR">INF</field>
                        <value name="VALUE"><block type="math_number" id="cc_dp_inf_num"><field name="NUM">999999</field></block></value>
                        <next>
                          <!-- dp = [] -->
                          <block type="variables_set" id="cc_dp_set_dp_empty">
                            <field name="VAR">dp</field>
                            <value name="VALUE"><block type="lists_create_empty" id="cc_dp_dp_empty"></block></value>
                            <next>
                              <!-- for a=0..amount: dp.push(INF) -->
                              <block type="for_loop_dynamic" id="cc_dp_init_loop">
                                <field name="VAR">a</field>
                                <value name="FROM"><block type="math_number" id="cc_dp_a_from0"><field name="NUM">0</field></block></value>
                                <value name="TO"><block type="variables_get" id="cc_dp_amount_get_to"><field name="VAR">amount</field></block></value>
                                <statement name="DO">
                                  <block type="lists_add_item" id="cc_dp_dp_push_inf">
                                    <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_push"><field name="VAR">dp</field></block></value>
                                    <value name="ITEM"><block type="variables_get" id="cc_dp_inf_get_push"><field name="VAR">INF</field></block></value>
                                  </block>
                                </statement>
                                <next>
                                  <!-- dp[0] = 0 -->
                                  <block type="lists_setIndex" id="cc_dp_set_dp0">
                                    <field name="MODE">SET</field>
                                    <field name="WHERE">FROM_START</field>
                                    <value name="LIST"><block type="variables_get" id="cc_dp_dp_get0"><field name="VAR">dp</field></block></value>
                                    <value name="AT"><block type="math_number" id="cc_dp_at0"><field name="NUM">0</field></block></value>
                                    <value name="TO"><block type="math_number" id="cc_dp_zero_dp"><field name="NUM">0</field></block></value>
                                    <next>
                                      <!-- for coinIndex=index..n-1 -->
                                      <block type="for_loop_dynamic" id="cc_dp_coin_loop">
                                        <field name="VAR">coinIndex</field>
                                        <value name="FROM"><block type="variables_get" id="cc_dp_index_get_from"><field name="VAR">index</field></block></value>
                                        <value name="TO">
                                          <block type="math_arithmetic" id="cc_dp_n_minus1">
                                            <value name="A"><block type="variables_get" id="cc_dp_n_get_m1"><field name="VAR">n</field></block></value>
                                            <field name="OP">MINUS</field>
                                            <value name="B"><block type="math_number" id="cc_dp_one_m1"><field name="NUM">1</field></block></value>
                                          </block>
                                        </value>
                                        <statement name="DO">
                                          <!-- coin = coins[coinIndex] -->
                                          <block type="variables_set" id="cc_dp_set_coin">
                                            <field name="VAR">coin</field>
                                            <value name="VALUE">
                                              <block type="lists_get_at_index" id="cc_dp_coins_at_coinIndex">
                                                <value name="LIST"><block type="variables_get" id="cc_dp_coins_get_item"><field name="VAR">coins</field></block></value>
                                                <value name="INDEX"><block type="variables_get" id="cc_dp_coinIndex_get"><field name="VAR">coinIndex</field></block></value>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- for a=coin..amount -->
                                              <block type="for_loop_dynamic" id="cc_dp_amount_loop">
                                                <field name="VAR">a</field>
                                                <value name="FROM"><block type="variables_get" id="cc_dp_coin_get_from"><field name="VAR">coin</field></block></value>
                                                <value name="TO"><block type="variables_get" id="cc_dp_amount_get_to2"><field name="VAR">amount</field></block></value>
                                                <statement name="DO">
                                                  <!-- cand = dp[a-coin] -->
                                                  <block type="variables_set" id="cc_dp_set_cand">
                                                    <field name="VAR">cand</field>
                                                    <value name="VALUE">
                                                      <block type="lists_get_at_index" id="cc_dp_dp_at_a_minus_coin">
                                                        <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_a1"><field name="VAR">dp</field></block></value>
                                                        <value name="INDEX">
                                                          <block type="math_arithmetic" id="cc_dp_a_minus_coin">
                                                            <value name="A"><block type="variables_get" id="cc_dp_a_get_m"><field name="VAR">a</field></block></value>
                                                            <field name="OP">MINUS</field>
                                                            <value name="B"><block type="variables_get" id="cc_dp_coin_get_m"><field name="VAR">coin</field></block></value>
                                                          </block>
                                                        </value>
                                                      </block>
                                                    </value>
                                                    <next>
                                                      <!-- if cand != INF then dp[a] = min(dp[a], cand+1) -->
                                                      <block type="if_only" id="cc_dp_if_cand_valid">
                                                        <value name="CONDITION">
                                                          <block type="logic_compare" id="cc_dp_cand_neq_inf">
                                                            <value name="A"><block type="variables_get" id="cc_dp_cand_get"><field name="VAR">cand</field></block></value>
                                                            <field name="OP">NEQ</field>
                                                            <value name="B"><block type="variables_get" id="cc_dp_inf_get_cmp"><field name="VAR">INF</field></block></value>
                                                          </block>
                                                        </value>
                                                        <statement name="DO">
                                                          <block type="lists_setIndex" id="cc_dp_set_dp_a">
                                                            <field name="MODE">SET</field>
                                                            <field name="WHERE">FROM_START</field>
                                                            <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_set"><field name="VAR">dp</field></block></value>
                                                            <value name="AT"><block type="variables_get" id="cc_dp_a_get_at"><field name="VAR">a</field></block></value>
                                                            <value name="TO">
                                                              <block type="math_min" id="cc_dp_min_expr">
                                                                <value name="A">
                                                                  <block type="lists_get_at_index" id="cc_dp_dp_at_a">
                                                                    <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_a2"><field name="VAR">dp</field></block></value>
                                                                    <value name="INDEX"><block type="variables_get" id="cc_dp_a_get_idx"><field name="VAR">a</field></block></value>
                                                                  </block>
                                                                </value>
                                                                <value name="B">
                                                                  <block type="math_arithmetic" id="cc_dp_cand_plus_1">
                                                                    <value name="A"><block type="variables_get" id="cc_dp_cand_get2"><field name="VAR">cand</field></block></value>
                                                                    <field name="OP">ADD</field>
                                                                    <value name="B"><block type="math_number" id="cc_dp_one"><field name="NUM">1</field></block></value>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                          </block>
                                                        </statement>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </statement>
                                              </block>
                                            </next>
                                          </block>
                                        </statement>
                                        <next>
                                          <!-- if dp[amount] == INF return -1 else return dp[amount] -->
                                          <block type="if_else" id="cc_dp_return_block">
                                            <value name="CONDITION">
                                              <block type="logic_compare" id="cc_dp_dp_amount_eq_inf">
                                                <value name="A">
                                                  <block type="lists_get_at_index" id="cc_dp_dp_at_amount">
                                                    <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_final"><field name="VAR">dp</field></block></value>
                                                    <value name="INDEX"><block type="variables_get" id="cc_dp_amount_get_final"><field name="VAR">amount</field></block></value>
                                                  </block>
                                                </value>
                                                <field name="OP">EQ</field>
                                                <value name="B"><block type="variables_get" id="cc_dp_inf_get_final"><field name="VAR">INF</field></block></value>
                                              </block>
                                            </value>
                                            <statement name="IF_DO">
                                              <block type="procedures_return" id="cc_dp_return_neg1_final">
                                                <value name="VALUE"><block type="math_number" id="cc_dp_neg1_final"><field name="NUM">-1</field></block></value>
                                              </block>
                                            </statement>
                                            <statement name="ELSE_DO">
                                              <block type="procedures_return" id="cc_dp_return_dp_final">
                                                <value name="VALUE">
                                                  <block type="lists_get_at_index" id="cc_dp_dp_at_amount2">
                                                    <value name="LIST"><block type="variables_get" id="cc_dp_dp_get_final2"><field name="VAR">dp</field></block></value>
                                                    <value name="INDEX"><block type="variables_get" id="cc_dp_amount_get_final2"><field name="VAR">amount</field></block></value>
                                                  </block>
                                                </value>
                                              </block>
                                            </statement>
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

  <!-- Main code: result = coinChange(monster_power, warriors, 0) -->
  <block type="variables_set" id="cc_dp_main_result_set" x="50" y="760">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="cc_dp_call_main">
        <mutation name="coinChange">
          <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
        </mutation>
        <field name="NAME">coinChange</field>
        <value name="ARG0"><block type="variables_get" id="cc_dp_monster_power_var"><field name="VAR">monster_power</field></block></value>
        <value name="ARG1"><block type="variables_get" id="cc_dp_warriors_var"><field name="VAR">warriors</field></block></value>
        <value name="ARG2"><block type="math_number" id="cc_dp_zero_index"><field name="NUM">0</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

/**
 * Load Dynamic Coin Change (DP) example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace to load blocks into
 */
export function loadDynamicCoinChangeExampleBlocks(workspace) {
  if (!workspace) {
    console.error('❌ Cannot load Dynamic Coin Change example: workspace is null');
    return;
  }

  try {
    console.log('➕ Loading Dynamic Coin Change (DP) example blocks into workspace...');
    workspace.clear();

    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dynamicCoinChangeExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        const variableNames = [
          'amount', 'coins', 'index',
          'monster_power', 'warriors', 'result',
          'n', 'INF', 'dp', 'a', 'coinIndex', 'coin', 'cand'
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

        console.log('✅ Dynamic Coin Change (DP) example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Dynamic Coin Change example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Dynamic Coin Change example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDynamicCoinChangeExampleBlocks:', error);
  }
}

export function getDynamicCoinChangeExampleXml() {
  return dynamicCoinChangeExampleXml;
}


