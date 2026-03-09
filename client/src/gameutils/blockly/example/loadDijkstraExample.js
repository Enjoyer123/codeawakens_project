// Dijkstra Example Blocks
import * as Blockly from "blockly/core";

// Fixed Dijkstra XML — visited check properly nests neighbor processing
// so cyclic graphs don't cause an infinite loop
const dijkstraExampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">

  <!-- DIJ(graph, start, goal) -> path -->
  <block type="procedures_defreturn" id="dij_func" x="50" y="50">
    <field name="NAME">DIJ</field>
    <mutation>
      <arg name="graph"></arg>
      <arg name="start"></arg>
      <arg name="goal"></arg>
    </mutation>
    <comment pinned="false" h="60" w="300">Dijkstra shortest path: returns path array</comment>
    <statement name="STACK">

      <!-- PQ = [[0, [start]]] -->
      <block type="variables_set" id="init_pq">
        <field name="VAR">PQ</field>
        <value name="VALUE">
          <block type="lists_create_with" id="pq_outer">
            <mutation items="1"></mutation>
            <value name="ADD0">
              <block type="lists_create_with" id="pq_first">
                <mutation items="2"></mutation>
                <value name="ADD0"><block type="math_number"><field name="NUM">0</field></block></value>
                <value name="ADD1">
                  <block type="lists_create_with" id="start_path">
                    <mutation items="1"></mutation>
                    <value name="ADD0"><block type="variables_get"><field name="VAR">start</field></block></value>
                  </block>
                </value>
              </block>
            </value>
          </block>
        </value>
        <next>

          <!-- visited = [] -->
          <block type="variables_set" id="init_visited">
            <field name="VAR">visited</field>
            <value name="VALUE">
              <block type="lists_create_with" id="visited_init"><mutation items="0"></mutation></block>
            </value>
            <next>

              <!-- while PQ not empty -->
              <block type="controls_whileUntil" id="main_loop"><field name="MODE">WHILE</field>
                <value name="BOOL">
                  <block type="logic_negate" id="negate_empty">
                    <value name="BOOL">
                      <block type="lists_isEmpty" id="check_empty">
                        <value name="VALUE"><block type="variables_get"><field name="VAR">PQ</field></block></value>
                      </block>
                    </value>
                  </block>
                </value>
                <statement name="DO">

                  <!-- min_index = findMinIndex(PQ) -->
                  <block type="variables_set" id="set_min_idx">
                    <field name="VAR">min_index</field>
                    <value name="VALUE">
                      <block type="lists_find_min_index" id="find_min">
                        <value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
                      </block>
                    </value>
                    <next>

                      <!-- if min_index >= 0 -->
                      <block type="controls_if" id="check_min_valid">
                        <value name="IF0">
                          <block type="logic_compare" id="min_gte_zero">
                            <value name="A"><block type="variables_get"><field name="VAR">min_index</field></block></value>
                            <field name="OP">GTE</field>
                            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
                          </block>
                        </value>
                        <statement name="DO0">

                          <!-- pq_item = PQ[min_index] -->
                          <block type="variables_set" id="set_pq_item">
                            <field name="VAR">pq_item</field>
                            <value name="VALUE">
                              <block type="lists_get_at_index" id="get_pq_item">
<value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
<value name="INDEX"><block type="variables_get"><field name="VAR">min_index</field></block></value>
</block>
                            </value>
                            <next>

                              <!-- dist = pq_item[0] -->
                              <block type="variables_set" id="set_dist">
                                <field name="VAR">dist</field>
                                <value name="VALUE">
                                  <block type="lists_get_at_index" id="get_dist">
<value name="LIST"><block type="variables_get"><field name="VAR">pq_item</field></block></value>
<value name="INDEX"><block type="math_number"><field name="NUM">0</field></block></value>
</block>
                                </value>
                                <next>

                                  <!-- current_path = pq_item[1] -->
                                  <block type="variables_set" id="set_cur_path">
                                    <field name="VAR">current_path</field>
                                    <value name="VALUE">
                                      <block type="lists_get_at_index" id="get_cur_path">
<value name="LIST"><block type="variables_get"><field name="VAR">pq_item</field></block></value>
<value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value>
</block>
                                    </value>
                                    <next>

                                      <!-- node = last(current_path) -->
                                      <block type="variables_set" id="set_node">
                                        <field name="VAR">node</field>
                                        <value name="VALUE">
                                          <block type="lists_get_last" id="get_node">
