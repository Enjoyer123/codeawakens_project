// Helper function to load BFS example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// BFS Example XML - Complete BFS algorithm blocks
const bfsExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- BFS Function Definition -->
  <block type="procedures_defreturn" id="bfs_function" x="50" y="50">
    <field name="NAME">BFS</field>
    <comment pinned="false" h="80" w="160">Breadth-First Search algorithm to find path from start to goal</comment>
    <statement name="STACK">
      <!-- Initialize container = [[start]] -->
      <block type="variables_set" id="init_container">
        <field name="VAR">container</field>
        <value name="VALUE">
          <block type="lists_create_with" id="container_list">
            <mutation items="1"></mutation>
            <value name="ADD0">
              <block type="lists_create_with" id="start_path_list">
                <mutation items="1"></mutation>
                <value name="ADD0">
                  <block type="variables_get" id="start_var">
                    <field name="VAR">start</field>
                  </block>
                </value>
              </block>
            </value>
          </block>
        </value>
        <next>
          <!-- Initialize visited = [start] -->
          <block type="variables_set" id="init_visited">
            <field name="VAR">visited</field>
            <value name="VALUE">
              <block type="lists_create_with" id="visited_list">
                <mutation items="1"></mutation>
                <value name="ADD0">
                  <block type="variables_get" id="start_var2">
                    <field name="VAR">start</field>
                  </block>
                </value>
              </block>
            </value>
            <next>
              <!-- Main loop: ทำซ้ำจนกว่า container ว่าง -->
              <block type="while_loop" id="main_loop">
                <value name="CONDITION">
                  <block type="logic_negate" id="not_empty">
                    <value name="BOOL">
                      <block type="lists_isEmpty" id="is_empty">
                        <value name="VALUE">
                          <block type="variables_get" id="container_var">
                            <field name="VAR">container</field>
                          </block>
                        </value>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO">
                  <!-- path = ดึงและลบตัวแรกจาก container (FIFO - queue) -->
                  <block type="variables_set" id="set_path">
                    <field name="VAR">path</field>
                    <value name="VALUE">
                      <block type="lists_remove_first_return" id="shift_container">
                        <value name="LIST">
                          <block type="variables_get" id="container_var2">
                            <field name="VAR">container</field>
                          </block>
                        </value>
                      </block>
                    </value>
                    <next>
                      <!-- node = ดึงตัวสุดท้ายจาก path -->
                      <block type="variables_set" id="set_node">
                        <field name="VAR">node</field>
                        <value name="VALUE">
                          <block type="lists_get_last" id="get_last_node">
                            <value name="LIST">
                              <block type="variables_get" id="path_var">
                                <field name="VAR">path</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <next>
                          <!-- ถ้า node = goal แล้ว return path -->
                          <block type="controls_if" id="check_goal">
                            <value name="IF0">
                              <block type="logic_compare" id="node_equals_goal">
                                <value name="A">
                                  <block type="variables_get" id="node_var">
                                    <field name="VAR">node</field>
                                  </block>
                                </value>
                                <field name="OP">EQ</field>
                                <value name="B">
                                  <block type="variables_get" id="goal_var">
                                    <field name="VAR">goal</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="procedures_return" id="return_path">
                                <value name="VALUE">
                                  <block type="variables_get" id="path_var2">
                                    <field name="VAR">path</field>
                                  </block>
                                </value>
                              </block>
                            </statement>
                            <next>
                              <!-- สำหรับแต่ละ neighbor ใน neighbors -->
                              <block type="for_each_in_list" id="for_each_neighbor">
                                <field name="VAR">neighbor</field>
                                <value name="LIST">
                                  <block type="graph_get_neighbors" id="get_neighbors">
                                    <value name="GRAPH">
                                      <block type="variables_get" id="graph_var">
                                        <field name="VAR">garph</field>
                                      </block>
                                    </value>
                                    <value name="NODE">
                                      <block type="variables_get" id="node_var2">
                                        <field name="VAR">node</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <statement name="DO">
                                  <!-- ถ้า neighbor ไม่มีอยู่ใน visited -->
                                  <block type="controls_if" id="check_not_visited">
                                    <value name="IF0">
                                      <block type="logic_not_in" id="not_in_visited">
                                        <value name="ITEM">
                                          <block type="variables_get" id="neighbor_var">
                                            <field name="VAR">neighbor</field>
                                          </block>
                                        </value>
                                        <value name="LIST">
                                          <block type="variables_get" id="visited_var">
                                            <field name="VAR">visited</field>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                    <statement name="DO0">
                                      <!-- เพิ่ม neighbor เข้า visited -->
                                      <block type="lists_add_item" id="add_to_visited">
                                        <value name="LIST">
                                          <block type="variables_get" id="visited_var2">
                                            <field name="VAR">visited</field>
                                          </block>
                                        </value>
                                        <value name="ITEM">
                                          <block type="variables_get" id="neighbor_var2">
                                            <field name="VAR">neighbor</field>
                                          </block>
                                        </value>
                                        <next>
                                          <!-- เพิ่ม รวม path กับ neighbor เข้า container (add to end - queue) -->
                                          <block type="lists_add_item" id="add_to_container">
                                            <value name="LIST">
                                              <block type="variables_get" id="container_var3">
                                                <field name="VAR">container</field>
                                              </block>
                                            </value>
                                            <value name="ITEM">
                                              <block type="lists_concat" id="concat_path_neighbor">
                                                <value name="LIST1">
                                                  <block type="variables_get" id="path_var3">
                                                    <field name="VAR">path</field>
                                                  </block>
                                                </value>
                                                <value name="LIST2">
                                                  <block type="lists_create_with" id="neighbor_list">
                                                    <mutation items="1"></mutation>
                                                    <value name="ADD0">
                                                      <block type="variables_get" id="neighbor_var3">
                                                        <field name="VAR">neighbor</field>
                                                      </block>
                                                    </value>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                          </block>
                                        </next>
                                      </block>
                                    </statement>
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
                  <!-- Return null when no path found -->
                  <block type="procedures_return" id="return_null">
                    <value name="VALUE">
                      <block type="logic_null" id="null_value">
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
  </block>
  
  <!-- Main code: path = BFS(map, 0, 7) -->
  <block type="variables_set" id="main_path_set" x="50" y="600">
    <field name="VAR">path</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_bfs">
        <mutation name="BFS">
          <arg name="garph"></arg>
          <arg name="start"></arg>
          <arg name="goal"></arg>
        </mutation>
        <field name="NAME">BFS</field>
        <value name="ARG0">
          <block type="variables_get" id="map_var">
            <field name="VAR">map</field>
          </block>
        </value>
        <value name="ARG1">
          <block type="math_number" id="start_num">
            <field name="NUM">0</field>
          </block>
        </value>
        <value name="ARG2">
          <block type="math_number" id="goal_num">
            <field name="NUM">7</field>
          </block>
        </value>
      </block>
    </value>
    <next>
      <!-- move_along_path(path) -->
      <block type="move_along_path" id="move_path">
        <value name="PATH">
          <block type="variables_get" id="path_var_main">
            <field name="VAR">path</field>
          </block>
        </value>
      </block>
    </next>
  </block>
</xml>`;

export function loadBfsExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load BFS example blocks: workspace is null');
    return;
  }

  try {
    // console.log removed('📦 Loading BFS example blocks into workspace...');

    // Clear workspace first
    workspace.clear();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(bfsExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = ['container', 'visited', 'path', 'node', 'neighbor', 'garph', 'start', 'goal', 'map'];
        variableNames.forEach(varName => {
          try {
            workspace.createVariable(varName);
          } catch (e) {
            // Variable might already exist
            console.debug(`Variable ${varName} already exists or error creating:`, e);
          }
        });

        // console.log removed('✅ BFS example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading BFS example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด BFS example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadBfsExampleBlocks:', error);
  }
}

export function getBfsExampleXml() {
  return bfsExampleXml;
}

