// Helper function to load Dynamic Programming Coin Change example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dynamic Coin Change Example XML - Bottom-up DP (unbounded) for minimum coins
// Signature compatible with existing tests/calls: coinChange(amount, coins, index)
const dynamicCoinChangeExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Function Definition -->
  <block type="procedures_defreturn" id="dp_function" x="50" y="50">
    <mutation>
      <arg name="amount"></arg>
      <arg name="coins"></arg>
      <arg name="index"></arg>
    </mutation>
    <field name="NAME">coinChange</field>
    <comment pinned="false" h="80" w="320">Bottom-Up DP Step-by-Step</comment>
    <statement name="STACK">
      <!-- Initialization -->
      <block type="variables_set" id="init_dp">
        <field name="VAR">dp</field>
        <value name="VALUE">
          <block type="lists_create_with"><mutation items="0"></mutation></block>
        </value>
        <next>
          <block type="variables_set" id="init_coin_used">
            <field name="VAR">combo</field>
            <value name="VALUE">
              <block type="lists_create_with"><mutation items="0"></mutation></block>
            </value>
            <next>
              <!-- Loop to initialize dp array with 999999 and combo with empty array -->
              <block type="controls_for" id="init_loop">
                <field name="VAR">i</field>
                <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                <value name="TO"><block type="variables_get"><field name="VAR">amount</field></block></value>
                <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                <statement name="DO">
                   <block type="lists_add_item">
                     <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                     <value name="ITEM"><block type="math_number"><field name="NUM">999999</field></block></value>
                     <next>
                       <block type="lists_add_item">
                         <value name="LIST"><block type="variables_get"><field name="VAR">combo</field></block></value>
                         <value name="ITEM"><block type="lists_create_with"><mutation items="0"></mutation></block></value>
                       </block>
                     </next>
                   </block>
                </statement>
                <next>
                  <!-- Base Case: dp[0] = 0 -->
                  <block type="lists_setIndex" id="base_case">
                    <field name="MODE">SET</field>
                    <field name="WHERE">FROM_START</field>
                    <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                    <value name="AT"><block type="math_number"><field name="NUM">0</field></block></value>
                    <value name="TO"><block type="math_number"><field name="NUM">0</field></block></value>
                    <next>
                      <!-- Outer Loop: for curr_amount = 1 to amount -->
                      <block type="controls_for" id="outer_loop">
                        <field name="VAR">curr_amount</field>
                        <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
                        <value name="TO"><block type="variables_get"><field name="VAR">amount</field></block></value>
                        <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                        <statement name="DO">
                          <!-- Emit outer loop trace -->
                          <block type="coin_change_memo_hit">
                            <value name="AMOUNT"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                            <next>
                              <!-- Inner Loop: for each coin -->
                              <block type="for_each_in_list" id="inner_loop">
                                <field name="VAR">coin</field>
                                <value name="LIST"><block type="variables_get"><field name="VAR">coins</field></block></value>
                                <statement name="DO">
                                   <!-- emit consider trace -->
                                   <block type="coin_change_consider">
                                     <value name="COIN_INDEX"><block type="lists_indexOf"><field name="END">FIRST</field><value name="VALUE"><block type="variables_get"><field name="VAR">coins</field></block></value><value name="FIND"><block type="variables_get"><field name="VAR">coin</field></block></value></block></value>
                                     <next>
                                       <!-- if curr_amount - coin >= 0 -->
                                       <block type="controls_if" id="check_coin_fit">
                                         <value name="IF0">
                                           <block type="logic_compare">
                                             <value name="A">
                                               <block type="math_arithmetic">
                                                 <value name="A"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                                                 <field name="OP">MINUS</field>
                                                 <value name="B"><block type="variables_get"><field name="VAR">coin</field></block></value>
                                                </block>
                                             </value>
                                             <field name="OP">GTE</field>
                                             <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
                                           </block>
                                         </value>
                                         <statement name="DO0">
                                           <!-- prev_coins = dp[curr_amount - coin] -->
                                           <block type="variables_set">
                                              <field name="VAR">prev_coins</field>
                                              <value name="VALUE">
                                                <block type="lists_get_at_index">
<value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
<value name="INDEX">
                                                    <block type="math_arithmetic">
                                                      <value name="A"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                                                      <field name="OP">MINUS</field>
                                                      <value name="B"><block type="variables_get"><field name="VAR">coin</field></block></value>
</block>
                                                  </value>
                                                </block>
                                              </value>
                                              <next>
                                                <!-- current_coins = dp[curr_amount] -->
                                                <block type="variables_set">
                                                   <field name="VAR">current_coins</field>
                                                   <value name="VALUE">
                                                     <block type="lists_get_at_index">
