// Helper function to load N-Queen example blocks into Blockly workspace
import * as Blockly from "blockly/core";
import { addMutationToProcedureDefinitions } from "../../../components/playgame/hooks/blocklysetup/xmlFixers";

// N-Queen Example XML - Backtracking recursive solution (FIXED - return solution in base case)
const nQueenExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- N-Queen Solve Function Definition -->
  <block type="procedures_defreturn" id="solve_function" x="50" y="50">
    <field name="NAME">solve</field>
    <comment pinned="false" h="80" w="200">Backtracking recursive solution for N-Queen problem. Places n queens on n×n board so no two queens attack each other. Returns solution array if found, null otherwise.</comment>
    <statement name="STACK">
      <!-- Base case: if row == n, build and return solution array -->
      <block type="if_only" id="base_case_row_equals_n">
        <value name="CONDITION">
          <block type="logic_compare" id="row_equals_n">
            <value name="A">
              <block type="variables_get" id="row_var_base">
                <field name="VAR">row</field>
              </block>
            </value>
            <field name="OP">EQ</field>
            <value name="B">
              <block type="variables_get" id="n_value">
                <field name="VAR">n</field>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO">
          <!-- Build solution array from board -->
          <block type="variables_set" id="init_solution">
            <field name="VAR">solution</field>
            <value name="VALUE">
              <block type="lists_create_with" id="solution_list">
                <mutation items="0"></mutation>
              </block>
            </value>
            <next>
              <!-- Loop through rows to build solution -->
              <block type="for_loop_dynamic" id="build_solution_loop">
                <field name="VAR">i</field>
                <value name="FROM">
                  <block type="math_number" id="i_start">
                    <field name="NUM">0</field>
                  </block>
                </value>
                <value name="TO">
                  <block type="math_arithmetic" id="n_minus_one_solution">
                    <value name="A">
                      <block type="variables_get" id="n_var_solution">
                        <field name="VAR">n</field>
                      </block>
                    </value>
                    <field name="OP">MINUS</field>
                    <value name="B">
                      <block type="math_number" id="one_solution">
                        <field name="NUM">1</field>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO">
                  <!-- Loop through cols to find queen -->
                  <block type="for_loop_dynamic" id="find_queen_loop">
                    <field name="VAR">j</field>
                    <value name="FROM">
                      <block type="math_number" id="j_start">
                        <field name="NUM">0</field>
                      </block>
                    </value>
                    <value name="TO">
                      <block type="math_arithmetic" id="n_minus_one_queen">
                        <value name="A">
                          <block type="variables_get" id="n_var_queen">
                            <field name="VAR">n</field>
                          </block>
                        </value>
                        <field name="OP">MINUS</field>
                        <value name="B">
                          <block type="math_number" id="one_queen">
                            <field name="NUM">1</field>
                          </block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO">
                      <!-- if board[i][j] == 1, add [i, j] to solution -->
                      <block type="if_only" id="check_queen">
                        <value name="CONDITION">
                          <block type="logic_compare" id="board_equals_one">
                            <value name="A">
                              <block type="lists_get_at_index" id="get_board_i">
                                <value name="LIST">
                                  <block type="lists_get_at_index" id="get_board">
                                    <value name="LIST">
                                      <block type="variables_get" id="board_var_solution">
                                        <field name="VAR">board</field>
                                      </block>
                                    </value>
                                    <value name="INDEX">
                                      <block type="variables_get" id="i_var_solution">
                                        <field name="VAR">i</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <value name="INDEX">
                                  <block type="variables_get" id="j_var_solution">
                                    <field name="VAR">j</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <field name="OP">EQ</field>
                            <value name="B">
                              <block type="math_number" id="one_value">
                                <field name="NUM">1</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <statement name="DO">
                          <block type="lists_add_item" id="add_to_solution">
                            <value name="LIST">
                              <block type="variables_get" id="solution_var">
                                <field name="VAR">solution</field>
                              </block>
                            </value>
                            <value name="ITEM">
                              <block type="lists_create_with" id="queen_position">
                                <mutation items="2"></mutation>
                                <value name="ADD0">
                                  <block type="variables_get" id="i_var_pos">
                                    <field name="VAR">i</field>
                                  </block>
                                </value>
                                <value name="ADD1">
                                  <block type="variables_get" id="j_var_pos">
                                    <field name="VAR">j</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                          </block>
                        </statement>
                      </block>
                    </statement>
                  </block>
                </statement>
                <next>
                  <!-- ✅ CRITICAL FIX: Return solution INSIDE base case, AFTER building solution (after for i loop completes) -->
                  <block type="procedures_return" id="return_solution_base">
                    <value name="VALUE">
                      <block type="variables_get" id="solution_var_return">
                        <field name="VAR">solution</field>
                      </block>
                    </value>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <!-- ❌ REMOVED: return solution was here (outside base case) -->
      <next>
        <block type="for_loop_dynamic" id="for_col_loop">
          <field name="VAR">col</field>
          <value name="FROM">
            <block type="math_number" id="col_start">
              <field name="NUM">0</field>
            </block>
          </value>
          <value name="TO">
            <block type="math_arithmetic" id="n_minus_one">
              <value name="A">
                <block type="variables_get" id="n_var">
                  <field name="VAR">n</field>
                </block>
              </value>
              <field name="OP">MINUS</field>
              <value name="B">
                <block type="math_number" id="one_for">
                  <field name="NUM">1</field>
                </block>
              </value>
            </block>
          </value>
          <statement name="DO">
            <!-- Inner if: if safe(row, col) -->
            <block type="if_only" id="if_safe">
              <value name="CONDITION">
                <block type="nqueen_is_safe" id="call_safe">
                  <value name="ROW">
                    <block type="variables_get" id="row_var_safe">
                      <field name="VAR">row</field>
                    </block>
                  </value>
                  <value name="COL">
                    <block type="variables_get" id="col_var_safe">
                      <field name="VAR">col</field>
                    </block>
                  </value>
                </block>
              </value>
              <statement name="DO">
                <!-- place(row, col) -->
                <block type="nqueen_place" id="call_place">
                  <value name="ROW">
                    <block type="variables_get" id="row_var_place">
                      <field name="VAR">row</field>
                    </block>
                  </value>
                  <value name="COL">
                    <block type="variables_get" id="col_var_place">
                      <field name="VAR">col</field>
                    </block>
                  </value>
                  <next>
                    <!-- if solve(row + 1) returns solution, return it; else remove(row, col) -->
                    <block type="variables_set" id="store_solve_result">
                      <field name="VAR">solveResult</field>
                      <value name="VALUE">
                        <block type="procedures_callreturn" id="call_solve_next">
                          <mutation name="solve">
                            <arg name="row"></arg>
                          </mutation>
                          <field name="NAME">solve</field>
                          <value name="ARG0">
                            <block type="math_arithmetic" id="row_plus_one">
                              <value name="A">
                                <block type="variables_get" id="row_var_solve">
                                  <field name="VAR">row</field>
                                </block>
                              </value>
                              <field name="OP">ADD</field>
                              <value name="B">
                                <block type="math_number" id="one_solve">
                                  <field name="NUM">1</field>
                                </block>
                              </value>
                            </block>
                          </value>
                        </block>
                      </value>
                      <next>
                        <!-- if solveResult is not null, return it; else remove(row, col) -->
                        <block type="if_else" id="if_solve_result">
                          <value name="CONDITION">
                            <block type="logic_compare" id="solve_result_not_null">
                              <value name="A">
                                <block type="variables_get" id="solve_result_var">
                                  <field name="VAR">solveResult</field>
                                </block>
                              </value>
                              <field name="OP">NEQ</field>
                              <value name="B">
                                <block type="logic_null" id="null_check"></block>
                              </value>
                            </block>
                          </value>
                          <statement name="IF_DO">
                            <block type="procedures_return" id="return_solve_result">
                              <value name="VALUE">
                                <block type="variables_get" id="solve_result_var_return">
                                  <field name="VAR">solveResult</field>
                                </block>
                              </value>
                            </block>
                          </statement>
                          <statement name="ELSE_DO">
                            <!-- remove(row, col) and continue loop -->
                            <block type="nqueen_remove" id="call_remove">
                              <value name="ROW">
                                <block type="variables_get" id="row_var_remove">
                                  <field name="VAR">row</field>
                                </block>
                              </value>
                              <value name="COL">
                                <block type="variables_get" id="col_var_remove">
                                  <field name="VAR">col</field>
                                </block>
                              </value>
                            </block>
                          </statement>
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </statement>
          <next>
            <!-- Return null (if loop completes without finding solution) -->
            <block type="procedures_return" id="return_null">
              <value name="VALUE">
                <block type="logic_null" id="null_return"></block>
              </value>
            </block>
          </next>
        </block>
      </next>
    </block>
    </statement>
    <mutation>
      <arg name="row"></arg>
    </mutation>
  </block>

  <!-- Main code: result = solve(0) -->
  <block type="variables_set" id="main_result_set" x="50" y="600">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_main">
        <mutation name="solve">
          <arg name="row"></arg>
        </mutation>
        <field name="NAME">solve</field>
        <value name="ARG0">
          <block type="math_number" id="zero_index">
            <field name="NUM">0</field>
          </block>
        </value>
      </block>
    </value>
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
    console.log('🔍 Loading N-Queen example blocks (FIXED)...');

    // Process XML to fix definitions and deduplicate
    const processedXml = addMutationToProcedureDefinitions(nQueenExampleXml);
    const xmlDom = Blockly.utils.xml.textToDom(processedXml);

    // ⚡ Performance: Set flag to skip event processing during load to prevent auto-creation of definitions
    if (window.__blocklySetLoadingXml) {
      window.__blocklySetLoadingXml(true);
    }

    // Load into workspace
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    if (window.__blocklySetLoadingXml) {
      window.__blocklySetLoadingXml(false);
    }

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

    console.log('✅ N-Queen example blocks loaded successfully');
    console.log('⚠️ Note: Functions safe(row, col), place(row, col), and remove(row, col) will be initialized by nqueenInitCode');
  } catch (error) {
    console.error('❌ Error loading N-Queen example blocks:', error);
  }
}