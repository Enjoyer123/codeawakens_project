// Helper function to load Coin Change example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Coin Change Example XML — Real Backtracking (Pick/Skip binary tree)
// Signature: coinChange(amount, coins, index)
// Pick = use coin[index] again (amount - coin, same index)
// Skip = don't use coin[index] anymore (same amount, index + 1)
const coinChangeExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="cc_function" x="50" y="50">
    <mutation>
      <arg name="amount"></arg>
      <arg name="coins"></arg>
      <arg name="index"></arg>
    </mutation>
    <field name="NAME">coinChange</field>
    <comment pinned="false" h="80" w="320">Backtracking: Pick (ใช้เหรียญซ้ำ) / Skip (ข้ามไปชนิดถัดไป)</comment>
    <statement name="STACK">
      <!-- Consider current coin -->
      <block type="coin_change_consider">
        <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
        <next>
          <!-- Base case 1: amount == 0 → found exact change -->
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="variables_get"><field name="VAR">amount</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="procedures_return">
                <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </statement>
            <next>
              <!-- Base case 2: amount < 0 OR index >= coins.length → impossible -->
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_operation">
                    <field name="OP">OR</field>
                    <value name="A">
                      <block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR">amount</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block>
                    </value>
                    <value name="B">
                      <block type="logic_compare">
                        <field name="OP">GTE</field>
                        <value name="A"><block type="variables_get"><field name="VAR">index</field></block></value>
                        <value name="B">
                          <block type="lists_length">
                            <value name="VALUE"><block type="variables_get"><field name="VAR">coins</field></block></value>
                          </block>
                        </value>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="procedures_return">
                    <value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value>
                  </block>
                </statement>
                <next>
                  <!-- let coin = coins[index] -->
                  <block type="local_variable_set">
                    <field name="VAR">coin</field>
                    <value name="VALUE">
                      <block type="lists_get_at_index">
                        <value name="LIST"><block type="variables_get"><field name="VAR">coins</field></block></value>
                        <value name="INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                      </block>
                    </value>
                    <next>
                      <!-- let include = -1 -->
                      <block type="local_variable_set">
                        <field name="VAR">include</field>
                        <value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value>
                        <next>
                          <!-- let exclude = -1 -->
                          <block type="local_variable_set">
                            <field name="VAR">exclude</field>
                            <value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value>
                            <next>
                              <!-- PRUNING CHECK: if coin <= amount → pick branch -->
                              <block type="controls_if">
                                <mutation else="1"></mutation>
                                <value name="IF0">
                                  <block type="logic_compare">
                                    <field name="OP">LTE</field>
                                    <value name="A"><block type="variables_get"><field name="VAR">coin</field></block></value>
                                    <value name="B"><block type="variables_get"><field name="VAR">amount</field></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <!-- === PICK BRANCH: use this coin === -->
                                  <block type="lists_add_item">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">selection</field></block></value>
                                    <value name="ITEM"><block type="variables_get"><field name="VAR">index</field></block></value>
                                    <next>
                                      <block type="coin_change_pick_coin">
                                        <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                        <next>
                                          <!-- include = coinChange(amount - coin, coins, index) -->
                                          <block type="variables_set">
                                            <field name="VAR">include</field>
                                            <value name="VALUE">
                                              <block type="procedures_callreturn">
                                                <mutation name="coinChange">
                                                  <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
                                                </mutation>
                                                <value name="ARG0">
                                                  <block type="math_arithmetic">
                                                    <field name="OP">MINUS</field>
                                                    <value name="A"><block type="variables_get"><field name="VAR">amount</field></block></value>
                                                    <value name="B"><block type="variables_get"><field name="VAR">coin</field></block></value>
                                                  </block>
                                                </value>
                                                <value name="ARG1"><block type="variables_get"><field name="VAR">coins</field></block></value>
                                                <value name="ARG2"><block type="variables_get"><field name="VAR">index</field></block></value>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- if include != -1 → include += 1 -->
                                              <block type="controls_if">
                                                <value name="IF0">
                                                  <block type="logic_compare">
                                                    <field name="OP">NEQ</field>
                                                    <value name="A"><block type="variables_get"><field name="VAR">include</field></block></value>
                                                    <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                                                  </block>
                                                </value>
                                                <statement name="DO0">
                                                  <block type="variables_set">
                                                    <field name="VAR">include</field>
                                                    <value name="VALUE">
                                                      <block type="math_arithmetic">
                                                        <field name="OP">ADD</field>
                                                        <value name="A"><block type="variables_get"><field name="VAR">include</field></block></value>
                                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                                      </block>
                                                    </value>
                                                  </block>
                                                </statement>
                                                <next>
                                                  <!-- Backtrack: pop from selection -->
                                                  <block type="lists_remove_last">
                                                    <value name="LIST"><block type="variables_get"><field name="VAR">selection</field></block></value>
                                                    <next>
                                                      <block type="coin_change_remove_coin">
                                                        <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
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
                                <statement name="ELSE">
                                  <!-- Pruned! coin too big -->
                                  <block type="coin_change_prune_skip">
                                    <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                  </block>
                                </statement>
                                <next>
                                  <!-- === SKIP BRANCH: don't use this coin type, go to next === -->
                                  <block type="coin_change_skip_coin">
                                    <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                    <next>
                                      <!-- exclude = coinChange(amount, coins, index + 1) -->
                                      <block type="variables_set">
                                        <field name="VAR">exclude</field>
                                        <value name="VALUE">
                                          <block type="procedures_callreturn">
                                            <mutation name="coinChange">
                                              <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
                                            </mutation>
                                            <value name="ARG0"><block type="variables_get"><field name="VAR">amount</field></block></value>
                                            <value name="ARG1"><block type="variables_get"><field name="VAR">coins</field></block></value>
                                            <value name="ARG2">
                                              <block type="math_arithmetic">
                                                <field name="OP">ADD</field>
                                                <value name="A"><block type="variables_get"><field name="VAR">index</field></block></value>
                                                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <next>
                                          <block type="coin_change_remove_coin">
                                            <value name="COIN_INDEX"><block type="variables_get"><field name="VAR">index</field></block></value>
                                            <next>
                                              <!-- Return best result -->
                                              <!-- if include == -1 → return exclude -->
                                              <block type="controls_if">
                                                <value name="IF0">
                                                  <block type="logic_compare">
                                                    <field name="OP">EQ</field>
                                                    <value name="A"><block type="variables_get"><field name="VAR">include</field></block></value>
                                                    <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                                                  </block>
                                                </value>
                                                <statement name="DO0">
                                                  <block type="procedures_return">
                                                    <value name="VALUE"><block type="variables_get"><field name="VAR">exclude</field></block></value>
                                                  </block>
                                                </statement>
                                                <next>
                                                  <!-- if exclude == -1 → return include -->
                                                  <block type="controls_if">
                                                    <value name="IF0">
                                                      <block type="logic_compare">
                                                        <field name="OP">EQ</field>
                                                        <value name="A"><block type="variables_get"><field name="VAR">exclude</field></block></value>
                                                        <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                                                      </block>
                                                    </value>
                                                    <statement name="DO0">
                                                      <block type="procedures_return">
                                                        <value name="VALUE"><block type="variables_get"><field name="VAR">include</field></block></value>
                                                      </block>
                                                    </statement>
                                                    <next>
                                                      <!-- return min(include, exclude) -->
                                                      <block type="procedures_return">
                                                        <value name="VALUE">
                                                          <block type="math_min">
                                                            <value name="A"><block type="variables_get"><field name="VAR">include</field></block></value>
                                                            <value name="B"><block type="variables_get"><field name="VAR">exclude</field></block></value>
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
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <!-- Main: result = coinChange(monster_power, warriors, 0) -->
  <block type="variables_game_input" x="50" y="720"><field name="VAR">monster_power</field><next><block type="variables_game_input"><field name="VAR">warriors</field><next><block type="variables_game_input"><field name="VAR">selection</field><next>
  <block type="variables_set" id="main_result_set">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="coinChange">
          <arg name="amount"></arg><arg name="coins"></arg><arg name="index"></arg>
        </mutation>
        <field name="NAME">coinChange</field>
        <value name="ARG0"><block type="variables_get"><field name="VAR">monster_power</field></block></value>
        <value name="ARG1"><block type="variables_get"><field name="VAR">warriors</field></block></value>
        <value name="ARG2"><block type="math_number"><field name="NUM">0</field></block></value>
      </block>
    </value>
  </block>
  </next></block></next></block></next></block>
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
        const variableNames = ['amount', 'coins', 'index', 'coin', 'include', 'exclude', 'monster_power', 'warriors', 'result', 'selection'];
        variableNames.forEach(varName => {
          try {
            const variableMap = workspace.getVariableMap();
            if (variableMap) {
              const existingVar = variableMap.getVariable(varName);
              if (!existingVar) {
                workspace.createVariable(varName);
              }
            } else {
              workspace.createVariable(varName);
            }
          } catch (e) {
            console.debug(`Variable ${varName} already exists or error creating:`, e);
          }
        });
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
