// Helper functions to load Emei Mountain (Cable Car) example blocks into Blockly workspace
import * as Blockly from "blockly/core";

// Dijkstra (Max-Cap) Example XML
const emeiDijkstraXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="solve_emei" x="20" y="20">
    <mutation>
      <arg name="n" varid="n"></arg>
      <arg name="edges" varid="edges"></arg>
      <arg name="start" varid="start"></arg>
      <arg name="end" varid="end"></arg>
      <arg name="tourists" varid="tourists"></arg>
    </mutation>
    <field name="NAME">maxCapacity</field>
    <comment pinned="false" h="80" w="160">หาจำนวนรอบที่น้อยที่สุดในการขนนักท่องเที่ยว</comment>
    <statement name="STACK">
      <block type="variables_set" id="init_capacities">
        <field name="VAR">capacities</field>
        <value name="VALUE">
          <block type="lists_create_with" id="cap_list">
            <mutation items="0"></mutation>
          </block>
        </value>
        <next>
          <block type="controls_for" id="fill_caps">
            <field name="VAR">i</field>
            <value name="FROM">
              <block type="math_number"><field name="NUM">0</field></block>
            </value>
            <value name="TO">
              <block type="math_arithmetic">
                <field name="OP">MINUS</field>
                <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
              </block>
            </value>
            <value name="BY">
              <block type="math_number"><field name="NUM">1</field></block>
            </value>
            <statement name="DO">
              <block type="lists_setIndex" id="set_cap_0">
                <mutation at="true"></mutation>
                <field name="MODE">INSERT</field>
                <field name="WHERE">FROM_START</field>
                <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                <value name="AT"><block type="variables_get"><field name="VAR">i</field></block></value>
                <value name="TO"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </statement>
            <next>
              <block type="variables_set" id="init_parent">
                <field name="VAR">parent</field>
                <value name="VALUE"><block type="lists_create_with"><mutation items="0"></mutation></block></value>
                <next>
                  <block type="controls_for" id="fill_parent">
                    <field name="VAR">i</field>
                    <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                    <value name="TO">
                      <block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                      </block>
                    </value>
                    <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                    <statement name="DO">
                      <block type="lists_setIndex">
                        <mutation at="true"></mutation>
                        <field name="MODE">INSERT</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">parent</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">i</field></block></value>
                        <value name="TO"><block type="math_number"><field name="NUM">-1</field></block></value>
                      </block>
                    </statement>
                    <next>
                      <block type="lists_setIndex" id="set_start_inf">
                        <mutation at="true"></mutation>
                        <field name="MODE">SET</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">start</field></block></value>
                        <value name="TO"><block type="math_number"><field name="NUM">1000000</field></block></value>
                        <next>
                          <block type="variables_set" id="init_pq">
                            <field name="VAR">PQ</field>
                            <value name="VALUE">
                              <block type="lists_create_with">
                                <mutation items="1"></mutation>
                                <value name="ADD0">
                                  <block type="lists_create_with">
                                    <mutation items="2"></mutation>
                                    <value name="ADD0"><block type="math_number"><field name="NUM">1000000</field></block></value>
                                    <value name="ADD1"><block type="variables_get"><field name="VAR">start</field></block></value>
                                  </block>
                                </value>
                              </block>
                            </value>
                            <next>
                              <block type="while_loop" id="dij_loop">
                                <value name="CONDITION">
                                  <block type="logic_negate">
                                    <value name="BOOL">
                                      <block type="lists_isEmpty"><value name="VALUE"><block type="variables_get"><field name="VAR">PQ</field></block></value></block>
                                    </value>
                                  </block>
                                </value>
                                <statement name="DO">
                                  <block type="variables_set" id="find_max">
                                    <field name="VAR">idx</field>
                                    <value name="VALUE"><block type="lists_find_max_index"><value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value></block></value>
                                    <next>
                                      <block type="variables_set" id="get_top">
                                        <field name="VAR">top</field>
                                        <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">idx</field></block></value></block></value>
                                        <next>
                                          <block type="lists_remove_at_index" id="pop_top">
                                            <value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
                                            <value name="INDEX"><block type="variables_get"><field name="VAR">idx</field></block></value>
                                            <next>
                                              <block type="variables_set" id="set_u">
                                                <field name="VAR">u</field>
                                                <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">top</field></block></value><value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value></block></value>
                                                <next>
                                                  <block type="emei_highlight_peak" id="peak_u">
                                                    <value name="NODE"><block type="variables_get"><field name="VAR">u</field></block></value>
                                                    <next>
                                                      <block type="for_each_in_list" id="relax_neighbors">
                                                        <field name="VAR">neighbor_data</field>
                                                        <value name="LIST">
                                                          <block type="graph_get_neighbors_with_weight">
                                                            <value name="GRAPH"><block type="variables_get"><field name="VAR">edges</field></block></value>
                                                            <value name="NODE"><block type="variables_get"><field name="VAR">u</field></block></value>
                                                          </block>
                                                        </value>
                                                        <statement name="DO">
                                                          <block type="variables_set" id="set_v">
                                                            <field name="VAR">v</field>
                                                            <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">neighbor_data</field></block></value><value name="INDEX"><block type="math_number"><field name="NUM">0</field></block></value></block></value>
                                                            <next>
                                                              <block type="variables_set" id="calc_min_cap">
                                                                <field name="VAR">min_cap</field>
                                                                <value name="VALUE">
                                                                  <block type="math_min_max">
                                                                    <field name="OP">MIN</field>
                                                                    <value name="A"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">u</field></block></value></block></value>
                                                                    <value name="B"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">neighbor_data</field></block></value><value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value></block></value>
                                                                  </block>
                                                                </value>
                                                                <next>
                                                                  <block type="controls_if" id="check_update">
                                                                    <value name="IF0">
                                                                      <block type="logic_compare">
                                                                        <field name="OP">GT</field>
                                                                        <value name="A"><block type="variables_get"><field name="VAR">min_cap</field></block></value>
                                                                        <value name="B"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">v</field></block></value></block></value>
                                                                      </block>
                                                                    </value>
                                                                    <statement name="DO0">
                                                                      <block type="lists_setIndex" id="update_v_cap">
                                                                        <mutation at="true"></mutation>
                                                                        <field name="MODE">SET</field>
                                                                        <field name="WHERE">FROM_START</field>
                                                                        <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                                                                        <value name="AT"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                        <value name="TO"><block type="variables_get"><field name="VAR">min_cap</field></block></value>
                                                                        <next>
                                                                          <block type="lists_setIndex" id="update_parent">
                                                                            <mutation at="true"></mutation>
                                                                            <field name="MODE">SET</field>
                                                                            <field name="WHERE">FROM_START</field>
                                                                            <value name="LIST"><block type="variables_get"><field name="VAR">parent</field></block></value>
                                                                            <value name="AT"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                            <value name="TO"><block type="variables_get"><field name="VAR">u</field></block></value>
                                                                            <next>
                                                                              <block type="lists_add_item" id="push_pq">
                                                                                <value name="LIST"><block type="variables_get"><field name="VAR">PQ</field></block></value>
                                                                                <value name="ITEM">
                                                                                  <block type="lists_create_with">
                                                                                    <mutation items="2"></mutation>
                                                                                    <value name="ADD0"><block type="variables_get"><field name="VAR">min_cap</field></block></value>
                                                                                    <value name="ADD1"><block type="variables_get"><field name="VAR">v</field></block></value>
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
                                </statement>
                                <next>
                                  <block type="variables_set" id="set_bottleneck">
                                    <field name="VAR">C</field>
                                    <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">end</field></block></value></block></value>
                                    <next>
                                    <block type="variables_set" id="calc_rounds">
                                        <field name="VAR">result</field>
                                        <value name="VALUE">
                                          <block type="math_single">
                                            <field name="OP">CEIL</field>
                                            <value name="NUM">
                                              <block type="math_arithmetic">
                                                <field name="OP">DIVIDE</field>
                                                <value name="A"><block type="variables_get"><field name="VAR">tourists</field></block></value>
                                                <value name="B">
                                                  <block type="math_arithmetic">
                                                    <field name="OP">MINUS</field>
                                                    <value name="A"><block type="variables_get"><field name="VAR">C</field></block></value>
                                                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                                  </block>
                                                </value>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                        <next>
                                          <block type="emei_highlight_path">
                                            <value name="PARENT"><block type="variables_get"><field name="VAR">parent</field></block></value>
                                            <value name="END"><block type="variables_get"><field name="VAR">end</field></block></value>
                                            <value name="BOTTLENECK"><block type="variables_get"><field name="VAR">C</field></block></value>
                                            <next>
                                              <block type="emei_show_final_result">
                                                <value name="BOTTLENECK"><block type="variables_get"><field name="VAR">C</field></block></value>
                                            <value name="ROUNDS"><block type="variables_get"><field name="VAR">result</field></block></value>
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
    <value name="RETURN">
      <block type="variables_get" id="ret_rounds">
        <field name="VAR">result</field>
      </block>
    </value>
  </block>
  <block type="procedures_callreturn" id="call_maxCapacity" x="20" y="850">
    <mutation name="maxCapacity">
      <arg name="n"></arg>
      <arg name="edges"></arg>
      <arg name="start"></arg>
      <arg name="end"></arg>
      <arg name="tourists"></arg>
    </mutation>
    <value name="ARG0"><block type="variables_get"><field name="VAR">n</field></block></value>
    <value name="ARG1"><block type="variables_get"><field name="VAR">edges</field></block></value>
    <value name="ARG2"><block type="variables_get"><field name="VAR">start</field></block></value>
    <value name="ARG3"><block type="variables_get"><field name="VAR">end</field></block></value>
    <value name="ARG4"><block type="math_number"><field name="NUM">20</field></block></value>
  </block>
