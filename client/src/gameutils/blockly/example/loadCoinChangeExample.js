// Helper function to load Coin Change example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Coin Change Example XML - Backtracking recursive solution (short version)
// Keeps signature: coinChange(amount, coins, index) and tracks decisions for final replay.
const coinChangeExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="coin_change_function" x="50" y="50">
    <field name="NAME">coinChange</field>
    <mutation>
      <arg name="amount"></arg>
      <arg name="coins"></arg>
      <arg name="index"></arg>
    </mutation>
    <comment pinned="false" h="80" w="320">Backtracking (short): compute include/exclude, track once, return min. Returns -1 if impossible.</comment>
    <statement name="STACK">
      <!-- if amount == 0 return 0 -->
      <block type="controls_if" id="cc_if_amount_zero">
        <value name="IF0">
          <block type="logic_compare" id="cc_amount_eq_0">
            <value name="A"><block type="variables_get" id="cc_amount_get0"><field name="VAR">amount</field></block></value>
            <field name="OP">EQ</field>
            <value name="B"><block type="math_number" id="cc_zero0"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="procedures_return" id="cc_return0">
            <value name="VALUE"><block type="math_number" id="cc_zero_ret"><field name="NUM">0</field></block></value>
          </block>
        </statement>
        <next>
          <!-- if amount < 0 OR index >= coins.length return -1 -->
          <block type="controls_if" id="cc_if_invalid">
            <value name="IF0">
              <block type="logic_operation" id="cc_invalid_or">
                <field name="OP">OR</field>
                <value name="A">
                  <block type="logic_compare" id="cc_amount_lt_0">
                    <value name="A"><block type="variables_get" id="cc_amount_get_neg"><field name="VAR">amount</field></block></value>
                    <field name="OP">LT</field>
                    <value name="B"><block type="math_number" id="cc_zero1"><field name="NUM">0</field></block></value>
                  </block>
                </value>
                <value name="B">
                  <block type="logic_compare" id="cc_index_gte_len">
                    <value name="A"><block type="variables_get" id="cc_index_get_oob"><field name="VAR">index</field></block></value>
                    <field name="OP">GTE</field>
                    <value name="B">
                      <block type="lists_length" id="cc_coins_len">
                        <value name="VALUE"><block type="variables_get" id="cc_coins_get_len"><field name="VAR">coins</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="procedures_return" id="cc_return_neg1_invalid">
                <value name="VALUE"><block type="math_number" id="cc_neg1_invalid"><field name="NUM">-1</field></block></value>
              </block>
            </statement>
            <next>
              <!-- let coin = coins[index] -->
              <block type="local_variable_set" id="cc_set_coin">
                <field name="VAR">coin</field>
                <value name="VALUE">
                  <block type="lists_get_at_index" id="cc_coin_at_index">
