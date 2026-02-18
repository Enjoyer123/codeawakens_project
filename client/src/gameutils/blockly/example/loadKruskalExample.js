// Load Kruskal's Algorithm Example Blocks
// สำหรับทดสอบด่าน Kruskal's algorithm (Minimum Spanning Tree)
import * as Blockly from "blockly/core";

export function loadKruskalExampleBlocks(workspace) {
  if (!workspace) {
    console.error('Cannot load Kruskal example blocks: workspace is null');
    return;
  }

  try {
    // console.log removed('📦 Loading Kruskal example blocks into workspace...');

    // Clear workspace first
    workspace.clear();

    // Wait a bit for workspace to be ready
    setTimeout(() => {
      try {
        // Parse XML
        const xmlDom = Blockly.utils.xml.textToDom(kruskalExampleXml);

        // Load into workspace
        Blockly.Xml.domToWorkspace(xmlDom, workspace);

        // Ensure variables exist
        const variableNames = ['graph', 'start', 'edges', 'parent', 'rank', 'MST_weight', 'MST_edges', 'edge_data', 'u', 'v', 'weight', 'root_u', 'root_v', 'result', 'map'];
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

        // console.log removed('✅ Kruskal example blocks loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Kruskal example blocks:', error);
        alert('เกิดข้อผิดพลาดในการโหลด Kruskal example blocks: ' + (error.message || 'รูปแบบไม่ถูกต้อง'));
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadKruskalExampleBlocks:', error);
  }
}

// Kruskal Example XML - Complete Kruskal's algorithm blocks
const kruskalExampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="kruskal_function" x="50" y="50">
    <field name="NAME">KRUSKAL</field>
    <comment pinned="false" h="100" w="200">Kruskal's algorithm to find Minimum Spanning Tree (MST)</comment>
    <statement name="STACK">
      <!-- edges = get_all_edge(graph) -->
      <block type="variables_set" id="init_edges">
        <field name="VAR">edges</field>
        <value name="VALUE">
          <block type="graph_get_all_edges" id="get_all_edges">
            <value name="GRAPH">
              <block type="variables_get" id="graph_var_edges">
                <field name="VAR">graph</field>
              </block>
            </value>
          </block>
        </value>
        <next>
          <!-- edges = sort_by_weight(edges) -->
          <block type="variables_set" id="sort_edges">
            <field name="VAR">edges</field>
            <value name="VALUE">
              <block type="lists_sort_by_weight" id="sort_edges_block">
                <value name="LIST">
                  <block type="variables_get" id="edges_var_sort">
                    <field name="VAR">edges</field>
                  </block>
                </value>
              </block>
            </value>
            <next>
              <!-- Initialize parent = {} -->
              <block type="variables_set" id="init_parent">
                <field name="VAR">parent</field>
                <value name="VALUE">
                  <block type="dict_create" id="parent_dict"></block>
                </value>
                <next>
                  <!-- Initialize rank = {} -->
                  <block type="variables_set" id="init_rank">
                    <field name="VAR">rank</field>
                    <value name="VALUE">
                      <block type="dict_create" id="rank_dict"></block>
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
                          <!-- Initialize MST_edges = [] -->
                          <block type="variables_set" id="init_mst_edges">
                            <field name="VAR">MST_edges</field>
                            <value name="VALUE">
                              <block type="lists_create_with" id="mst_edges_list">
                                <mutation items="0"></mutation>
                              </block>
                            </value>
                            <next>
                              <!-- for edge_data in edges -->
                          <block type="for_each_in_list" id="for_each_edge">
                            <field name="VAR">edge_data</field>
                            <value name="LIST">
                              <block type="variables_get" id="edges_var_loop">
                                <field name="VAR">edges</field>
                              </block>
                            </value>
                            <statement name="DO">
                              <!-- u = edge_data[0], v = edge_data[1], weight = edge_data[2] -->
                              <block type="variables_set" id="set_u">
                                <field name="VAR">u</field>
                                <value name="VALUE">
                                  <block type="lists_get_at_index" id="get_u">
                                    <value name="LIST">
                                      <block type="variables_get" id="edge_data_var">
                                        <field name="VAR">edge_data</field>
                                      </block>
                                    </value>
                                    <value name="INDEX">
                                      <block type="math_number" id="u_index">
                                        <field name="NUM">0</field>
                                      </block>
                                    </value>
                                  </block>
                                </value>
                                <next>
                                  <block type="variables_set" id="set_v">
                                    <field name="VAR">v</field>
                                    <value name="VALUE">
                                      <block type="lists_get_at_index" id="get_v">
                                        <value name="LIST">
                                          <block type="variables_get" id="edge_data_var_v">
                                            <field name="VAR">edge_data</field>
                                          </block>
                                        </value>
                                        <value name="INDEX">
                                          <block type="math_number" id="v_index">
                                            <field name="NUM">1</field>
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
                                              <block type="variables_get" id="edge_data_var_weight">
                                                <field name="VAR">edge_data</field>
                                              </block>
                                            </value>
                                            <value name="INDEX">
                                              <block type="math_number" id="weight_index">
                                                <field name="NUM">2</field>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <next>
                                          <!-- root_u = find(u) -->
                                          <block type="variables_set" id="set_root_u">
                                            <field name="VAR">root_u</field>
                                            <value name="VALUE">
                                              <block type="dsu_find" id="find_u">
                                                <value name="PARENT">
                                                  <block type="variables_get" id="parent_var_find_u">
                                                    <field name="VAR">parent</field>
                                                  </block>
                                                </value>
                                                <value name="NODE">
                                                  <block type="variables_get" id="u_var_find">
                                                    <field name="VAR">u</field>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                            <next>
                                              <!-- root_v = find(v) -->
                                              <block type="variables_set" id="set_root_v">
                                                <field name="VAR">root_v</field>
                                                <value name="VALUE">
                                                  <block type="dsu_find" id="find_v">
                                                    <value name="PARENT">
                                                      <block type="variables_get" id="parent_var_find_v">
                                                        <field name="VAR">parent</field>
                                                      </block>
                                                    </value>
                                                    <value name="NODE">
                                                      <block type="variables_get" id="v_var_find">
                                                        <field name="VAR">v</field>
                                                      </block>
                                                    </value>
                                                  </block>
                                                </value>
                                                <next>
                                                  <!-- if root_u != root_v -->
                                                  <block type="controls_if" id="check_roots">
                                                    <value name="IF0">
                                                      <block type="logic_compare" id="roots_not_equal">
                                                        <value name="A">
                                                          <block type="variables_get" id="root_u_var">
                                                            <field name="VAR">root_u</field>
                                                          </block>
                                                        </value>
                                                        <field name="OP">NEQ</field>
                                                        <value name="B">
                                                          <block type="variables_get" id="root_v_var">
                                                            <field name="VAR">root_v</field>
                                                          </block>
                                                        </value>
                                                      </block>
                                                    </value>
                                                    <statement name="DO0">
                                                      <!-- Union(root_u, root_v) -->
                                                      <block type="dsu_union" id="union_roots">
                                                        <value name="PARENT">
                                                          <block type="variables_get" id="parent_var_union">
                                                            <field name="VAR">parent</field>
                                                          </block>
                                                        </value>
                                                        <value name="RANK">
                                                          <block type="variables_get" id="rank_var_union">
                                                            <field name="VAR">rank</field>
                                                          </block>
                                                        </value>
                                                        <value name="ROOT_U">
                                                          <block type="variables_get" id="root_u_var_union">
                                                            <field name="VAR">root_u</field>
                                                          </block>
                                                        </value>
                                                        <value name="ROOT_V">
                                                          <block type="variables_get" id="root_v_var_union">
                                                            <field name="VAR">root_v</field>
                                                          </block>
                                                        </value>
                                                        <next>
                                                          <!-- Add edge to MST_edges -->
                                                          <block type="lists_add_item" id="add_to_mst_edges">
                                                            <value name="LIST">
                                                              <block type="variables_get" id="mst_edges_var">
                                                                <field name="VAR">MST_edges</field>
                                                              </block>
                                                            </value>
                                                            <value name="ITEM">
                                                              <block type="lists_create_with" id="mst_edge_tuple">
                                                                <mutation items="3"></mutation>
                                                                <value name="ADD0">
                                                                  <block type="variables_get" id="u_var_mst">
                                                                    <field name="VAR">u</field>
                                                                  </block>
                                                                </value>
                                                                <value name="ADD1">
                                                                  <block type="variables_get" id="v_var_mst">
                                                                    <field name="VAR">v</field>
                                                                  </block>
                                                                </value>
                                                                <value name="ADD2">
                                                                  <block type="variables_get" id="weight_var_mst">
                                                                    <field name="VAR">weight</field>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                            <next>
                                                              <!-- MST_weight = MST_weight + weight -->
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
                                                                      <block type="variables_get" id="weight_var_add">
                                                                        <field name="VAR">weight</field>
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
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </statement>
                            <next>
                              <!-- Return MST_weight, parent -->
                              <block type="procedures_return" id="return_result">
                                <value name="VALUE">
                                  <block type="variables_get" id="mst_weight_return">
                                    <field name="VAR">MST_weight</field>
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
    </statement>
  </block>
  
  <!-- Main code: result = KRUSKAL(map, 0) -->
  <block type="variables_set" id="main_result_set" x="50" y="800">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_kruskal">
        <mutation name="KRUSKAL">
          <arg name="graph"></arg>
          <arg name="start"></arg>
        </mutation>
        <field name="NAME">KRUSKAL</field>
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

