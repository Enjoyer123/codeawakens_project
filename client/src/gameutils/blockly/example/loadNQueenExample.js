// Helper function to load N-Queen example blocks into Blockly workspace
import * as Blockly from "blockly/core";
import { setXmlLoading } from "../core/state";

// N-Queen Example XML - Backtracking recursive solution (FIXED - return solution in base case)
const nQueenExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- N-Queen Solve Function Definition -->
  <block type="procedures_defnoreturn" id="solve_function" x="50" y="50">
    <field name="NAME">solve</field>
    <comment pinned="false" h="80" w="200">Backtracking recursive solution for N-Queen. Collects all solutions into solutions_list.</comment>
    <statement name="STACK">
      <block type="controls_if" id="base_case_row_equals_n"><mutation else="1"></mutation>
        <value name="IF0">
          <block type="logic_compare" id="row_equals_n">
            <value name="A"><block type="variables_get" id="row_var_base"><field name="VAR">row</field></block></value>
            <field name="OP">EQ</field>
            <value name="B"><block type="variables_get" id="n_value"><field name="VAR">n</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="variables_set" id="init_solution">
            <field name="VAR">solution</field>
            <value name="VALUE">
              <block type="lists_create_with" id="solution_list"><mutation items="0"></mutation></block>
            </value>
            <next>
              <block type="for_loop_dynamic" id="build_solution_loop">
                <field name="VAR">i</field>
                <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                <value name="TO">
                  <block type="math_arithmetic">
                    <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                    <field name="OP">MINUS</field>
                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="for_loop_dynamic" id="find_queen_loop">
                    <field name="VAR">j</field>
                    <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                    <value name="TO">
                      <block type="math_arithmetic">
                        <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                        <field name="OP">MINUS</field>
                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                      </block>
                    </value>
                    <statement name="DO">
                      <block type="controls_if" id="check_queen">
                        <value name="IF0">
                          <block type="logic_compare">
                            <value name="A">
                              <block type="lists_get_at_index">
                                <value name="LIST">
                                  <block type="lists_get_at_index">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">board</field></block></value>
                                    <value name="INDEX"><block type="variables_get"><field name="VAR">i</field></block></value>
                                  </block>
                                </value>
                                <value name="INDEX"><block type="variables_get"><field name="VAR">j</field></block></value>
                              </block>
                            </value>
                            <field name="OP">EQ</field>
                            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                          </block>
                        </value>
                        <statement name="DO0">
                          <block type="lists_add_item">
                            <value name="LIST"><block type="variables_get"><field name="VAR">solution</field></block></value>
                            <value name="ITEM">
                              <block type="lists_create_with">
                                <mutation items="2"></mutation>
                                <value name="ADD0"><block type="variables_get"><field name="VAR">i</field></block></value>
                                <value name="ADD1"><block type="variables_get"><field name="VAR">j</field></block></value>
                              </block>
                            </value>
                          </block>
                        </statement>
                      </block>
                    </statement>
                  </block>
                </statement>
                <next>
                  <!-- Add built solution to solutions_list -->
                  <block type="lists_add_item">
                    <value name="LIST"><block type="variables_get"><field name="VAR">solutions_list</field></block></value>
                    <value name="ITEM"><block type="variables_get"><field name="VAR">solution</field></block></value>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="for_loop_dynamic" id="for_col_loop">
            <field name="VAR">col</field>
            <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
            <value name="TO">
              <block type="math_arithmetic">
                <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                <field name="OP">MINUS</field>
                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
              </block>
            </value>
            <statement name="DO">
              <block type="controls_if" id="if_safe">
                <value name="IF0">
                  <block type="nqueen_is_safe">
                    <value name="ROW"><block type="variables_get"><field name="VAR">row</field></block></value>
                    <value name="COL"><block type="variables_get"><field name="VAR">col</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="nqueen_place">
                    <value name="ROW"><block type="variables_get"><field name="VAR">row</field></block></value>
                    <value name="COL"><block type="variables_get"><field name="VAR">col</field></block></value>
                    <next>
                      <block type="procedures_callnoreturn">
                        <mutation name="solve"><arg name="row"></arg></mutation>
                        <field name="NAME">solve</field>
                        <value name="ARG0">
                          <block type="math_arithmetic">
                            <value name="A"><block type="variables_get"><field name="VAR">row</field></block></value>
                            <field name="OP">ADD</field>
                            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                          </block>
                        </value>
                        <next>
                          <block type="nqueen_remove">
                            <value name="ROW"><block type="variables_get"><field name="VAR">row</field></block></value>
                            <value name="COL"><block type="variables_get"><field name="VAR">col</field></block></value>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </statement>
    <mutation><arg name="row"></arg></mutation>
  </block>

  <!-- Main code: init solutions_list, call solve(0), set result = solutions_list -->
  <block type="variables_set" id="init_solutions_list" x="50" y="720">
    <field name="VAR">solutions_list</field>
    <value name="VALUE">
      <block type="lists_create_with"><mutation items="0"></mutation></block>
    </value>
    <next>
      <block type="procedures_callnoreturn" id="call_main">
        <mutation name="solve"><arg name="row"></arg></mutation>
        <field name="NAME">solve</field>
        <value name="ARG0">
          <block type="math_number"><field name="NUM">0</field></block>
        </value>
        <next>
          <block type="variables_set" id="main_result_set">
            <field name="VAR">result</field>
            <value name="VALUE"><block type="variables_get"><field name="VAR">solutions_list</field></block></value>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`;


/**
 * Load N-Queen example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - Blockly workspace
 */
export function loadNQueenExampleBlocks(workspace) {
  if (!workspace) {
    console.error('❌ Workspace is null, cannot load N-Queen example blocks');
    return;
  }

  try {
    // console.log removed('🔍 Loading N-Queen example blocks (FIXED)...');

    // Process XML to fix definitions and deduplicate
    const processedXml = nQueenExampleXml;
    const xmlDom = Blockly.utils.xml.textToDom(processedXml);

    // ⚡ Performance: Set flag to skip event processing during load to prevent auto-creation of definitions
    setXmlLoading(true);

    // Load into workspace
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    setXmlLoading(false);

    // Ensure necessary variables exist (use getVariableMap() APIs for Blockly v12+)
    const variableNames = ['row', 'col', 'n', 'result', 'solution', 'i', 'j', 'solveResult', 'board'];
    variableNames.forEach(varName => {
      try {
        // Prefer new API if available
        if (workspace.getVariableMap && typeof workspace.getVariableMap === 'function') {
          const vm = workspace.getVariableMap();
          if (!vm.getVariable(varName)) {
            // createVariable signature: (name, type?, id?) - keep minimal
            if (typeof vm.createVariable === 'function') {
              vm.createVariable(varName);
            } else if (typeof workspace.createVariable === 'function') {
              // fallback to old API
              workspace.createVariable(varName);
            }
          }
        } else {
          // older Blockly versions
          if (!workspace.getVariable(varName)) {
            workspace.createVariable(varName);
          }
        }
      } catch (e) {
        // Variable might already exist, ignore
        console.debug('Variable', varName, 'already exists or error:', e);
      }
    });

    // console.log removed('✅ N-Queen example blocks loaded successfully');
    // console.log removed('⚠️ Note: Functions safe(row, col), place(row, col), and remove(row, col) will be initialized by nqueenInitCode');
  } catch (error) {
    console.error('❌ Error loading N-Queen example blocks:', error);
  }
}