<value name="LIST"><block type="variables_get" id="cc_coins_get_item"><field name="VAR">coins</field></block></value>
<value name="INDEX"><block type="variables_get" id="cc_index_get_item"><field name="VAR">index</field></block></value>
</block>
                </value>
                <next>
                  <!-- let include = -1 -->
                  <block type="local_variable_set" id="cc_set_include_init">
                    <field name="VAR">include</field>
                    <value name="VALUE"><block type="math_number" id="cc_neg1_inc_init"><field name="NUM">-1</field></block></value>
                    <next>
                      <!-- let exclude = -1 -->
                      <block type="local_variable_set" id="cc_set_exclude_init">
                        <field name="VAR">exclude</field>
                        <value name="VALUE"><block type="math_number" id="cc_neg1_exc_init"><field name="NUM">-1</field></block></value>
                        <next>
                          <!-- if amount >= coin then include = coinChange(amount-coin, coins, index); if include != -1 include = include+1 -->
                          <block type="controls_if" id="cc_if_can_include">
                            <value name="IF0">
                              <block type="logic_compare" id="cc_amount_gte_coin">
                                <value name="A"><block type="variables_get" id="cc_amount_get_gte"><field name="VAR">amount</field></block></value>
                                <field name="OP">GTE</field>
                                <value name="B"><block type="variables_get" id="cc_coin_get_gte"><field name="VAR">coin</field></block></value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="coin_change_add_warrior_to_selection" id="cc_pick_coin">
                                <value name="WARRIOR_INDEX"><block type="variables_get" id="cc_index_get_pick"><field name="VAR">index</field></block></value>
                                <next>
                              <block type="variables_set" id="cc_set_include_call">
                                <field name="VAR">include</field>
                                <value name="VALUE">
                                  <block type="procedures_callreturn" id="cc_call_include">
                                    <mutation name="coinChange">
                                      <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
                                    </mutation>
                                    <field name="NAME">coinChange</field>
                                    <value name="ARG0">
                                      <block type="math_arithmetic" id="cc_amount_minus_coin">
                                        <value name="A"><block type="variables_get" id="cc_amount_get_sub"><field name="VAR">amount</field></block></value>
                                        <field name="OP">MINUS</field>
                                        <value name="B"><block type="variables_get" id="cc_coin_get_sub"><field name="VAR">coin</field></block></value>
                                      </block>
                                    </value>
                                    <value name="ARG1"><block type="variables_get" id="cc_coins_get_inc"><field name="VAR">coins</field></block></value>
                                    <value name="ARG2"><block type="variables_get" id="cc_index_get_inc"><field name="VAR">index</field></block></value>
                                  </block>
                                </value>
                                <next>
                                  <block type="controls_if" id="cc_if_include_valid">
                                    <value name="IF0">
                                      <block type="logic_compare" id="cc_include_neq_neg1">
                                        <value name="A"><block type="variables_get" id="cc_include_get_chk"><field name="VAR">include</field></block></value>
                                        <field name="OP">NEQ</field>
                                        <value name="B"><block type="math_number" id="cc_neg1_chk"><field name="NUM">-1</field></block></value>
                                      </block>
                                    </value>
                                    <statement name="DO0">
                                      <block type="variables_set" id="cc_set_include_plus1">
                                        <field name="VAR">include</field>
                                        <value name="VALUE">
                                          <block type="math_arithmetic" id="cc_include_plus1">
                                            <value name="A"><block type="variables_get" id="cc_include_get_add"><field name="VAR">include</field></block></value>
                                            <field name="OP">ADD</field>
                                            <value name="B"><block type="math_number" id="cc_one_add"><field name="NUM">1</field></block></value>
                                          </block>
                                        </value>
                                      </block>
                                    </statement>
                                    <next>
                                      <block type="coin_change_remove_warrior" id="cc_remove_coin"></block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </statement>
                        <next>
                          <!-- exclude = coinChange(amount, coins, index+1) -->
                          <block type="variables_set" id="cc_set_exclude_call">
                            <field name="VAR">exclude</field>
                            <value name="VALUE">
                              <block type="procedures_callreturn" id="cc_call_exclude">
                                <mutation name="coinChange">
                                  <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
                                </mutation>
                                <field name="NAME">coinChange</field>
                                <value name="ARG0"><block type="variables_get" id="cc_amount_get_exc"><field name="VAR">amount</field></block></value>
                                <value name="ARG1"><block type="variables_get" id="cc_coins_get_exc"><field name="VAR">coins</field></block></value>
                                <value name="ARG2">
                                  <block type="math_arithmetic" id="cc_index_plus1">
                                    <value name="A"><block type="variables_get" id="cc_index_get_add1"><field name="VAR">index</field></block></value>
                                    <field name="OP">ADD</field>
                                    <value name="B"><block type="math_number" id="cc_one_add1"><field name="NUM">1</field></block></value>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <next>
                              <!-- track decision once -->
                                  <block type="coin_change_track_decision" id="cc_track_decision">
                                    <value name="AMOUNT"><block type="variables_get" id="cc_amount_get_track"><field name="VAR">amount</field></block></value>
                                    <value name="INDEX"><block type="variables_get" id="cc_index_get_track"><field name="VAR">index</field></block></value>
                                    <value name="INCLUDE"><block type="variables_get" id="cc_include_get_track"><field name="VAR">include</field></block></value>
                                    <value name="EXCLUDE"><block type="variables_get" id="cc_exclude_get_track"><field name="VAR">exclude</field></block></value>
                                    <next>
                                      <!-- if include == -1 return exclude -->
                                      <block type="controls_if" id="cc_if_include_neg1">
                                        <value name="IF0">
                                          <block type="logic_compare" id="cc_include_eq_neg1">
                                            <value name="A"><block type="variables_get" id="cc_include_get_eq"><field name="VAR">include</field></block></value>
                                            <field name="OP">EQ</field>
                                            <value name="B"><block type="math_number" id="cc_neg1_eq1"><field name="NUM">-1</field></block></value>
                                          </block>
                                        </value>
                                        <statement name="DO0">
                                          <block type="procedures_return" id="cc_return_exclude_when_inc_bad">
                                            <value name="VALUE"><block type="variables_get" id="cc_exclude_get_ret1"><field name="VAR">exclude</field></block></value>
                                          </block>
                                        </statement>
                                        <next>
                                          <!-- if exclude == -1 return include -->
                                          <block type="controls_if" id="cc_if_exclude_neg1">
                                            <value name="IF0">
                                              <block type="logic_compare" id="cc_exclude_eq_neg1">
                                                <value name="A"><block type="variables_get" id="cc_exclude_get_eq"><field name="VAR">exclude</field></block></value>
                                                <field name="OP">EQ</field>
                                                <value name="B"><block type="math_number" id="cc_neg1_eq2"><field name="NUM">-1</field></block></value>
                                              </block>
                                            </value>
                                            <statement name="DO0">
                                              <block type="procedures_return" id="cc_return_include_when_exc_bad">
                                                <value name="VALUE"><block type="variables_get" id="cc_include_get_ret2"><field name="VAR">include</field></block></value>
                                              </block>
                                            </statement>
                                            <next>
                                              <!-- return min(include, exclude) -->
                                              <block type="procedures_return" id="cc_return_min">
                                                <value name="VALUE">
                                                  <block type="math_min" id="cc_min_ie">
                                                    <value name="A"><block type="variables_get" id="cc_include_get_min"><field name="VAR">include</field></block></value>
                                                    <value name="B"><block type="variables_get" id="cc_exclude_get_min"><field name="VAR">exclude</field></block></value>
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

  <!-- Main: result = coinChange(monster_power, warriors, 0) -->
  <block type="variables_set" id="main_result_set" x="50" y="720">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="coinChange">
          <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
        </mutation>
        <field name="NAME">coinChange</field>
        <value name="ARG0"><block type="variables_get" id="monster_power_var"><field name="VAR">monster_power</field></block></value>
        <value name="ARG1"><block type="variables_get" id="warriors_var"><field name="VAR">warriors</field></block></value>
        <value name="ARG2"><block type="math_number" id="zero_index"><field name="NUM">0</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

/**
 * Load Coin Change example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace to load blocks into
 */
export function loadCoinChangeExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Coin Change example blocks: workspace is null');
    return;
  }

  try {
    // console.log removed('📦 Loading Coin Change example blocks into workspace...');

    // Clear workspace first
    if (workspace._starterListener) {
      workspace.removeChangeListener(workspace._starterListener);
      workspace._starterListener = null;
    }
    Blockly.Events.disable();
    workspace.clear();
    Blockly.Events.enable();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(coinChangeExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = ['amount', 'coins', 'index', 'coin', 'include', 'exclude', 'monster_power', 'warriors', 'result'];
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

        // console.log removed('✅ Coin Change example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Coin Change example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Coin Change example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadCoinChangeExampleBlocks:', error);
  }
}

/**
 * Get Coin Change example XML as string
 * @returns {string} XML string
 */
export function getCoinChangeExampleXml() {
  return coinChangeExampleXml;
}

