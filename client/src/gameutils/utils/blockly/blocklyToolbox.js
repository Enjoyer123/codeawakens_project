// Blockly Toolbox Configuration
export function createToolboxConfig(enabledBlocks) {
  console.log("🔧 createToolboxConfig called with enabledBlocks:", enabledBlocks);
  console.log("🔧 enabledBlocks keys:", Object.keys(enabledBlocks || {}));
  const categories = [];

  // Movement category
  const movementBlocks = [];
  if (enabledBlocks["move_forward"]) {
    console.log("✅ Adding move_forward block");
    movementBlocks.push({ kind: "block", type: "move_forward" });
  }
  if (enabledBlocks["turn_left"]) {
    console.log("✅ Adding turn_left block");
    movementBlocks.push({ kind: "block", type: "turn_left" });
  }
  if (enabledBlocks["turn_right"]) {
    console.log("✅ Adding turn_right block");
    movementBlocks.push({ kind: "block", type: "turn_right" });
  }
  if (enabledBlocks["hit"]) {
    console.log("✅ Adding hit block");
    movementBlocks.push({ kind: "block", type: "hit" });
  }

  console.log("🔧 Movement blocks count:", movementBlocks.length);
  if (movementBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🚀 การเคลื่อนที่",
      categorystyle: "logic_category",
      contents: movementBlocks,
    });
  }

  // Logic category
  const logicBlocks = [];
  if (enabledBlocks["if_else"])
    logicBlocks.push({ kind: "block", type: "if_else" });
  if (enabledBlocks["if_only"])
    logicBlocks.push({ kind: "block", type: "if_only" });
  if (enabledBlocks["if_return"])
    logicBlocks.push({ kind: "block", type: "if_return" });
  if (enabledBlocks["logic_compare"])
    logicBlocks.push({ kind: "block", type: "logic_compare" });
  if (enabledBlocks["logic_boolean"])
    logicBlocks.push({ kind: "block", type: "logic_boolean" });
  if (enabledBlocks["logic_negate"])
    logicBlocks.push({ kind: "block", type: "logic_negate" });
  if (enabledBlocks["logic_operation"])
    logicBlocks.push({ kind: "block", type: "logic_operation" });

  if (logicBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🧠 ตรรกะ",
      categorystyle: "procedure_category",
      contents: logicBlocks,
    });
  }

  // Conditions category
  const conditionBlocks = [];
  if (enabledBlocks["found_monster"])
    conditionBlocks.push({ kind: "block", type: "found_monster" });
  if (enabledBlocks["can_move_forward"])
    conditionBlocks.push({ kind: "block", type: "can_move_forward" });
  if (enabledBlocks["near_pit"])
    conditionBlocks.push({ kind: "block", type: "near_pit" });
  if (enabledBlocks["at_goal"])
    conditionBlocks.push({ kind: "block", type: "at_goal" });

  if (conditionBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "❓ เงื่อนไข",
      categorystyle: "math_category",
      contents: conditionBlocks,
    });
  }

  // Loops category
  const loopBlocks = [];
  if (enabledBlocks["repeat"])
    loopBlocks.push({ kind: "block", type: "repeat" });
  if (enabledBlocks["while_loop"])
    loopBlocks.push({ kind: "block", type: "while_loop" });
  if (enabledBlocks["for_each_coin"])
    loopBlocks.push({ kind: "block", type: "for_each_coin" });
  if (enabledBlocks["for_index"])
    loopBlocks.push({ kind: "block", type: "for_index" });
  if (enabledBlocks["for_loop_dynamic"])
    loopBlocks.push({ kind: "block", type: "for_loop_dynamic" });

  if (loopBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🔄 ลูป",
      categorystyle: "loop_category",
      contents: loopBlocks,
    });
  }

  // Coins category
  const coinBlocks = [];
  if (enabledBlocks["collect_coin"])
    coinBlocks.push({ kind: "block", type: "collect_coin" });
  if (enabledBlocks["have_coin"])
    coinBlocks.push({ kind: "block", type: "have_coin" });

  if (coinBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🪙 เหรียญ",
      categorystyle: "text_category",
      contents: coinBlocks,
    });
  }

  // Coin Sorting category
  const coinSortingBlocks = [];
  if (enabledBlocks["swap_coins"])
    coinSortingBlocks.push({ kind: "block", type: "swap_coins" });
  if (enabledBlocks["compare_coins"])
    coinSortingBlocks.push({ kind: "block", type: "compare_coins" });
  if (enabledBlocks["get_coin_value"])
    coinSortingBlocks.push({ kind: "block", type: "get_coin_value" });
  if (enabledBlocks["coin_count"])
    coinSortingBlocks.push({ kind: "block", type: "coin_count" });
  if (enabledBlocks["is_sorted"])
    coinSortingBlocks.push({ kind: "block", type: "is_sorted" });

  if (coinSortingBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🔄 เรียงเหรียญ",
      categorystyle: "list_category",
      contents: coinSortingBlocks,
    });
  }

  // Math category
  const mathBlocks = [];
  if (enabledBlocks["math_number"])
    mathBlocks.push({ kind: "block", type: "math_number" });
  if (enabledBlocks["math_arithmetic"])
    mathBlocks.push({ kind: "block", type: "math_arithmetic" });
  if (enabledBlocks["math_compare"])
    mathBlocks.push({ kind: "block", type: "math_compare" });
  if (enabledBlocks["var_math"])
    mathBlocks.push({ kind: "block", type: "var_math" });
  if (enabledBlocks["get_var_value"])
    mathBlocks.push({ kind: "block", type: "get_var_value" });

  if (mathBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🧮 คณิตศาสตร์",
      categorystyle: "math_category",
      contents: mathBlocks,
    });
  }

  // Person Rescue category
  const personRescueBlocks = [];
  if (enabledBlocks["rescue_person_at_node"]) personRescueBlocks.push({ kind: "block", type: "rescue_person_at_node" });
  if (enabledBlocks["has_person"]) personRescueBlocks.push({ kind: "block", type: "has_person" });
  if (enabledBlocks["person_rescued"]) personRescueBlocks.push({ kind: "block", type: "person_rescued" });
  if (enabledBlocks["person_count"]) personRescueBlocks.push({ kind: "block", type: "person_count" });
  if (enabledBlocks["all_people_rescued"]) personRescueBlocks.push({ kind: "block", type: "all_people_rescued" });
  if (enabledBlocks["for_each_person"]) personRescueBlocks.push({ kind: "block", type: "for_each_person" });

  if (personRescueBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🆘 ช่วยคน",
      categorystyle: "text_category",
      contents: personRescueBlocks,
    });
  }

  // Lists category (for DFS/BFS)
  const listBlocks = [];
  if (enabledBlocks["lists_create_with"])
    listBlocks.push({ kind: "block", type: "lists_create_with" });
  if (enabledBlocks["lists_length"])
    listBlocks.push({ kind: "block", type: "lists_length" });
  if (enabledBlocks["lists_isEmpty"])
    listBlocks.push({ kind: "block", type: "lists_isEmpty" });
  if (enabledBlocks["lists_indexOf"])
    listBlocks.push({ kind: "block", type: "lists_indexOf" });
  if (enabledBlocks["lists_getIndex"])
    listBlocks.push({ kind: "block", type: "lists_getIndex" });
  if (enabledBlocks["lists_setIndex"])
    listBlocks.push({ kind: "block", type: "lists_setIndex" });

  if (listBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🗂️ ลิสต์",
      categorystyle: "list_category",
      contents: listBlocks,
    });
  }

  // Stack category
  const stackBlocks = [];
  if (enabledBlocks["push_node"]) stackBlocks.push({ kind: "block", type: "push_node" });
  if (enabledBlocks["pop_node"]) stackBlocks.push({ kind: "block", type: "pop_node" });
  if (enabledBlocks["keep_item"]) stackBlocks.push({ kind: "block", type: "keep_item" });
  if (enabledBlocks["has_treasure"]) stackBlocks.push({ kind: "block", type: "has_treasure" });
  if (enabledBlocks["treasure_collected"]) stackBlocks.push({ kind: "block", type: "treasure_collected" });
  if (enabledBlocks["stack_empty"]) stackBlocks.push({ kind: "block", type: "stack_empty" });
  if (enabledBlocks["stack_count"]) stackBlocks.push({ kind: "block", type: "stack_count" });

  if (stackBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "📚 Stack",
      categorystyle: "procedure_category",
      contents: stackBlocks,
    });
  }

  // Function category
  const functionBlocks = [];
  
  if (enabledBlocks["procedures_defreturn"]) {
    functionBlocks.push({ kind: "block", type: "procedures_defreturn" });
  }
  if (enabledBlocks["procedures_defnoreturn"]) {
    functionBlocks.push({ kind: "block", type: "procedures_defnoreturn" });
  }

  if (enabledBlocks["move_to_node"]) {
    functionBlocks.push({ kind: "block", type: "move_to_node" });
  }

  if (functionBlocks.length > 0) {
    categories.push({
      kind: "category",
      name: "🔧 ฟังก์ชัน",
      categorystyle: "procedure_category",
      contents: functionBlocks,
      custom: "PROCEDURE"
    });
  }

  // Variables category
  const hasVariableBlocks = 
    enabledBlocks["variables_get"] || 
    enabledBlocks["variables_set"] || 
    enabledBlocks["var_math"] || 
    enabledBlocks["get_var_value"];
  
  if (hasVariableBlocks) {
    console.log("✅ Adding Variables category - variable blocks enabled");
    categories.push({
      kind: "category",
      name: "ตัวแปร",
      categorystyle: "variable_category",
      custom: "VARIABLE"
    });
  } else {
    console.log("⏸️ Skipping Variables category - no variable blocks enabled");
  }

  return {
    kind: "categoryToolbox",
    contents: categories,
  };
}