<value name="LIST"><block type="variables_get"><field name="VAR">current_path</field></block></value>
</block>
                                        </value>
                                        <next>

                                          <!-- TRACE: dijkstra_visit(node, dist) -->
                                          <block type="dijkstra_visit" id="trace_visit">
                                            <value name="NODE"><block type="variables_get"><field name="VAR">node</field></block></value>
                                            <value name="DIST"><block type="variables_get"><field name="VAR">dist</field></block></value>
                                            <next>

                                              <!-- Remove PQ[min_index] -->
                                              <block type="lists_remove_at_index" id="remove_pq">
<value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
<value name="INDEX"><block type="variables_get"><field name="VAR">min_index</field></block></value>
                                                <next>

                                                  <!-- if node == goal -> return path -->
                                                  <block type="controls_if" id="check_goal">
                                                    <value name="IF0">
                                                      <block type="logic_compare" id="cmp_goal">
                                                        <value name="A"><block type="variables_get"><field name="VAR">node</field></block></value>
                                                        <field name="OP">EQ</field>
                                                        <value name="B"><block type="variables_get"><field name="VAR">goal</field></block></value>
</block>
                                                    </value>
                                                    <statement name="DO0">
                                                      <block type="procedures_return" id="return_path">
                                                        <value name="VALUE"><block type="variables_get"><field name="VAR">current_path</field></block></value>
                                                      </block>
                                                    </statement>
                                                    <next>

                                                      <!-- KEY FIX: if NOT already visited, process neighbors -->
                                                      <block type="controls_if" id="check_not_visited">
                                                        <value name="IF0">
                                                          <block type="logic_negate" id="negate_visited">
                                                            <value name="BOOL">
                                                              <block type="lists_contains" id="in_visited">
                                                                <value name="ITEM"><block type="variables_get"><field name="VAR">node</field></block></value>
                                                                <value name="LIST"><block type="variables_get"><field name="VAR">visited</field></block></value>
                                                              </block>
                                                            </value>
                                                          </block>
                                                        </value>
                                                        <statement name="DO0">

                                                          <!-- visited.add(node) -->
                                                          <block type="lists_add_item" id="add_visited">
                                                            <value name="LIST"><block type="variables_get"><field name="VAR">visited</field></block></value>
                                                            <value name="ITEM"><block type="variables_get"><field name="VAR">node</field></block></value>
                                                            <next>

                                                              <!-- for neighbor_data in graph[node] -->
                                                              <block type="for_each_in_list" id="for_neighbors">
                                                                <field name="VAR">neighbor_data</field>
                                                                <value name="LIST">
                                                                  <block type="graph_get_neighbors_with_weight" id="get_neighbors_w">
                                                                    <value name="GRAPH"><block type="variables_get"><field name="VAR">graph</field></block></value>
                                                                    <value name="NODE"><block type="variables_get"><field name="VAR">node</field></block></value>
                                                                  </block>
                                                                </value>
                                                                <statement name="DO">

                                                                  <!-- neighbor = neighbor_data[0] -->
                                                                  <block type="variables_set" id="set_neighbor">
                                                                    <field name="VAR">neighbor</field>
                                                                    <value name="VALUE">
                                                                      <block type="lists_get_at_index" id="get_nbr">
<value name="LIST"><block type="variables_get"><field name="VAR">neighbor_data</field></block></value>
<value name="INDEX"><block type="math_number"><field name="NUM">0</field></block></value>
</block>
                                                                    </value>
                                                                    <next>

                                                                      <!-- weight = neighbor_data[1] -->
                                                                      <block type="variables_set" id="set_weight">
                                                                        <field name="VAR">weight</field>
                                                                        <value name="VALUE">
                                                                          <block type="lists_get_at_index" id="get_w">
