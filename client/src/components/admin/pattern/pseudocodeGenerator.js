import { javascriptGenerator } from 'blockly/javascript';

/**
 * pseudocodeGenerator.js
 * Pure logic สำหรับสร้าง pseudocode จาก Blockly workspace
 * ไม่มี React — ใช้ได้ทั้งใน component และ test
 */

// ─── Config: คำอธิบาย emei blocks ─────────────────────────────────
const EMEI_DESC = {
  'highlight_peak':    'ไฮไลต์โหนดที่ดีที่สุดปัจจุบัน',
  'highlight_path':    'ไฮไลต์เส้นทางที่เลือก',
  'show_final_result': 'แสดงผลลัพธ์สุดท้าย',
};

// ─── Config: Display block map (factory) ───────────────────────────
const buildDisplayMap = (getArg) => ({
  // --- Movement ---
  'move_to_node':    () => `go_to_node(${getArg('NODE_ID')}) // เดินไปยัง node นั้น`,
  'move_along_path': () => `follow_path(${getArg('PATH')}) // เดินตาม path ทั้งหมด`,
  'move_forward':    () => `move_forward() // เดินไปข้างหน้า 1 ช่อง`,
  'hit':             () => `attack() // โจมตีศัตรูในระยะ`,

  // --- Graph trace ---
  'mark_visited_visual': () => `mark_visited(${getArg('NODE')}) // ทำเครื่องหมาย node ว่าผ่านแล้ว`,
  'show_path_visual':    () => `show_path(${getArg('PATH')}) // แสดงเส้นทางที่ค้นพบ`,
  'dijkstra_visit':      () => `visit_node(${getArg('NODE')}) // เยี่ยม node และอัปเดตระยะ`,
  'dijkstra_relax':      () => `relax_edge(${getArg('FROM')}, ${getArg('TO')}, ${getArg('DIST')}) // คลายขอบถ้าพบเส้นทางสั้นกว่า`,
  'prim_visit':          () => `prim_visit(${getArg('NODE')}) // เพิ่ม node เข้า MST`,
  'prim_relax':          () => `prim_relax(${getArg('FROM')}, ${getArg('TO')}, ${getArg('WEIGHT')}) // อัปเดตน้ำหนักต่ำสุดของ node รอบข้าง`,
  'kruskal_visit':       () => `kruskal_visit(${getArg('u')}, ${getArg('v')}) // ตรวจสอบและ union สอง node`,
  'kruskal_add_edge':    () => `add_edge_to_mst(${getArg('u')}, ${getArg('v')}) // เพิ่มขอบเข้า MST`,

  // --- N-Queen ---
  'nqueen_is_safe': () => `is_safe(row=${getArg('ROW')}, col=${getArg('COL')}) // ตรวจว่าวางควีนได้ไหม`,
  'is_safe':        () => `is_safe(row=${getArg('ROW')}, col=${getArg('COL')}) // ตรวจว่าวางควีนได้ไหม`,
  'nqueen_place':   () => `place_queen(row=${getArg('ROW')}, col=${getArg('COL')}) // วางควีนบนกระดาน`,
  'place':          () => `place_queen(row=${getArg('ROW')}, col=${getArg('COL')}) // วางควีนบนกระดาน`,
  'nqueen_remove':  () => `remove_queen(row=${getArg('ROW')}) // ถอนควีน (backtrack)`,
  'delete':         () => `remove_queen(row=${getArg('ROW')}) // ถอนควีน (backtrack)`,

  // --- Knapsack ---
  'knapsack_consider_item': () => `consider_item(i=${getArg('ITEM_INDEX')}) // พิจารณาไอเทมชิ้นนี้`,
  'knapsack_pick_item':     () => `pick_item(i=${getArg('ITEM_INDEX')}) // เลือกใส่ไอเทมนี้`,
  'knapsack_skip_item':     () => `skip_item(i=${getArg('ITEM_INDEX')}) // ข้ามไอเทมนี้`,
  'knapsack_remove_item':   () => `remove_item() // ถอดไอเทม (backtrack)`,
  'knapsack_prune_skip_item': () => `knapsack_pruning(i=${getArg('ITEM_INDEX')}) // ตัดกิ่ง: ข้ามไอเท็มที่เหลือ`,
  'knapsack_dp_update':     () => `dp_update(i=${getArg('ITEM_INDEX')}, w=${getArg('CAPACITY')}, val=${getArg('VALUE')}) // อัปเดตค่า DP table`,

  // --- Coin Change ---
  'coin_change_consider':      () => `consider_coin(i=${getArg('COIN_INDEX')}) // พิจารณาเหรียญนี้`,
  'coin_change_pick_coin':     () => `pick_coin(i=${getArg('COIN_INDEX')}) // เลือกใช้เหรียญนี้`,
  'coin_change_skip_coin':     () => `skip_coin(i=${getArg('COIN_INDEX')}) // ข้ามเหรียญนี้`,
  'coin_change_remove_coin':   () => `remove_coin() // ถอนเหรียญ (backtrack)`,
  'coin_change_prune_skip':    () => `coin_change_pruning(i=${getArg('COIN_INDEX')}) // ตัดกิ่ง: ข้ามเหรียญที่เหลือ`,
  'coin_change_track_decision': () => `track_decision(amount=${getArg('AMOUNT')}, coin=${getArg('INCLUDE')}) // อัปเดตการตัดสินใจ DP`,
  'coin_change_memo_hit':       () => `memo_hit(amount=${getArg('AMOUNT')}) // พบค่าจาก cache แล้ว`,
  // Legacy Coin Change
  'coin_change_add_warrior_to_selection': () => `select_warrior(${getArg('WARRIOR_INDEX')}) // เลือกใช้นักรบ/เหรียญนี้`,
  'coin_change_remove_warrior':           () => `deselect_warrior() // ถอดนักรบ (backtrack)`,

  // --- Subset Sum ---
  'subset_sum_consider':      () => `consider(i=${getArg('WARRIOR_INDEX')}) // พิจารณาตัวเลขตำแหน่งนี้`,
  'subset_sum_include':       () => `include(i=${getArg('WARRIOR_INDEX')}) // เลือกตัวเลขนี้`,
  'subset_sum_exclude':       () => `exclude(i=${getArg('WARRIOR_INDEX')}) // ข้ามตัวเลขนี้`,
  'subset_sum_reset':         () => `reset_selection(i=${getArg('WARRIOR_INDEX')}) // รีเซ็ตการเลือก (backtrack)`,
  'subset_sum_prune_exclude': () => `subset_sum_pruning(i=${getArg('WARRIOR_INDEX')}) // ตัดกิ่ง: ไม่เลือกตัวเลขนี้`,
  'subset_sum_dp_update':     () => `dp_update(i=${getArg('INDEX')}, sum=${getArg('SUM')}, val=${getArg('VALUE')}) // อัปเดตตาราง DP`,

  // --- Fibonacci ---
  'fibo_call':      () => `fibo_call(n=${getArg('N')}) // เรียกใช้ fib(n)`,
  'fibo_base_case': () => `fibo_base_case(val=${getArg('VALUE')}) // คืนค่า base case`,
  'fibo_return':    () => `fibo_return(val=${getArg('VALUE')}) // backtrack คืนค่า`,
});

