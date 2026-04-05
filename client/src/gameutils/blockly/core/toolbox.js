// Blockly Toolbox Configuration
// Data-driven — ไม่มี legacy aliases แล้ว (ข้อมูลใน DB ใช้ชื่อ modern ทั้งหมด)

// Category structure — แต่ละ category มี blocks ที่อยากแสดง
const CATEGORY_CONFIG = {
  // ─── Movement ─────────────────────────────────────────────
  Movement: {
    style: "logic_category",
    blocks: [
      "move_forward", "turn_left", "turn_right", "hit",
      "move_to_node", "move_along_path",
      "nqueen_place", "nqueen_remove", "cast_spell", "say"
    ]
  },

  // ─── Logic ────────────────────────────────────────────────
  Logic: {
    style: "procedure_category",
    blocks: [
      "controls_if", "procedures_ifreturn",
      "logic_compare", "logic_boolean", "logic_negate",
      "logic_operation", "logic_not_in", "logic_null",
      "nqueen_is_safe"
    ]
  },

  // ─── Conditions ───────────────────────────────────────────
  Conditions: {
    style: "math_category",
    blocks: [
      "found_monster", "can_move_forward", "near_pit", "at_goal",
      "has_coin", "has_person"
    ]
  },

  // ─── Loops ────────────────────────────────────────────────
  Loops: {
    style: "loop_category",
    blocks: [
      "controls_repeat_ext", "controls_whileUntil", "controls_for",
      "controls_forEach", "controls_flow_statements",
      "for_each_in_list"
    ]
  },

  // ─── Math / Operators ─────────────────────────────────────
  Math: {
    style: "math_category",
    blocks: [
      "math_number", "math_arithmetic", "math_on_list", "math_single",
      "var_math", "get_var_value", "text", "math_min"
    ]
  },

  // ─── Lists ────────────────────────────────────────────────
  Lists: {
    style: "list_category",
    blocks: [
      "lists_create_empty", "lists_create_with", "lists_length",
      "lists_isEmpty", "lists_indexOf",
      "lists_add_item", "lists_remove_last", "lists_remove_last_return",
      "lists_get_last", "lists_get_first",
      "lists_remove_first_return", "lists_get_at_index", "lists_setIndex",
      "lists_remove_at_index", "lists_contains", "lists_concat",
      "lists_find_min_index", "lists_find_max_index",
      "lists_sort_by_weight", "for_each_in_list",
      "lists_getSublist"
    ]
  },

  // ─── Coins ────────────────────────────────────────────────
  Coins: {
    style: "text_category",
    blocks: [
      "collect_coin", "swap_coins", "compare_coins",
      "get_coin_value", "coin_count", "is_sorted"
    ]
  },

  // ─── Rescue ───────────────────────────────────────────────
  Rescue: {
    style: "text_category",
    blocks: [
      "rescue_person", "rescue_person_at_node",
      "person_rescued", "person_count", "all_people_rescued"
    ]
  },

  // ─── Graph ────────────────────────────────────────────────
  Graph: {
    style: "procedure_category",
    blocks: [
      "graph_get_neighbors", "graph_get_neighbors_with_weight",
      "graph_get_all_edges", "graph_get_node_value", "graph_get_current_node"
    ]
  },

  // ─── Dictionary / DSU ─────────────────────────────────────
  Dictionary: {
    style: "variable_category",
    blocks: [
      "dict_create", "dict_set", "dict_get", "dict_has_key",
      "dsu_find", "dsu_union"
    ]
  },

  // ─── Visual (Algorithm Visualization) ─────────────────────
  Visual: {
    style: "logic_category",
    blocks: [
      // Graph algorithm visuals
      "dijkstra_visit", "dijkstra_relax",
      "prim_visit", "prim_relax",
      "kruskal_visit", "kruskal_add_edge",
      // Knapsack
      "knapsack_pick_item", "knapsack_remove_item", "knapsack_consider_item", "knapsack_dp_update", "knapsack_skip_item",
      // Subset Sum
      "subset_sum_consider", "subset_sum_include", "subset_sum_exclude", "subset_sum_reset", "subset_sum_dp_update",
      // Coin Change
      "coin_change_add_warrior_to_selection", "coin_change_track_decision",
      "coin_change_remove_warrior", "coin_change_consider", "coin_change_memo_hit",
      // Fibonacci
      "fibo_call", "fibo_base_case", "fibo_return",
      // Emei Mountain
      "emei_highlight_peak", "emei_highlight_path", "emei_show_final_result",
      // DFS/BFS Visual
      "graph_get_neighbors_visual", "mark_visited_visual", "show_path_visual",
      // Local variable
      "local_variable_set"
    ]
  }
};

export function createToolboxConfig(enabledBlocks) {
  const categories = [];

  // 1. Process standard categories
  Object.entries(CATEGORY_CONFIG).forEach(([name, config]) => {
    const contents = config.blocks
      .filter(type => enabledBlocks[type])
      .map(type => ({ kind: "block", type }));

    if (contents.length > 0) {
      categories.push({
        kind: "category",
        name,
        categorystyle: config.style,
        contents,
      });
    }
  });

  // 2. Functions — Blockly built-in procedure blocks (dynamic category)
  if (enabledBlocks["procedures_defreturn"] || enabledBlocks["procedures_defnoreturn"]) {
    categories.push({
      kind: "category",
      name: "Functions",
      categorystyle: "procedure_category",
      custom: "PROCEDURE",
    });

    // Custom block: procedures_return (Blockly ไม่มี built-in)
    if (enabledBlocks["procedures_defreturn"]) {
      categories.push({
        kind: "category",
        name: "Return",
        categorystyle: "procedure_category",
        contents: [{ kind: "block", type: "procedures_return" }]
      });
    }
  }

  // 3. Variables — Blockly built-in dynamic category
  const hasVariableBlocks =
    enabledBlocks["variables_get"] ||
    enabledBlocks["variables_set"] ||
    enabledBlocks["var_math"] ||
    enabledBlocks["get_var_value"];

  if (hasVariableBlocks) {
    categories.push({
      kind: "category",
      name: "Variables",
      categorystyle: "variable_category",
      custom: "VARIABLE"
    });
  }

  return {
    kind: "categoryToolbox",
    contents: categories,
  };
}