</xml>`;

// Prim (Max-Cap) Example XML - Implements Maximum Spanning Tree logic for bottlenecks
const emeiPrimXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="procedures_defreturn" id="solve_emei_prim" x="20" y="20">
    <mutation>
      <arg name="n" varid="n"></arg>
      <arg name="edges" varid="edges"></arg>
      <arg name="start" varid="start"></arg>
      <arg name="end" varid="end"></arg>
      <arg name="tourists" varid="tourists"></arg>
    </mutation>
    <field name="NAME">maxCapacity</field>
    <comment pinned="false" h="80" w="160">ใช้ Prim (Maximum Spanning Tree) เพื่อหาเส้นทางที่ขนคนได้สูงสุด</comment>
    <statement name="STACK">
      <block type="variables_set" id="init_capacities_prim">
        <field name="VAR">capacities</field>
        <value name="VALUE">
          <block type="lists_create_with"><mutation items="0"></mutation></block>
        </value>
        <next>
          <block type="variables_set" id="init_visited">
            <field name="VAR">visited</field>
            <value name="VALUE">
              <block type="lists_create_with"><mutation items="0"></mutation></block>
            </value>
            <next>
              <block type="variables_set" id="p_init_parent">
                <field name="VAR">parent</field>
                <value name="VALUE"><block type="lists_create_with"><mutation items="0"></mutation></block></value>
                <next>
                  <block type="controls_for" id="fill_arrays_prim">
                    <field name="VAR">i</field>
                    <value name="FROM"><block type="math_number"><field name="NUM">0</field></block></value>
                    <value name="TO">
                      <block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="variables_get"><field name="VAR">n</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                      </block>
                    </value>
                    <value name="BY"><block type="math_number"><field name="NUM">1</field></block></value>
                    <statement name="DO">
                      <block type="lists_setIndex">
                        <mutation at="true"></mutation>
                        <field name="MODE">INSERT</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">i</field></block></value>
                        <value name="TO"><block type="math_number"><field name="NUM">0</field></block></value>
                        <next>
                          <block type="lists_setIndex">
                            <mutation at="true"></mutation>
                            <field name="MODE">INSERT</field>
                            <field name="WHERE">FROM_START</field>
                            <value name="LIST"><block type="variables_get"><field name="VAR">visited</field></block></value>
                            <value name="AT"><block type="variables_get"><field name="VAR">i</field></block></value>
                            <value name="TO"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
                            <next>
                              <block type="lists_setIndex">
                                <mutation at="true"></mutation>
                                <field name="MODE">INSERT</field>
                                <field name="WHERE">FROM_START</field>
                                <value name="LIST"><block type="variables_get"><field name="VAR">parent</field></block></value>
                                <value name="AT"><block type="variables_get"><field name="VAR">i</field></block></value>
                                <value name="TO"><block type="math_number"><field name="NUM">-1</field></block></value>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </statement>
                    <next>
                      <block type="lists_setIndex">
                        <mutation at="true"></mutation>
                        <field name="MODE">SET</field>
                        <field name="WHERE">FROM_START</field>
                        <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                        <value name="AT"><block type="variables_get"><field name="VAR">start</field></block></value>
                        <value name="TO"><block type="math_number"><field name="NUM">1000000</field></block></value>
                        <next>
                          <block type="controls_repeat_ext" id="prim_iterations">
                            <value name="TIMES"><block type="variables_get"><field name="VAR">n</field></block></value>
                            <statement name="DO">
                              <block type="variables_set" id="p_find_max_u">
                                <field name="VAR">u</field>
                                <value name="VALUE">
                                  <block type="lists_find_max_index">
                                    <value name="LIST">
                                      <block type="variables_get"><field name="VAR">capacities</field></block>
                                    </value>
                                    <value name="EXCLUDE"><block type="variables_get"><field name="VAR">visited</field></block></value>
                                  </block>
                                </value>
                                <next>
                                  <block type="controls_if" id="p_check_u_found">
                                    <value name="IF0">
                                      <block type="logic_compare">
                                        <field name="OP">EQ</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">u</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                                      </block>
                                    </value>
                                    <statement name="DO0">
                                      <block type="controls_flow_statements"><field name="FLOW">BREAK</field></block>
                                    </statement>
                                    <next>
                                      <block type="emei_highlight_peak" id="p_peak_u">
                                        <value name="NODE"><block type="variables_get"><field name="VAR">u</field></block></value>
                                        <next>
                                          <block type="lists_setIndex">
                                            <mutation at="true"></mutation>
                                            <field name="MODE">SET</field>
                                            <field name="WHERE">FROM_START</field>
                                            <value name="LIST"><block type="variables_get"><field name="VAR">visited</field></block></value>
                                            <value name="AT"><block type="variables_get"><field name="VAR">u</field></block></value>
                                            <value name="TO"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                                            <next>
                                              <block type="for_each_in_list">
                                                <field name="VAR">edge</field>
                                                <value name="LIST">
                                                  <block type="graph_get_neighbors_with_weight">
                                                    <value name="GRAPH"><block type="variables_get"><field name="VAR">edges</field></block></value>
                                                    <value name="NODE"><block type="variables_get"><field name="VAR">u</field></block></value>
                                                  </block>
                                                </value>
                                                <statement name="DO">
                                                  <block type="variables_set">
                                                    <field name="VAR">v</field>
                                                    <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">edge</field></block></value><value name="INDEX"><block type="math_number"><field name="NUM">0</field></block></value></block></value>
                                                    <next>
                                                      <block type="variables_set">
                                                        <field name="VAR">w</field>
                                                        <value name="VALUE"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">edge</field></block></value><value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value></block></value>
                                                        <next>
                                                          <block type="controls_if">
                                                            <value name="IF0">
                                                              <block type="logic_operation">
                                                                <field name="OP">AND</field>
                                                                <value name="A">
                                                                  <block type="logic_negate">
                                                                    <value name="BOOL">
                                                                      <block type="lists_get_at_index">
                                                                        <value name="LIST"><block type="variables_get"><field name="VAR">visited</field></block></value>
                                                                        <value name="INDEX"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                      </block>
                                                                    </value>
                                                                  </block>
                                                                </value>
                                                                <value name="B">
                                                                  <block type="logic_compare">
                                                                    <field name="OP">GT</field>
                                                                    <value name="A">
                                                                      <block type="math_min_max">
                                                                        <field name="OP">MIN</field>
                                                                        <value name="A"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">u</field></block></value></block></value>
                                                                        <value name="B"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                                      </block>
                                                                    </value>
                                                                    <value name="B">
                                                                      <block type="lists_get_at_index">
                                                                        <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                                                                        <value name="INDEX"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                      </block>
                                                                    </value>
                                                                  </block>
                                                                </value>
                                                              </block>
                                                            </value>
                                                            <statement name="DO0">
                                                              <block type="lists_setIndex">
                                                                <mutation at="true"></mutation>
                                                                <field name="MODE">SET</field>
                                                                <field name="WHERE">FROM_START</field>
                                                                <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                                                                <value name="AT"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                <value name="TO">
                                                                  <block type="math_min_max">
                                                                    <field name="OP">MIN</field>
                                                                    <value name="A"><block type="lists_get_at_index"><value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value><value name="INDEX"><block type="variables_get"><field name="VAR">u</field></block></value></block></value>
                                                                    <value name="B"><block type="variables_get"><field name="VAR">w</field></block></value>
                                                                  </block>
                                                                </value>
                                                                <next>
                                                                  <block type="lists_setIndex">
                                                                    <mutation at="true"></mutation>
                                                                    <field name="MODE">SET</field>
                                                                    <field name="WHERE">FROM_START</field>
                                                                    <value name="LIST"><block type="variables_get"><field name="VAR">parent</field></block></value>
                                                                    <value name="AT"><block type="variables_get"><field name="VAR">v</field></block></value>
                                                                    <value name="TO"><block type="variables_get"><field name="VAR">u</field></block></value>
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
                            </statement>
                            <next>
                              <block type="variables_set">
                                <field name="VAR">C</field>
                                <value name="VALUE">
                                  <block type="lists_get_at_index">
                                    <value name="LIST"><block type="variables_get"><field name="VAR">capacities</field></block></value>
                                    <value name="INDEX"><block type="variables_get"><field name="VAR">end</field></block></value>
                                  </block>
                                </value>
                                <next>
                                  <block type="variables_set">
                                    <field name="VAR">result</field>
                                    <value name="VALUE">
                                      <block type="math_single">
                                        <field name="OP">CEIL</field>
                                        <value name="NUM">
                                          <block type="math_arithmetic">
                                            <field name="OP">DIVIDE</field>
                                            <value name="A"><block type="variables_get"><field name="VAR">tourists</field></block></value>
                                            <value name="B">
                                              <block type="math_arithmetic">
                                                <field name="OP">MINUS</field>
                                                <value name="A"><block type="variables_get"><field name="VAR">C</field></block></value>
                                                <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                              </block>
                                            </value>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                    <next>
                                      <block type="emei_highlight_path">
                                        <value name="PARENT"><block type="variables_get"><field name="VAR">parent</field></block></value>
                                        <value name="END"><block type="variables_get"><field name="VAR">end</field></block></value>
                                        <value name="BOTTLENECK"><block type="variables_get"><field name="VAR">C</field></block></value>
                                        <next>
                                          <block type="emei_show_final_result">
                                            <value name="BOTTLENECK"><block type="variables_get"><field name="VAR">C</field></block></value>
                                            <value name="ROUNDS"><block type="variables_get"><field name="VAR">result</field></block></value>
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
    <value name="RETURN">
      <block type="variables_get"><field name="VAR">result</field></block>
    </value>
  </block>
  <block type="procedures_callreturn" id="p_call_max_prim" x="20" y="1100">
    <mutation name="maxCapacity">
      <arg name="n"></arg>
      <arg name="edges"></arg>
      <arg name="start"></arg>
      <arg name="end"></arg>
      <arg name="tourists"></arg>
    </mutation>
    <value name="ARG0"><block type="variables_get"><field name="VAR">n</field></block></value>
    <value name="ARG1"><block type="variables_get"><field name="VAR">edges</field></block></value>
    <value name="ARG2"><block type="variables_get"><field name="VAR">start</field></block></value>
    <value name="ARG3"><block type="variables_get"><field name="VAR">end</field></block></value>
    <value name="ARG4"><block type="math_number"><field name="NUM">20</field></block></value>
  </block>
</xml>`;

/**
 * Load Emei Mountain example blocks into Blockly workspace
 * @param {Blockly.Workspace} workspace - The Blockly workspace
 * @param {string} type - 'dijkstra' or 'prim'
 */
export function loadEmeiMountainExample(workspace, type = 'dijkstra') {
  if (!workspace) return;

  try {
    workspace.clear();
    const xmlText = type === 'dijkstra' ? emeiDijkstraXml : emeiPrimXml;
    const xmlDom = Blockly.utils.xml.textToDom(xmlText);
    Blockly.Xml.domToWorkspace(xmlDom, workspace);

    // Create necessary variables
    const vars = [
      'capacities', 'PQ', 'neighbor_data', 'result', 'C', 'u', 'v', 'min_cap', 'idx', 'top',
      'n', 'edges', 'start', 'end', 'tourists', 'parent', 'visited', 'edge', 'w'
    ];
    vars.forEach(v => {
      if (workspace.getVariableMap) {
        workspace.getVariableMap().createVariable(v);
      } else {
        workspace.createVariable(v);
      }
    });

    // console.log removed(`✅ Loaded Emei Mountain ${type} template`);
  } catch (err) {
    console.error('Error loading Emei Mountain example:', err);
  }
}