// ─── Helpers ───────────────────────────────────────────────────────

/** ดึงชื่อตัวแปรจาก VAR field พร้อม fallback chain */
const getResolvedVarName = (block, workspace, fallback = 'x') => {
  try {
    const varField = block.getField('VAR');
    if (varField?.getText) return varField.getText();
    if (varField?.getValue) {
      const model = workspace.getVariableById(varField.getValue());
      return model ? model.name : (varField.getValue() || fallback);
    }
    return block.getFieldValue('VAR') || fallback;
  } catch (_) {
    return block.getFieldValue('VAR') || fallback;
  }
};

/** ดึง code string จาก block (ลบ await ออก) */
const getCodeValue = (block) => {
  if (!block) return '...';
  try {
    const codeArr = javascriptGenerator.blockToCode(block);
    const raw = Array.isArray(codeArr) ? codeArr[0] : codeArr || '...';
    return raw.replace(/\bawait\s+/g, '').trim();
  } catch (e) {
    return block.toString().split('\n')[0];
  }
};

/** ดึง arguments ของ value inputs ออกเป็น array */
const getValueArgs = (block) =>
  (block.inputList || [])
    .filter(inp => inp.type === 1 && inp.connection?.targetBlock())
    .map(inp => getCodeValue(inp.connection.targetBlock()));

/** หา block ถัดไปใน chain (ไม่นับ output blocks) */
const getNextSibling = (block) =>
  (block.getNextBlock && !block.outputConnection) ? block.getNextBlock() : null;

/** ดึง child block จาก named input */
const getChild = (block, inputName) =>
  block.inputList.find(inp => inp.name === inputName)?.connection?.targetBlock() ?? null;

/** unique types จากทุก block ใน sub-tree ของ block นี้ */
const gatherInnerTypes = (block) => {
  let types = [block.type];
  (block.inputList || []).forEach(inp => {
    if (inp.type === 1 && inp.connection?.targetBlock()) {
      types = types.concat(gatherInnerTypes(inp.connection.targetBlock()));
    }
  });
  return types;
};