<value name="LIST"><block type="variables_get"><field name="VAR">neighbor_data</field></block></value>
<value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value>
</block>
                                                                        </value>
                                                                        <next>

                                                                          <!-- new_dist = dist + weight -->
                                                                          <block type="variables_set" id="set_new_dist">
                                                                            <field name="VAR">new_dist</field>
                                                                            <value name="VALUE">
                                                                              <block type="math_arithmetic" id="calc_dist">
                                                                                <field name="OP">ADD</field>
                                                                                <value name="A"><block type="variables_get"><field name="VAR">dist</field></block></value>
                                                                                <value name="B"><block type="variables_get"><field name="VAR">weight</field></block></value>
                                                                              </block>
                                                                            </value>
                                                                            <next>

                                                                              <!-- if new_dist < 999 -->
                                                                              <block type="controls_if" id="check_dist">
                                                                                <value name="IF0">
                                                                                  <block type="logic_compare" id="cmp_dist">
                                                                                    <value name="A"><block type="variables_get"><field name="VAR">new_dist</field></block></value>
                                                                                    <field name="OP">LT</field>
                                                                                    <value name="B"><block type="math_number"><field name="NUM">999</field></block></value>
                                                                                  </block>
                                                                                </value>
                                                                                <statement name="DO0">

                                                                                  <!-- TRACE: dijkstra_relax(node, neighbor, new_dist) -->
                                                                                  <block type="dijkstra_relax" id="trace_relax">
                                                                                    <value name="FROM"><block type="variables_get"><field name="VAR">node</field></block></value>
                                                                                    <value name="TO"><block type="variables_get"><field name="VAR">neighbor</field></block></value>
                                                                                    <value name="NEW_DIST"><block type="variables_get"><field name="VAR">new_dist</field></block></value>
                                                                                    <next>

                                                                                      <!-- new_path = current_path + [neighbor] -->
                                                                                      <block type="variables_set" id="set_new_path">
                                                                                        <field name="VAR">new_path</field>
                                                                                        <value name="VALUE">
                                                                                          <block type="lists_concat" id="concat">
                                                                                            <value name="LIST1"><block type="variables_get"><field name="VAR">current_path</field></block></value>
                                                                                            <value name="LIST2">
                                                                                              <block type="lists_create_with" id="nbr_wrap">
                                                                                                <mutation items="1"></mutation>
                                                                                                <value name="ADD0"><block type="variables_get"><field name="VAR">neighbor</field></block></value>
                                                                                              </block>
                                                                                            </value>
                                                                                          </block>
                                                                                        </value>
                                                                                        <next>

                                                                                          <!-- PQ.push([new_dist, new_path]) -->
                                                                                          <block type="lists_add_item" id="push_pq">
                                                                                            <value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
                                                                                            <value name="ITEM">
                                                                                              <block type="lists_create_with" id="new_pq_item">
                                                                                                <mutation items="2"></mutation>
                                                                                                <value name="ADD0"><block type="variables_get"><field name="VAR">new_dist</field></block></value>
                                                                                                <value name="ADD1"><block type="variables_get"><field name="VAR">new_path</field></block></value>
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
                                                                </statement>
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
                        </statement>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>

              <next>
                <!-- return null -->
                <block type="procedures_return" id="return_null">
                  <value name="VALUE"><block type="logic_null" id="null_val"></block></value>
                </block>
              </next>

            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>

  <!-- Main: result = DIJ(map, 0, goal) -->
  <block type="variables_set" id="main_call" x="50" y="900">
    <field name="VAR">result</field>
    <value name="VALUE">
      <block type="procedures_callreturn" id="call_dij">
        <mutation name="DIJ">
          <arg name="graph"></arg>
          <arg name="start"></arg>
          <arg name="goal"></arg>
        </mutation>
        <field name="NAME">DIJ</field>
        <value name="ARG0"><block type="variables_get"><field name="VAR">map</field></block></value>
        <value name="ARG1"><block type="variables_get"><field name="VAR">start</field></block></value>
        <value name="ARG2"><block type="variables_get"><field name="VAR">goal</field></block></value>
      </block>
    </value>
    <next>
      <block type="move_along_path" id="move_path">
        <value name="PATH"><block type="variables_get"><field name="VAR">result</field></block></value>
      </block>
    </next>
  </block>

</xml>`;

export function loadDijkstraExampleBlocks(workspace) {
  if (!workspace) return;
  try {
    workspace.clear();
    setTimeout(() => {
      try {
        const xmlDom = Blockly.utils.xml.textToDom(dijkstraExampleXml);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
      } catch (error) {
        console.error('❌ Error loading Dijkstra example blocks:', error);
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error in loadDijkstraExampleBlocks:', error);
  }
}

export function getDijkstraExampleXml() {
  return dijkstraExampleXml;
}
