// Load Prim's Algorithm Example Blocks
// สำหรับทดสอบด่าน Prim's algorithm (Minimum Spanning Tree)
import * as Blockly from "blockly/core";

export function loadPrimExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Prim example blocks: workspace is null');
    return;
  }

  try {
    console.log('📦 Loading Prim example blocks into workspace...');

    // Clear workspace first
    workspace.clear();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(primExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = ['graph', 'start', 'all_nodes', 'distance', 'parent', 'PQ', 'visited', 'MST_weight', 'min_index', 'pq_item', 'dist', 'node', 'neighbor_data', 'neighbor', 'weight', 'result', 'map', 'parent_node', 'parent_neighbors', 'neighbor_data_parent', 'edge_weight'];
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

        console.log('✅ Prim example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Prim example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Prim example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadPrimExampleBlocks:', error);
  }
}

// Prim Example XML - Complete Prim's algorithm blocks
const primExampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="prim_function" x="50" y="50">
    <field name="NAME">PRIM</field>
    <comment pinned="false" h="100" w="200">Prim's algorithm to find Minimum Spanning Tree (MST)</comment>
    <statement name="STACK">
      <!-- Initialize distance = {} -->
      <block type="variables_set" id="init_distance">
        <field name="VAR">distance</field>
        <value name="VALUE">
          <block type="dict_create" id="distance_dict"></block>
        </value>
        <next>
          <!-- Initialize parent = {} -->
          <block type="variables_set" id="init_parent">
            <field name="VAR">parent</field>
            <value name="VALUE">
              <block type="dict_create" id="parent_dict"></block>
            </value>
            <next>
              <!-- Initialize PQ = [(0, start)] -->
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
                          <block type="variables_get" id="start_var_pq">
                            <field name="VAR">start</field>
                          </block>
                        </value>
                      </block>
                    </value>
                  </block>
                </value>
                <next>
                  <!-- Initialize visited = [] -->
                  <block type="variables_set" id="init_visited">
                    <field name="VAR">visited</field>
                    <value name="VALUE">
                      <block type="lists_create_with" id="visited_list">
                        <mutation items="0"></mutation>
                      </block>
                    </value>
                    <next>
                      <!-- Initialize MST_weight = 0 -->
                      <block type="variables_set" id="init_mst_weight">
                        <field name="VAR">MST_weight</field>
                        <value name="VALUE">
                          <block type="math_number" id="mst_weight_0">
                            <field name="NUM">0</field>
                          </block>
                        </value>
                        <next>
                          <!-- Initialize distance for all nodes = 999, except start = 0 -->
                          <block type="for_each_in_list" id="init_all_distances">
                            <field name="VAR">node</field>
                            <value name="LIST">
                              <block type="variables_get" id="all_nodes">
                                <field name="VAR">all_nodes</field>
                              </block>
                            </value>
                            <statement name="DO">
                              <block type="controls_if" id="check_start_node">
                                <mutation else="1"></mutation>
                                <value name="IF0">
                                  <block type="logic_compare" id="node_equals_start">
                                    <value name="A">
                                      <block type="variables_get" id="node_var_check">
                                        <field name="VAR">node</field>
                                      </block>
                                    </value>
                                    <field name="OP">EQ</field>
                                    <value name="B">
                                      <block type="variables_get" id="start_var_check">
                                        <field name="VAR">start</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <!-- distance[start] = 0 -->
                                  <block type="dict_set" id="set_distance_start">
                                    <value name="DICT">
                                      <block type="variables_get" id="distance_var_set0">
                                        <field name="VAR">distance</field>
                                      </block>
                                    </value>
                                    <value name="KEY">
                                      <block type="variables_get" id="start_var_set0">
                                        <field name="VAR">start</field>
                                      </block>
                                    </value>
                                    <value name="VALUE">
                                      <block type="math_number" id="zero_value">
                                        <field name="NUM">0</field>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                                <statement name="ELSE">
                                  <!-- distance[node] = 999 -->
                                  <block type="dict_set" id="set_distance_999">
                                    <value name="DICT">
                                      <block type="variables_get" id="distance_var_set999">
                                        <field name="VAR">distance</field>
                                      </block>
                                    </value>
                                    <value name="KEY">
                                      <block type="variables_get" id="node_var_set999">
                                        <field name="VAR">node</field>
                                      </block>
                                    </value>
                                    <value name="VALUE">
                                      <block type="math_number" id="nine_nine_nine">
                                        <field name="NUM">999</field>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                              </block>
                            </statement>
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
                                                  <!-- node = pq_item[1] -->
                                                  <block type="variables_set" id="set_node">
                                                    <field name="VAR">node</field>
                                                    <value name="VALUE">
                                                      <block type="lists_get_at_index" id="get_node">
                                                        <value name="LIST">
                                                          <block type="variables_get" id="pq_item_node">
                                                            <field name="VAR">pq_item</field>
                                                          </block>
                                                        </value>
                                                        <value name="INDEX">
                                                          <block type="math_number" id="node_index">
                                                            <field name="NUM">1</field>
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
                                                              <!-- MST_weight = MST_weight + dist -->
                                                                  <block type="variables_set" id="update_mst_weight">
                                                                    <field name="VAR">MST_weight</field>
                                                                    <value name="VALUE">
                                                                      <block type="math_arithmetic" id="add_mst_weight">
                                                                        <field name="OP">ADD</field>
                                                                        <value name="A">
                                                                          <block type="variables_get" id="mst_weight_var">
                                                                            <field name="VAR">MST_weight</field>
                                                                          </block>
                                                                        </value>
                                                                        <value name="B">
                                                                          <block type="variables_get" id="dist_var_add">
                                                                            <field name="VAR">dist</field>
                                                                          </block>
                                                                        </value>
                                                                      </block>
                                                                    </value>
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
                                                                                      <!-- if neighbor not in visited && weight < distance[neighbor] -->
                                                                                      <block type="controls_if" id="check_neighbor">
                                                                                        <value name="IF0">
                                                                                          <block type="logic_operation" id="neighbor_condition">
                                                                                            <field name="OP">AND</field>
                                                                                            <value name="A">
                                                                                              <block type="logic_negate" id="neighbor_visited">
                                                                                                <value name="BOOL">
                                                                                                  <block type="lists_contains" id="neighbor_in_visited">
                                                                                                    <value name="ITEM">
                                                                                                      <block type="variables_get" id="neighbor_var_check">
                                                                                                        <field name="VAR">neighbor</field>
                                                                                                      </block>
                                                                                                    </value>
                                                                                                    <value name="LIST">
                                                                                                      <block type="variables_get" id="visited_var_neighbor">
                                                                                                        <field name="VAR">visited</field>
                                                                                                      </block>
                                                                                                    </value>
                                                                                                  </block>
                                                                                                </value>
                                                                                              </block>
                                                                                            </value>
                                                                                            <value name="B">
                                                                                              <block type="logic_compare" id="weight_less_than_distance">
                                                                                                <value name="A">
                                                                                                  <block type="variables_get" id="weight_var_compare">
                                                                                                    <field name="VAR">weight</field>
                                                                                                  </block>
                                                                                                </value>
                                                                                                <field name="OP">LT</field>
                                                                                                <value name="B">
                                                                                                  <block type="dict_get" id="get_distance_neighbor">
                                                                                                    <value name="DICT">
                                                                                                      <block type="variables_get" id="distance_var_get">
                                                                                                        <field name="VAR">distance</field>
                                                                                                      </block>
                                                                                                    </value>
                                                                                                    <value name="KEY">
                                                                                                      <block type="variables_get" id="neighbor_var_get">
                                                                                                        <field name="VAR">neighbor</field>
                                                                                                      </block>
                                                                                                    </value>
                                                                                                  </block>
                                                                                                </value>
                                                                                              </block>
                                                                                            </value>
                                                                                          </block>
                                                                                        </value>
                                                                                        <statement name="DO0">
                                                                                          <!-- distance[neighbor] = weight -->
                                                                                          <block type="dict_set" id="set_distance_neighbor">
                                                                                            <value name="DICT">
                                                                                              <block type="variables_get" id="distance_var_set">
                                                                                                <field name="VAR">distance</field>
                                                                                              </block>
                                                                                            </value>
                                                                                            <value name="KEY">
                                                                                              <block type="variables_get" id="neighbor_var_set">
                                                                                                <field name="VAR">neighbor</field>
                                                                                              </block>
                                                                                            </value>
                                                                                            <value name="VALUE">
                                                                                              <block type="variables_get" id="weight_var_set">
                                                                                                <field name="VAR">weight</field>
                                                                                              </block>
                                                                                            </value>
                                                                                            <next>
                                                                                              <!-- parent[neighbor] = node -->
                                                                                              <!-- Note: We don't update MST_weight here because MST_weight is only updated when a node is added to visited -->
                                                                                              <block type="dict_set" id="set_parent_neighbor">
                                                                                                <value name="DICT">
                                                                                                  <block type="variables_get" id="parent_var_set">
                                                                                                    <field name="VAR">parent</field>
                                                                                                  </block>
                                                                                                </value>
                                                                                                <value name="KEY">
                                                                                                  <block type="variables_get" id="neighbor_var_parent">
                                                                                                    <field name="VAR">neighbor</field>
                                                                                                  </block>
                                                                                                </value>
                                                                                                <value name="VALUE">
                                                                                                  <block type="variables_get" id="node_var_parent">
                                                                                                    <field name="VAR">node</field>
                                                                                                  </block>
                                                                                                </value>
                                                                                                <next>
                                                                                                  <!-- PQ push(distance[neighbor], neighbor) -->
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
                                                                                                          <block type="dict_get" id="get_distance_for_pq">
                                                                                                            <value name="DICT">
                                                                                                              <block type="variables_get" id="distance_var_pq">
                                                                                                                <field name="VAR">distance</field>
                                                                                                              </block>
                                                                                                            </value>
                                                                                                            <value name="KEY">
                                                                                                              <block type="variables_get" id="neighbor_var_pq">
                                                                                                                <field name="VAR">neighbor</field>
                                                                                                              </block>
                                                                                                            </value>
                                                                                                          </block>
                                                                                                        </value>
                                                                                                        <value name="ADD1">
                                                                                                          <block type="variables_get" id="neighbor_var_pq_item">
                                                                                                            <field name="VAR">neighbor</field>
                                                                                                          </block>
                                                                                                        </value>
                                                                                                      </block>
                                                                                                    </value>
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
  
  <!-- Main code: result = PRIM(map, 0) -->
  <block type="variables_set" id="main_result_set" x="50" y="800">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_prim">
        <mutation name="PRIM">
          <arg name="graph"></arg>
          <arg name="start"></arg>
        </mutation>
        <field name="NAME">PRIM</field>
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
      </block>
    </value>
  </block>
</xml>`;

/**
 * Get Prim example XML as string
 * @returns {string} XML string
 */
export function getPrimExampleXml() {
  return primExampleXml;
}