// ─── parseCodeChain: recursive block → pseudocode lines ────────────

const parseCodeChain = (block, indent, workspace) => {
  let result = [];
  let current = block;

  while (current) {
    const pfx = '    '.repeat(indent);
    const type = current.type;
    const uniqueTypes = [...new Set(gatherInnerTypes(current))].join(', ');
    let text = '';

    try {
      if (type === 'controls_if') {
        const cond = getCodeValue(current.getInputTargetBlock('IF0')) || 'condition';
        result.push({ text: `${pfx}if ${cond} then`, blockType: uniqueTypes });

        const doChild = getChild(current, 'DO0');
        if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1, workspace));

        const elseChild = getChild(current, 'ELSE');
        if (elseChild) {
          result.push({ text: `${pfx}else`, blockType: '' });
          result = result.concat(parseCodeChain(elseChild, indent + 1, workspace));
        }

        result.push({ text: `${pfx}end if`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'procedures_ifreturn') {
        const cond = getCodeValue(current.getInputTargetBlock('CONDITION')) || 'condition';
        const valBlock = current.getInputTargetBlock('VALUE');
        const val = valBlock ? getCodeValue(valBlock) : '';
        text = val ? `if ${cond} then return ${val}` : `if ${cond} then return`;

      } else if (type === 'controls_for') {
        const varName = getResolvedVarName(current, workspace, 'i');
        const from = getCodeValue(current.getInputTargetBlock('FROM'));
        const to   = getCodeValue(current.getInputTargetBlock('TO'));
        result.push({ text: `${pfx}for ${varName} from ${from} to ${to} do`, blockType: uniqueTypes });

        const doChild = getChild(current, 'DO');
        if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1, workspace));

        result.push({ text: `${pfx}end for`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'controls_whileUntil') {
        const mode = current.getFieldValue('MODE') || 'WHILE';
        const cond = getCodeValue(current.getInputTargetBlock('BOOL')) || 'condition';
        const header = mode === 'UNTIL' ? `repeat until (${cond}) do` : `repeat while (${cond}) do`;
        result.push({ text: `${pfx}${header}`, blockType: uniqueTypes });

        const doChild = getChild(current, 'DO');
        if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1, workspace));

        result.push({ text: `${pfx}end while`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'controls_forEach' || type === 'controls_for_each' || type.includes('forEach') || type.includes('for_each')) {
        const iterVar  = getResolvedVarName(current, workspace, 'item');
        const listText = getCodeValue(current.getInputTargetBlock('LIST')) || 'list';
        result.push({ text: `${pfx}for each ${iterVar} in ${listText} do`, blockType: uniqueTypes });

        const doChild = getChild(current, 'DO');
        if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1, workspace));

        result.push({ text: `${pfx}end for`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'controls_repeat' || type === 'controls_repeat_ext') {
        const timesBlock = current.getInputTargetBlock('TIMES');
        const times = timesBlock ? getCodeValue(timesBlock) : (current.getFieldValue('TIMES') || 'n');
        result.push({ text: `${pfx}for i from 1 to ${times} do`, blockType: uniqueTypes });

        const doChild = getChild(current, 'DO');
        if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1, workspace));

        result.push({ text: `${pfx}end for`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'procedures_defnoreturn' || type === 'procedures_defreturn') {
        const funcName = current.getFieldValue('NAME') || 'procedure';
        let args = '';
        try {
          if (current.getVars && workspace.getVariableById) {
            args = current.getVars()
              .map(idOrName => workspace.getVariableById(idOrName)?.name ?? idOrName)
              .join(', ');
          } else if (current.arguments_) {
            args = current.arguments_.join(', ');
          }
        } catch (_) {
          args = current.getVars?.()?.join(', ') ?? '';
        }
        result.push({ text: `${pfx}procedure ${funcName}(${args})`, blockType: uniqueTypes });

        const stackChild = getChild(current, 'STACK');
        if (stackChild) result = result.concat(parseCodeChain(stackChild, indent + 1, workspace));

        // Handle RETURN slot: only emit `return ...` if a block is actually connected
        if (type === 'procedures_defreturn') {
          const returnBlock = current.getInputTargetBlock('RETURN');
          if (returnBlock) {
            const retVal = getCodeValue(returnBlock);
            result.push({ text: `${'    '.repeat(indent + 1)}return ${retVal}`, blockType: returnBlock.type });
          }
        }

        result.push({ text: `${pfx}end procedure`, blockType: '' });
        current = getNextSibling(current);
        continue;

      } else if (type === 'procedures_callnoreturn' || type === 'procedures_callreturn') {
        const funcName = current.getFieldValue('NAME') || 'func';
        text = `${funcName}(${getValueArgs(current).join(', ')})`;

      } else if (type === 'variables_set') {
        const varName = getResolvedVarName(current, workspace, 'x');
        text = `${varName} = ${getCodeValue(current.getInputTargetBlock('VALUE'))}`;

      } else if (type === 'lists_setIndex') {
        let listName = '?';
        const listBlock = current.getInputTargetBlock('LIST');
        if (listBlock?.type === 'variables_get') {
          listName = getResolvedVarName(listBlock, workspace, '?');
        } else if (listBlock) {
          listName = getCodeValue(listBlock);
        }
        const at   = getCodeValue(current.getInputTargetBlock('AT'));
        const to   = getCodeValue(current.getInputTargetBlock('TO'));
        const mode = current.getFieldValue('MODE');
        text = mode === 'INSERT' ? `${listName}.insert(${at}, ${to})` : `${listName}[${at}] = ${to}`;

      } else if (type === 'lists_create_with') {
        const count = current.itemCount_ || 0;
        if (count === 0) {
          text = '[]';
        } else {
          const items = Array.from({ length: count }, (_, i) =>
            getCodeValue(current.getInputTargetBlock('ADD' + i)) || 'null'
          );
          text = `[${items.join(', ')}]`;
        }

      } else if (type === 'math_on_list') {
        const op   = current.getFieldValue('OP');
        const list = getCodeValue(current.getInputTargetBlock('LIST'));
        text = `Math.${op.toLowerCase()}(${list})`;

      } else if (type.startsWith('emei_')) {
        const fnName = type.replace('emei_', '');
        const args   = getValueArgs(current);
        const desc   = EMEI_DESC[fnName] ? ` // ${EMEI_DESC[fnName]}` : '';
        text = `// [แสดงผล] ${fnName}(${args.join(', ')})${desc}`;

        // emei blocks ที่มี DO/STACK body ให้ traverse ด้วย
        const bodyChild = getChild(current, 'DO') || getChild(current, 'STACK');
        if (bodyChild) {
          result.push({ text: pfx + text, blockType: uniqueTypes });
          result = result.concat(parseCodeChain(bodyChild, indent + 1, workspace));
          result.push({ text: `${pfx}end`, blockType: '' });
          current = getNextSibling(current);
          continue;
        }

      } else {
        // Display / Trace block lookup table
        const getArg = (name) => getCodeValue(current.getInputTargetBlock(name));
        const DISPLAY_BLOCK_MAP = buildDisplayMap(getArg);
        const handler = DISPLAY_BLOCK_MAP[type];
        if (handler) {
          text = `// [แสดงผล] ${handler()}`;
        } else {
          // Ultimate fallback
          let raw = current.toString().split('\n')[0];
          if (raw.length > 200) raw = raw.substring(0, 200) + '...';
          text = raw;
        }

        // Smart fallback: block ไม่รู้จักแต่มี DO/STACK body ให้ traverse อัตโนมัติ
        const bodyChild = getChild(current, 'DO') || getChild(current, 'STACK');
        if (bodyChild) {
          result.push({ text: pfx + text, blockType: uniqueTypes });
          result = result.concat(parseCodeChain(bodyChild, indent + 1, workspace));
          result.push({ text: `${pfx}end`, blockType: '' });
          current = getNextSibling(current);
          continue;
        }
      }
    } catch (e) {
      text = type;
    }

    result.push({ text: pfx + text, blockType: uniqueTypes });
    current = getNextSibling(current);
  }

  return result;
};

// ─── Main export ───────────────────────────────────────────────────

/**
 * สร้าง pseudocode lines จาก Blockly workspace
 * @param {Blockly.Workspace} workspace
 * @returns {{ text: string, blockType: string }[]}
 */
export const generatePseudocodeFromWorkspace = (workspace) => {
  try {
    javascriptGenerator.init(workspace);
  } catch (e) {
    console.warn('Could not init javascriptGenerator', e);
  }

  const validTopBlocks = workspace
    .getTopBlocks(true)
    .filter(tb => !tb.outputConnection && tb.isEnabled())
    .sort((a, b) => {
      const aIsDef = a.type.startsWith('procedures_def');
      const bIsDef = b.type.startsWith('procedures_def');
      if (aIsDef !== bIsDef) return aIsDef ? -1 : 1;
      return a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y;
    });

  return validTopBlocks.flatMap(tb => parseCodeChain(tb, 0, workspace));
};
