// Helper function to load Dijkstra example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dijkstra Example XML - Complete Dijkstra algorithm blocks
const dijkstraExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Dijkstra Function Definition -->
  <block type="procedures_defreturn" id="dijkstra_function" x="50" y="50">
    <field name="NAME">DIJ</field>
    <comment pinned="false" h="100" w="200">Dijkstra's shortest path algorithm to find shortest distance from start to goal</comment>
    <statement name="STACK">
      <!-- Initialize distance = {all:999, start:0} -->
      <!-- Note: Using variables_set for each node would be complex, so we'll use a simplified approach -->
      <!-- Initialize distance dictionary (we'll use variables for key nodes) -->
      <block type="variables_set" id="init_distance_start">
        <field name="VAR">distance_start</field>
        <value name="VALUE">
          <block type="math_number" id="dist_start_0">
            <field name="NUM">0</field>
          </block>
        </value>
        <next>
          <!-- Initialize path = [start] -->
          <block type="variables_set" id="init_path">
            <field name="VAR">current_path</field>
            <value name="VALUE">
              <block type="lists_create_with" id="start_path_list">
                <mutation items="1"></mutation>
                <value name="ADD0">
                  <block type="variables_get" id="start_var_path">
                    <field name="VAR">start</field>
                  </block>
                </value>
              </block>
            </value>
            <next>
              <!-- Initialize PQ = [(0,[start])] -->
              <block type="variables_set" id="init_pq">
                <field name="VAR">PQ</field>
                <value name="VALUE">
                  <block type="lists_create_with" id="pq_list">
                    <mutation items="1"></mutation>
                    <value name="ADD0">
                      <block type="lists_create_with" id="pq_tuple">
                        <mutation items="2"></mutation>
                        <value name="ADD0">
                          <block type="math_number" id="pq_dist">
                            <field name="NUM">0</field>
                          </block>
                        </value>
                        <value name="ADD1">
                          <block type="variables_get" id="current_path_init">
                            <field name="VAR">current_path</field>
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
                      <block type="variables_get" id="start_var_visited">
                        <field name="VAR">start</field>
                      </block>
                    </value>
                  </block>
                </value>
                <next>
                  <!-- Main loop: While PQ != [] -->
                  <block type="while_loop" id="main_loop">
                    <value name="CONDITION">
                      <block type="logic_negate" id="not_empty">
                        <value name="BOOL">
                          <block type="lists_isEmpty" id="is_empty">
                            <value name="VALUE">
                              <block type="variables_get" id="pq_var_check">
                                <field name="VAR">PQ</field>
                              </block>
                            </value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO">
                      <!-- Find min index in PQ -->
                      <block type="variables_set" id="set_min_index">
                        <field name="VAR">min_index</field>
                        <value name="VALUE">
                          <block type="lists_find_min_index" id="find_min">
                            <value name="LIST">
                              <block type="variables_get" id="pq_var_min">
                                <field name="VAR">PQ</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <next>
                          <!-- Check if min_index is valid (>= 0) -->
                          <block type="controls_if" id="check_min_index_valid">
                            <value name="IF0">
                              <block type="logic_compare" id="min_index_valid">
                                <value name="A">
                                  <block type="variables_get" id="min_index_check">
                                    <field name="VAR">min_index</field>
                                  </block>
                                </value>
                                <field name="OP">GTE</field>
                                <value name="B">
                                  <block type="math_number" id="zero">
                                    <field name="NUM">0</field>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <!-- Get item at min_index: dist, node = PQ[min_index] -->
                              <block type="variables_set" id="set_pq_item">
                                <field name="VAR">pq_item</field>
                                <value name="VALUE">
                                  <block type="lists_get_at_index" id="get_pq_item">
                                    <value name="LIST">
                                      <block type="variables_get" id="pq_var_get">
                                        <field name="VAR">PQ</field>
                                      </block>
                                    </value>
                                    <value name="INDEX">
                                      <block type="variables_get" id="min_index_var">
                                        <field name="VAR">min_index</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                    <next>
                                      <!-- dist = pq_item[0] -->
                                      <block type="variables_set" id="set_dist">
                                        <field name="VAR">dist</field>
                                        <value name="VALUE">
                                          <block type="lists_get_at_index" id="get_dist">
                                            <value name="LIST">
                                              <block type="variables_get" id="pq_item_var">
                                                <field name="VAR">pq_item</field>
                                              </block>
                                            </value>
                                            <value name="INDEX">
                                              <block type="math_number" id="dist_index">
                                                <field name="NUM">0</field>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <next>
                                          <!-- current_path = pq_item[1] -->
                                          <block type="variables_set" id="set_current_path">
                                            <field name="VAR">current_path</field>
                                            <value name="VALUE">
                                              <block type="lists_get_at_index" id="get_path">
                                                <value name="LIST">
                                                  <block type="variables_get" id="pq_item_path">
                                                    <field name="VAR">pq_item</field>
                                                  </block>
                                                </value>
                                                <value name="INDEX">
                                                  <block type="math_number" id="path_index">
                                                    <field name="NUM">1</field>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- node = ดึงตัวสุดท้ายจาก current_path -->
                                              <block type="variables_set" id="set_node">
                                                <field name="VAR">node</field>
                                                <value name="VALUE">
                                                  <block type="lists_get_last" id="get_node">
                                                    <value name="LIST">
                                                      <block type="variables_get" id="current_path_node">
                                                        <field name="VAR">current_path</field>
                                                      </block>
                                                    </value>
                                                  </block>
                                                </value>
                                        <next>
                                          <!-- Remove item at min_index from PQ -->
                                          <block type="lists_remove_at_index" id="remove_from_pq">
                                            <value name="LIST">
                                              <block type="variables_get" id="pq_var_remove">
                                                <field name="VAR">PQ</field>
                                              </block>
                                            </value>
                                            <value name="INDEX">
                                              <block type="variables_get" id="min_index_var4">
                                                <field name="VAR">min_index</field>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- if node == goal: return dist -->
                                              <block type="controls_if" id="check_goal">
                                        <value name="IF0">
                                          <block type="logic_compare" id="node_equals_goal">
                                            <value name="A">
                                              <block type="variables_get" id="node_var_goal">
                                                <field name="VAR">node</field>
                                              </block>
                                            </value>
                                            <field name="OP">EQ</field>
                                            <value name="B">
                                              <block type="variables_get" id="goal_var_check">
                                                <field name="VAR">goal</field>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <statement name="DO0">
                                          <!-- Show final path and return -->
                                          <block type="procedures_return" id="return_path">
                                            <value name="VALUE">
                                              <block type="variables_get" id="current_path_return">
                                                <field name="VAR">current_path</field>
                                              </block>
                                            </value>
                                          </block>
                                        </statement>
                                        <next>
                                          <!-- if node in visited: continue -->
                                          <block type="controls_if" id="check_visited">
                                            <value name="IF0">
                                              <block type="lists_contains" id="node_in_visited">
                                                <value name="ITEM">
                                                  <block type="variables_get" id="node_var_visited">
                                                    <field name="VAR">node</field>
                                                  </block>
                                                </value>
                                                <value name="LIST">
                                                  <block type="variables_get" id="visited_var_check">
                                                    <field name="VAR">visited</field>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                            <statement name="DO0">
                                              <!-- Continue (empty block) - skip to next iteration -->
                                            </statement>
                                            <next>
                                              <!-- add node to visited -->
                                              <block type="lists_add_item" id="add_to_visited">
                                                <value name="LIST">
                                                  <block type="variables_get" id="visited_var_add">
                                                    <field name="VAR">visited</field>
                                                  </block>
                                                </value>
                                                <value name="ITEM">
                                                  <block type="variables_get" id="node_var_add">
                                                    <field name="VAR">node</field>
                                                  </block>
                                                </value>
                                                <next>
                                                  <!-- for neighbor, weight in graph[node] -->
                                                  <block type="for_each_in_list" id="for_each_neighbor">
                                                    <field name="VAR">neighbor_data</field>
                                                    <value name="LIST">
                                                      <block type="graph_get_neighbors_with_weight" id="get_neighbors_weight">
                                                        <value name="GRAPH">
                                                          <block type="variables_get" id="graph_var">
                                                            <field name="VAR">graph</field>
                                                          </block>
                                                        </value>
                                                        <value name="NODE">
                                                          <block type="variables_get" id="node_var_neighbors">
                                                            <field name="VAR">node</field>
                                                          </block>
                                                        </value>
                                                      </block>
                                                    </value>
                                                    <statement name="DO">
                                                      <!-- neighbor = neighbor_data[0], weight = neighbor_data[1] -->
                                                      <block type="variables_set" id="set_neighbor">
                                                        <field name="VAR">neighbor</field>
                                                        <value name="VALUE">
                                                          <block type="lists_get_at_index" id="get_neighbor">
                                                            <value name="LIST">
                                                              <block type="variables_get" id="neighbor_data_var">
                                                                <field name="VAR">neighbor_data</field>
                                                              </block>
                                                            </value>
                                                            <value name="INDEX">
                                                              <block type="math_number" id="neighbor_index">
                                                                <field name="NUM">0</field>
                                                              </block>
                                                            </value>
                                                          </block>
                                                        </value>
                                                        <next>
                                                          <block type="variables_set" id="set_weight">
                                                            <field name="VAR">weight</field>
                                                            <value name="VALUE">
                                                              <block type="lists_get_at_index" id="get_weight">
                                                                <value name="LIST">
                                                                  <block type="variables_get" id="neighbor_data_var2">
                                                                    <field name="VAR">neighbor_data</field>
                                                                  </block>
                                                                </value>
                                                                <value name="INDEX">
                                                                  <block type="math_number" id="weight_index">
                                                                    <field name="NUM">1</field>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                            <next>
                                                              <!-- new_dist = dist + weight -->
                                                              <block type="variables_set" id="set_new_dist">
                                                                <field name="VAR">new_dist</field>
                                                                <value name="VALUE">
                                                                  <block type="math_arithmetic" id="calc_new_dist">
                                                                    <field name="OP">ADD</field>
                                                                    <value name="A">
                                                                      <block type="variables_get" id="dist_var_calc">
                                                                        <field name="VAR">dist</field>
                                                                      </block>
                                                                    </value>
                                                                    <value name="B">
                                                                      <block type="variables_get" id="weight_var_calc">
                                                                        <field name="VAR">weight</field>
                                                                      </block>
                                                                    </value>
                                                                  </block>
                                                                </value>
                                                                <next>
                                                                  <!-- if new_dist < distance[neighbor] -->
                                                                  <!-- Note: Simplified - using variable distance_neighbor -->
                                                                  <block type="controls_if" id="check_new_dist">
                                                                    <value name="IF0">
                                                                      <block type="logic_compare" id="compare_dist">
                                                                        <value name="A">
                                                                          <block type="variables_get" id="new_dist_var">
                                                                            <field name="VAR">new_dist</field>
                                                                          </block>
                                                                        </value>
                                                                        <field name="OP">LT</field>
                                                                        <value name="B">
                                                                          <block type="math_number" id="max_dist">
                                                                            <field name="NUM">999</field>
                                                                          </block>
                                                                        </value>
                                                                      </block>
                                                                    </value>
                                                                    <statement name="DO0">
                                                                      <!-- distance[neighbor] = new_dist -->
                                                                      <!-- Note: Simplified - would need dynamic variable access -->
                                                                      <!-- new_path = current_path + [neighbor] -->
                                                                      <block type="variables_set" id="set_new_path">
                                                                        <field name="VAR">new_path</field>
                                                                        <value name="VALUE">
                                                                          <block type="lists_concat" id="concat_path_neighbor">
                                                                            <value name="LIST1">
                                                                              <block type="variables_get" id="current_path_concat">
                                                                                <field name="VAR">current_path</field>
                                                                              </block>
                                                                            </value>
                                                                            <value name="LIST2">
                                                                              <block type="lists_create_with" id="neighbor_list_new">
                                                                                <mutation items="1"></mutation>
                                                                                <value name="ADD0">
                                                                                  <block type="variables_get" id="neighbor_var_new_path">
                                                                                    <field name="VAR">neighbor</field>
                                                                                  </block>
                                                                                </value>
                                                                              </block>
                                                                            </value>
                                                                          </block>
                                                                        </value>
                                                                        <next>
                                                                          <!-- PQ push(new_dist, new_path) -->
                                                                          <block type="lists_add_item" id="add_to_pq">
                                                                            <value name="LIST">
                                                                              <block type="variables_get" id="pq_var_add">
                                                                                <field name="VAR">PQ</field>
                                                                              </block>
                                                                            </value>
                                                                            <value name="ITEM">
                                                                              <block type="lists_create_with" id="pq_tuple_new">
                                                                                <mutation items="2"></mutation>
                                                                                <value name="ADD0">
                                                                                  <block type="variables_get" id="new_dist_var_add">
                                                                                    <field name="VAR">new_dist</field>
                                                                                  </block>
                                                                                </value>
                                                                                <value name="ADD1">
                                                                                  <block type="variables_get" id="new_path_var_add">
                                                                                    <field name="VAR">new_path</field>
                                                                                  </block>
                                                                                </value>
                                                                              </block>
                                                                            </value>
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
                    </next>
                  </block>
                </statement>
                    <next>
                      <!-- Return null when no path found -->
                      <block type="procedures_return" id="return_null">
                        <value name="VALUE">
                          <block type="logic_null" id="null_value"></block>
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
    </statement>
  </block>
  
  <!-- Main code: path = DIJ(map, 0, 7) -->
  <block type="variables_set" id="main_path_set" x="50" y="800">
    <field name="VAR">path</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_dijkstra">
        <mutation name="DIJ">
          <arg name="graph"></arg>
          <arg name="start"></arg>
          <arg name="goal"></arg>
        </mutation>
        <field name="NAME">DIJ</field>
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
            <field name="NUM">6</field>
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

/**
 * Load Dijkstra example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace to load blocks into
 */
export function loadDijkstraExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Dijkstra example blocks: workspace is null');
    return;
  }

  try {
    console.log('📦 Loading Dijkstra example blocks into workspace...');

    // Clear workspace first
    workspace.clear();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(dijkstraExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = [
          'PQ', 'visited', 'dist', 'node', 'neighbor', 'neighbor_data', 'weight',
          'new_dist', 'min_index', 'graph', 'start', 'goal', 'map', 'path', 'result',
          'distance_start', 'distance_neighbor', 'pq_item', 'current_path', 'new_path'
        ];
        variableNames.forEach(varName => {
          try {
            // Check if variable already exists
            const variableMap = workspace.getVariableMap();
            if (variableMap) {
              const existingVar = variableMap.getVariable(varName);
              if (!existingVar) {
                workspace.createVariable(varName);
                console.log(`Created variable: ${varName}`);
              } else {
                console.debug(`Variable ${varName} already exists`);
              }
            } else {
              workspace.createVariable(varName);
              console.log(`Created variable: ${varName} (no variable map)`);
            }
          } catch (e) {
            // Variable might already exist
            console.debug(`Variable ${varName} already exists or error creating:`, e);
          }
        });

        console.log('✅ Dijkstra example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Dijkstra example blocks:', error);
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDijkstraExampleBlocks:', error);
  }
}

/**
 * Get Dijkstra example XML string
 * @returns {string} XML string for Dijkstra example blocks
 */
export function getDijkstraExampleXml() {
  return dijkstraExampleXml;
}

