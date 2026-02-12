// Blockly Toolbox Configuration
// Data-driven and concise

// Alias mappings: [preferred, legacy] — when either is enabled, use whichever is enabled
const BLOCK_ALIASES = {
  Movement: [["place", "nqueen_place"], ["delete", "nqueen_remove"]],
  Logic: [["is_safe", "nqueen_is_safe"]],
  Coins: [["has_coin", "have_coin"]],
  Rescue: [["rescue_person", "rescue_person_at_node"]]
};

// Define category structure and contents
const CATEGORY_CONFIG = {
  Movement: {
    style: "logic_category",
    blocks: [
      "move_forward", "turn_left", "turn_right", "hit",
      "move_to_node", "move_along_path"
    ]
  },
  Logic: {
    style: "procedure_category",
    blocks: [
      "if_else", "if_only", "if_return",
      "logic_compare", "logic_boolean", "logic_negate",
      "logic_operation", "logic_not_in",
      "controls_if", "logic_null"
    ]
  },
  Conditions: {
    style: "math_category",
    blocks: ["found_monster", "can_move_forward", "near_pit", "at_goal"]
  },
  Loops: {
    style: "loop_category",
    blocks: [
      "repeat", "while_loop", "for_each_coin",
      "for_index", "for_loop_dynamic",
      "controls_repeat_ext", "controls_for",
      "controls_forEach", "controls_flow_statements"
    ]
  },
  Coins: {
    style: "text_category",
    blocks: ["collect_coin"]
  },
  "Sort Coins": {
    style: "list_category",
    blocks: [
      "swap_coins", "compare_coins", "get_coin_value",
      "coin_count", "is_sorted"
    ]
  },
  Math: {
    style: "math_category",
    blocks: [
      "math_number", "math_arithmetic",
      "math_max", "math_min", "math_min_max",
      "math_single", "math_compare",
      "var_math", "get_var_value"
    ]
  },
  Text: {
    style: "text_category",
    blocks: ["text"]
  },
  Visual: {
    style: "hat_blocks",
    blocks: [
      "emei_highlight_peak", "emei_highlight_path", "emei_show_final_result",
      "coin_change_add_warrior_to_selection", "coin_change_track_decision",
      "subset_sum_add_warrior_to_side1", "subset_sum_add_warrior_to_side2",
      "rope_visual_init", "rope_vis_enter", "rope_vis_exit",
      "rope_vis_status", "rope_target_len", "rope_get_cuts",
      "assign_train_visual", "get_train_value", "sort_trains"
    ]
  },
  Rescue: {
    style: "text_category",
    blocks: [
      "has_person", "person_rescued", "person_count",
      "all_people_rescued", "for_each_person"
    ]
  },
  Lists: {
    style: "list_category",
    blocks: [
      "lists_create_empty", "lists_create_with", "lists_length",
      "lists_isEmpty", "lists_indexOf", "lists_getIndex", "lists_setIndex",
      "lists_add_item", "lists_remove_last", "lists_get_last",
      "lists_remove_first_return", "lists_get_first", "lists_contains",
      "lists_concat", "lists_remove_last_return", "lists_find_min_index",
      "lists_find_max_index", "lists_get_at_index", "lists_remove_at_index",
      "lists_sort_by_weight", "for_each_in_list"
    ]
  },
  Stack: {
    style: "procedure_category",
    blocks: [
      "push_node", "pop_node", "keep_item", "has_treasure",
      "treasure_collected", "stack_empty", "stack_count"
    ]
  },
  Graph: {
    style: "procedure_category",
    blocks: [
      "graph_get_neighbors", "graph_get_neighbors_with_weight",
      "graph_get_all_edges", "graph_get_node_value", "graph_get_current_node"
    ]
  },
  Dictionary: {
    style: "variable_category",
    blocks: [
      "dict_create", "dict_set", "dict_get", "dict_has_key",
      "dsu_find", "dsu_union"
    ]
  }
};

export function createToolboxConfig(enabledBlocks) {
  const categories = [];

  // 1. Process standard categories
  Object.entries(CATEGORY_CONFIG).forEach(([name, config]) => {
    let contents = [];

    // Add standard blocks if enabled
    if (config.blocks) {
      contents = config.blocks
        .filter(type => enabledBlocks[type])
        .map(type => ({ kind: "block", type }));
    }

    // Add aliased blocks (e.g. "place" / "nqueen_place")
    const aliases = BLOCK_ALIASES[name];
    if (aliases) {
      for (const [preferred, legacy] of aliases) {
        if (enabledBlocks[preferred] || enabledBlocks[legacy]) {
          contents.push({
            kind: "block",
            type: enabledBlocks[preferred] ? preferred : legacy
          });
        }
      }
    }

    if (contents.length > 0) {
      categories.push({
        kind: "category",
        name: name,
        categorystyle: config.style,
        contents: contents,
      });
    }
  });

  // 2. Special Category: Functions (Dynamic Custom Category)
  if (enabledBlocks["procedures_defreturn"] || enabledBlocks["procedures_defnoreturn"]) {
    categories.push({
      kind: "category",
      name: "Functions",
      categorystyle: "procedure_category",
      custom: "PROCEDURE",
    });

    if (enabledBlocks["procedures_defreturn"]) {
      categories.push({
        kind: "category",
        name: "Return",
        categorystyle: "procedure_category",
        contents: [{ kind: "block", type: "procedures_return" }]
      });
    }
  }

  // 3. Special Category: Custom Functions (Fixed blocks)
  const customFunctionBlocks = [];
  if (enabledBlocks["function_definition"]) customFunctionBlocks.push({ kind: "block", type: "function_definition" });
  if (enabledBlocks["function_call"]) customFunctionBlocks.push({ kind: "block", type: "function_call" });

  if (customFunctionBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "Custom Functions",
      categorystyle: "procedure_category",
      contents: customFunctionBlocks
    });
  }

  // 4. Special Category: Advanced Movement
  if (enabledBlocks["move_to_node"]) {
    categories.push({
      kind: "category",
      name: "Advanced Movement",
      categorystyle: "procedure_category",
      contents: [{ kind: "block", type: "move_to_node" }]
    });
  }

  // 5. Special Category: Variables (Custom Dynamic Category)
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
