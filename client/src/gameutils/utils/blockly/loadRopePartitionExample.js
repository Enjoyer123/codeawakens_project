// Helper function to load Rope Partition example blocks
import * as Blockly from "blockly/core";

const ropePartitionExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- solve(remaining, last_cut) Function -->
  <block type="procedures_defreturn" id="solve_func" x="50" y="50">
    <mutation>
      <arg name="remaining"></arg>
      <arg name="last_cut"></arg>
    </mutation>
    <field name="NAME">solve</field>
    <comment pinned="false" h="80" w="200">Backtracking to partition rope into UNIQUE parts. Returns true if found.</comment>
    <statement name="STACK">
      <!-- Base Case: remaining == 0 -->
      <block type="if_only" id="base_case">
        <value name="CONDITION">
          <block type="logic_compare">
            <field name="OP">EQ</field>
            <value name="A">
              <block type="variables_get"><field name="VAR">remaining</field></block>
            </value>
            <value name="B">
              <block type="math_number"><field name="NUM">0</field></block>
            </value>
          </block>
        </value>
        <statement name="DO">
          <block type="procedures_return">
            <value name="VALUE">
              <block type="logic_boolean"><field name="BOOL">TRUE</field></block>
            </value>
          </block>
        </statement>
        <next>
          <!-- Loop: from last_cut + 1 to remaining -->
          <block type="controls_for" id="loop_cuts">
            <field name="VAR">len</field>
            <value name="FROM">
               <!-- Start from last_cut + 1 -->
               <block type="math_arithmetic">
                 <field name="OP">ADD</field>
                 <value name="A"><block type="variables_get"><field name="VAR">last_cut</field></block></value>
                 <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
               </block>
            </value>
            <value name="TO"><block type="variables_get"><field name="VAR">remaining</field></block></value>
            <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
            <statement name="DO">
              <!-- Try Cut -->
              <block type="rope_add_cut" id="call_add">
                <value name="LENGTH">
                   <block type="variables_get"><field name="VAR">len</field></block>
                </value>
                <next>
                  <!-- Recursive Call: solve(remaining - len, len) -->
                  <block type="if_only" id="check_recurse">
                    <value name="CONDITION">
                      <block type="procedures_callreturn">
                        <mutation name="solve">
                          <arg name="remaining"></arg>
                          <arg name="last_cut"></arg>
                        </mutation>
                        <field name="NAME">solve</field>
                        <value name="ARG0">
                           <block type="math_arithmetic">
                             <field name="OP">MINUS</field>
                             <value name="A"><block type="variables_get"><field name="VAR">remaining</field></block></value>
                             <value name="B"><block type="variables_get"><field name="VAR">len</field></block></value>
                           </block>
                        </value>
                        <value name="ARG1">
                           <block type="variables_get"><field name="VAR">len</field></block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO">
                       <block type="procedures_return">
                         <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                       </block>
                    </statement>
                    <next>
                      <!-- Backtrack -->
                      <block type="rope_remove_cut" id="call_remove">
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
            <next>
               <block type="procedures_return">
                 <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
               </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <!-- Main Call: solve(10, 1) starts searching from 2 -->
  <block type="variables_set" id="main_result_set" x="50" y="550">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="main_call">
        <mutation name="solve">
          <arg name="remaining"></arg>
          <arg name="last_cut"></arg>
        </mutation>
        <field name="NAME">solve</field>
        <value name="ARG0">
            <block type="math_number"><field name="NUM">10</field></block>
        </value>
        <value name="ARG1">
            <block type="math_number"><field name="NUM">1</field></block>
        </value>
      </block>
    </value>
  </block>
</xml>`;

export function loadRopePartitionExampleBlocks(workspace) {
  if (!workspace) return;
  try {
    const xmlDom = Blockly.utils.xml.textToDom(ropePartitionExampleXml);
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    // Ensure variables
    const vars = ['remaining', 'last_cut', 'len', 'result'];
    vars.forEach(v => {
      if (workspace.createVariable) workspace.createVariable(v);
    });
  } catch (e) {
    console.error('Error loading Rope Partition example:', e);
  }
}
