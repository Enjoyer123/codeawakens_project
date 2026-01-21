// Helper function to load Rope Partition example blocks
import * as Blockly from "blockly/core";

const ropePartitionExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Function solve(currentSum, incomingCut, target) -->
  <block type="procedures_defreturn" id="solve_func" x="50" y="50">
    <mutation>
      <arg name="currentSum"></arg>
      <arg name="incomingCut"></arg>
      <arg name="target"></arg>
    </mutation>
    <field name="NAME">solveRope</field>
    <statement name="STACK">
      <!-- 1. Visualize Visit -->
      <block type="rope_vis_enter" id="vis_enter">
        <value name="CUT"><block type="variables_get"><field name="VAR">incomingCut</field></block></value>
        <value name="SUM"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
        <next>
          <!-- 2. Check Success (Base Case) -->
          <block type="controls_if" id="check_success">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">EQ</field>
                <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                <value name="B"><block type="variables_get"><field name="VAR">target</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="rope_vis_status">
                <field name="STATUS">success</field>
                <next>
                  <block type="rope_vis_exit">
                    <next>
                      <block type="procedures_return">
                        <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
            <next>
               <!-- 3. Check Pruning (Base Case) -->
               <block type="controls_if" id="check_prune">
                 <value name="IF0">
                   <block type="logic_compare">
                     <field name="OP">GT</field>
                     <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                     <value name="B"><block type="variables_get"><field name="VAR">target</field></block></value>
                   </block>
                 </value>
                 <statement name="DO0">
                  <block type="rope_vis_status">
                    <field name="STATUS">pruned</field>
                    <next>
                      <block type="rope_vis_exit">
                        <next>
                          <block type="procedures_return">
                            <value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                 <next>

                   <!-- 4. Init Min Result -->
                   <block type="variables_set" id="init_min">
                     <field name="VAR">minLines</field>
                     <value name="VALUE"><block type="math_number"><field name="NUM">9999</field></block></value>
                     <next>
                       <!-- 5. Loop Cuts -->
                       <block type="controls_forEach" id="loop_cuts">
                         <field name="VAR">cut</field>
                         <value name="LIST"><block type="rope_get_cuts"></block></value>
                         <statement name="DO">
                           <block type="variables_set" id="call_recurse">
                             <field name="VAR">subRes</field>
                             <value name="VALUE">
                               <block type="procedures_callreturn">
                                 <mutation name="solveRope">
                                   <arg name="currentSum"></arg>
                                   <arg name="incomingCut"></arg>
                                   <arg name="target"></arg>
                                 </mutation>
                                 <value name="ARG0">
                                   <block type="math_arithmetic">
                                     <field name="OP">ADD</field>
                                     <value name="A"><block type="variables_get"><field name="VAR">currentSum</field></block></value>
                                     <value name="B"><block type="variables_get"><field name="VAR">cut</field></block></value>
                                   </block>
                                 </value>
                                 <value name="ARG1"><block type="variables_get"><field name="VAR">cut</field></block></value>
                                 <value name="ARG2"><block type="variables_get"><field name="VAR">target</field></block></value>
                               </block>
                             </value>
                             <next>
                               <!-- Update Min if subRes != -1 -->
                               <block type="controls_if" id="check_subres">
                                 <value name="IF0">
                                   <block type="logic_compare">
                                     <field name="OP">NEQ</field>
                                     <value name="A"><block type="variables_get"><field name="VAR">subRes</field></block></value>
                                     <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                                   </block>
                                 </value>
                                 <statement name="DO0">
                                   <!-- tempRes = subRes + 1 -->
                                   <block type="variables_set" id="set_temp">
                                     <field name="VAR">tempRes</field>
                                     <value name="VALUE">
                                       <block type="math_arithmetic">
                                         <field name="OP">ADD</field>
                                         <value name="A"><block type="variables_get"><field name="VAR">subRes</field></block></value>
                                         <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                       </block>
                                     </value>
                                     <next>
                                       <!-- if tempRes < minLines -->
                                       <block type="controls_if" id="check_min">
                                          <value name="IF0">
                                            <block type="logic_compare">
                                              <field name="OP">LT</field>
                                              <value name="A"><block type="variables_get"><field name="VAR">tempRes</field></block></value>
                                              <value name="B"><block type="variables_get"><field name="VAR">minLines</field></block></value>
                                            </block>
                                          </value>
                                          <statement name="DO0">
                                            <block type="variables_set">
                                              <field name="VAR">minLines</field>
                                              <value name="VALUE"><block type="variables_get"><field name="VAR">tempRes</field></block></value>
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
                           <!-- 6. Visualize Exit (Cleanup Stack) -->
                           <block type="rope_vis_exit">
                             <next>
                               <!-- Return 3: Final Result (Bottom) -->
                               <block type="controls_if" id="ret_final">
                                 <mutation else="1"></mutation>
                                 <value name="IF0">
                                   <block type="logic_compare">
                                     <field name="OP">EQ</field>
                                     <value name="A"><block type="variables_get"><field name="VAR">minLines</field></block></value>
                                     <value name="B"><block type="math_number"><field name="NUM">9999</field></block></value>
                                   </block>
                                 </value>
                                 <statement name="DO0">
                                   <block type="procedures_return">
                                     <value name="VALUE"><block type="math_number"><field name="NUM">-1</field></block></value>
                                   </block>
                                 </statement>
                                 <statement name="ELSE">
                                   <block type="procedures_return">
                                     <value name="VALUE"><block type="variables_get"><field name="VAR">minLines</field></block></value>
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
    </statement>
  </block>

  <!-- Main Start -->
  <block type="rope_visual_init" id="main_init" x="50" y="800">
    <next>
       <block type="variables_set">
         <field name="VAR">result</field>
         <value name="VALUE">
           <block type="procedures_callreturn">
             <mutation name="solveRope">
               <arg name="currentSum"></arg>
               <arg name="incomingCut"></arg>
               <arg name="target"></arg>
             </mutation>
             <value name="ARG0"><block type="math_number"><field name="NUM">0</field></block></value>
             <value name="ARG1"><block type="math_number"><field name="NUM">0</field></block></value>
             <value name="ARG2"><block type="rope_target_len"></block></value>
           </block>
         </value>
       </block>
    </next>
  </block>
</xml>`;

export const loadRopePartitionExampleBlocks = (workspace) => {
  try {
    const xml = Blockly.utils.xml.textToDom(ropePartitionExampleXml);
    Blockly.Xml.domToWorkspace(xml, workspace);
    console.log("✅ Rope Partition XML Loaded! [CLEAN_REWRITE]");
  } catch (e) {
    console.error("Failed to load Rope Partition example:", e);
  }
};