<value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
<value name="INDEX"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
</block>
                                                   </value>
                                                   <next>
                                                     <!-- if prev_coins != 999999 and prev_coins + 1 < current_coins -->
                                                     <block type="controls_if" id="check_better_path">
                                                       <value name="IF0">
                                                         <block type="logic_operation">
                                                            <field name="OP">AND</field>
                                                            <value name="A">
                                                              <block type="logic_compare"><value name="A"><block type="variables_get"><field name="VAR">prev_coins</field></block></value><field name="OP">NEQ</field><value name="B"><block type="math_number"><field name="NUM">999999</field></block></value></block>
                                                            </value>
                                                            <value name="B">
                                                              <block type="logic_compare">
                                                                <value name="A">
                                                                  <block type="math_arithmetic"><value name="A"><block type="variables_get"><field name="VAR">prev_coins</field></block></value><field name="OP">ADD</field><value name="B"><block type="math_number"><field name="NUM">1</field></block></value></block>
                                                                </value>
                                                                <field name="OP">LT</field>
                                                                <value name="B"><block type="variables_get"><field name="VAR">current_coins</field></block></value>
                                                              </block>
                                                            </value>
                                                         </block>
                                                       </value>
                                                       <statement name="DO0">
                                                         <!-- dp[curr_amount] = prev_coins + 1 -->
                                                         <block type="lists_setIndex" id="update_dp">
                                                           <field name="MODE">SET</field>
                                                           <field name="WHERE">FROM_START</field>
                                                           <value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
                                                           <value name="AT"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                                                           <value name="TO">
                                                             <block type="math_arithmetic"><value name="A"><block type="variables_get"><field name="VAR">prev_coins</field></block></value><field name="OP">ADD</field><value name="B"><block type="math_number"><field name="NUM">1</field></block></value></block>
                                                           </value>
                                                           <next>
                                                             <!-- let new_combo = slice combo[curr_amount - coin] -->
                                                             <block type="variables_set">
                                                               <field name="VAR">new_combo</field>
                                                               <value name="VALUE">
                                                                 <block type="lists_getSublist">
                                                                   <mutation at1="false" at2="false"></mutation>
                                                                   <field name="WHERE1">FIRST</field>
                                                                   <field name="WHERE2">LAST</field>
                                                                   <value name="LIST">
                                                                     <block type="lists_get_at_index">
<value name="LIST"><block type="variables_get"><field name="VAR">combo</field></block></value>
<value name="INDEX">
                                                                         <block type="math_arithmetic"><value name="A"><block type="variables_get"><field name="VAR">curr_amount</field></block></value><field name="OP">MINUS</field><value name="B"><block type="variables_get"><field name="VAR">coin</field></block></value>
</block>
                                                                       </value>
                                                                     </block>
                                                                   </value>
                                                                 </block>
                                                               </value>
                                                               <next>
                                                                 <!-- push coin into new_combo -->
                                                                 <block type="lists_add_item">
                                                                   <value name="LIST"><block type="variables_get"><field name="VAR">new_combo</field></block></value>
                                                                   <value name="ITEM"><block type="variables_get"><field name="VAR">coin</field></block></value>
                                                                   <next>
                                                                     <!-- combo[curr_amount] = new_combo -->
                                                                     <block type="lists_setIndex">
                                                                       <field name="MODE">SET</field>
                                                                       <field name="WHERE">FROM_START</field>
                                                                       <value name="LIST"><block type="variables_get"><field name="VAR">combo</field></block></value>
                                                                       <value name="AT"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                                                                       <value name="TO"><block type="variables_get"><field name="VAR">new_combo</field></block></value>
                                                                       <next>
                                                                         <!-- Emit DP Trace: trackCoinChangeDecision using 'dp_update' trick. amount=curr_amount, index=prev_coins, include=coin -->
                                                                         <block type="coin_change_track_decision">
                                                                           <value name="AMOUNT"><block type="variables_get"><field name="VAR">curr_amount</field></block></value>
                                                                           <value name="INDEX"><block type="math_arithmetic"><value name="A"><block type="variables_get"><field name="VAR">prev_coins</field></block></value><field name="OP">ADD</field><value name="B"><block type="math_number"><field name="NUM">1</field></block></value></block></value>
                                                                           <value name="INCLUDE"><block type="variables_get"><field name="VAR">coin</field></block></value>
                                                                           <value name="EXCLUDE"><block type="math_number"><field name="NUM">-2</field></block></value>
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
                                                   </next>
                                                </block>
                                              </next>
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
                          <!-- get result and bounds check -->
                          <block type="variables_set">
                            <field name="VAR">ans</field>
                            <value name="VALUE">
                              <block type="lists_get_at_index">
<value name="LIST"><block type="variables_get"><field name="VAR">dp</field></block></value>
<value name="INDEX"><block type="variables_get"><field name="VAR">amount</field></block></value>
</block>
                            </value>
                            <next>
                              <block type="controls_if">
                                <value name="IF0">
                                  <block type="logic_compare">
                                    <value name="A"><block type="variables_get"><field name="VAR">ans</field></block></value>
                                    <field name="OP">EQ</field>
                                    <value name="B"><block type="math_number"><field name="NUM">999999</field></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <block type="variables_set"><field name="VAR">ans</field><value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value></block>
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
    </statement>
    <value name="RETURN">
      <block type="variables_get"><field name="VAR">ans</field></block>
    </value>
  </block>

  <!-- Main Execution call -->
  <block type="variables_set" x="50" y="1000">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_coin_change">
        <mutation name="coinChange">
           <arg name="amount"></arg>
           <arg name="coins"></arg>
           <arg name="index"></arg>
        </mutation>
        <value name="ARG0"><block type="variables_get"><field name="VAR">monster_power</field></block></value>
        <value name="ARG1"><block type="variables_get"><field name="VAR">warriors</field></block></value>
        <value name="ARG2"><block type="math_number"><field name="NUM">0</field></block></value>
      </block>
    </value>
  </block>
</xml>`;

/**
 * Load Dynamic Coin Change (DP) example blocks into Blockly workspace
 * @param {Blockly.WorkspaceSvg} workspace - The Blockly workspace
 */
export const loadDynamicCoinChangeExampleBlocks = (workspace) => {
  if (!workspace) return;
  Blockly.Events.disable();
  try {
    if (workspace._starterListener) {
      workspace.removeChangeListener(workspace._starterListener);
      workspace._starterListener = null;
    }
    workspace.clear();
    // Wait for clear to process properly before inject
    setTimeout(() => {
      try {
        const xml = Blockly.utils.xml.textToDom(dynamicCoinChangeExampleXml);
        Blockly.Xml.domToWorkspace(xml, workspace);
      } catch (e) { console.error(e); }
    }, 50);
  } finally {
    Blockly.Events.enable();
  }
};
