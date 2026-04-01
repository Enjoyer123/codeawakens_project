import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wand2, Type } from 'lucide-react';
import { javascriptGenerator } from 'blockly/javascript';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Editor from '@monaco-editor/react';

/**
 * PseudocodeEditor (Monaco Edition)
 * ให้ Admin กรอก pseudocode ในแต่ละ Step พร้อม mapping กับ block.type
 */

// ─── ย้ายออกมานอก component: ไม่ต้องสร้างใหม่ทุก render ──────────
const EMEI_DESC = {
  'highlight_peak':    'ไฮไลต์โหนดที่ดีที่สุดปัจจุบัน',
  'highlight_path':    'ไฮไลต์เส้นทางที่เลือก',
  'show_final_result': 'แสดงผลลัพธ์สุดท้าย',
};

// ─── DISPLAY_BLOCK_MAP: ย้ายออกมานอก handleAutoGenerate ─────────
// เดิมสร้างใหม่ทุก iteration ของ while loop ใน parseCodeChain
// ตอนนี้ใช้ร่วมกัน (getArg ถูก inject ตอนใช้งาน)
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
  'knapsack_dp_update':     () => `dp_update(i=${getArg('ITEM_INDEX')}, w=${getArg('CAPACITY')}, val=${getArg('VALUE')}) // อัปเดตค่า DP table`,

  // --- Coin Change ---
  'coin_change_consider':                 () => `consider_warrior(${getArg('WARRIOR')}) // พิจารณานักรบ/เหรียญนี้`,
  'coin_change_add_warrior_to_selection': () => `select_warrior(${getArg('WARRIOR')}) // เลือกใช้นักรบ/เหรียญนี้`,
  'coin_change_remove_warrior':           () => `deselect_warrior() // ถอดนักรบ (backtrack)`,
  'coin_change_track_decision':           () => `track_decision(amount=${getArg('AMOUNT')}, coin=${getArg('INCLUDE')}) // อัปเดตการตัดสินใจ DP`,
  'coin_change_memo_hit':                 () => `memo_hit(amount=${getArg('AMOUNT')}) // พบค่าจาก cache แล้ว`,

  // --- Subset Sum ---
  'subset_sum_consider':  () => `consider(i=${getArg('INDEX')}, val=${getArg('VALUE')}) // พิจารณาตัวเลขในตำแหน่งนี้`,
  'subset_sum_include':   () => `include(sum=${getArg('SUM')}) // รวมค่านี้เข้าชุด`,
  'subset_sum_exclude':   () => `exclude() // ข้ามค่านี้`,
  'subset_sum_reset':     () => `reset_selection() // รีเซ็ตการเลือก (backtrack)`,
  'subset_sum_dp_update': () => `dp_update(i=${getArg('INDEX')}, sum=${getArg('SUM')}, val=${getArg('VALUE')}) // อัปเดตตาราง DP`,
});

const PseudocodeEditor = ({ stepIndex, value = [], onChange, workspaceRef }) => {
  const [lines, setLines] = useState(Array.isArray(value) ? value : []);

  useEffect(() => {
    setLines(Array.isArray(value) ? value : []);
  }, [value]);

  // รวม Text จาก Array ให้เป็น String ก้อนเดียวสำหรับ Monaco
  const monacoValue = useMemo(() => lines.map(l => l.text).join('\n'), [lines]);

  // เมื่อพิมพ์ใน Monaco แบ่งบรรทัดแล้วอัปเดต State (รักษา blockType เดิมไว้)
  const handleEditorChange = useCallback((newCode) => {
    const newLines = (newCode || '').split('\n').map((text, i) => ({
      text,
      blockType: lines[i]?.blockType || '',
    }));
    setLines(newLines);
    onChange(newLines);
  }, [lines, onChange]);

  // เมื่อแก้ Block Type ในช่องด้านล่าง — สร้าง object ใหม่แทน mutate โดยตรง
  const handleTypeChange = useCallback((index, newType) => {
    const newLines = lines.map((l, i) =>
      i === index ? { ...l, blockType: newType } : l
    );
    setLines(newLines);
    onChange(newLines);
  }, [lines, onChange]);

  const handleAutoGenerate = useCallback(() => {
    if (!workspaceRef?.current || !window.Blockly) {
      alert('ไม่พบ Workspace ปัจจุบัน');
      return;
    }
    const workspace = workspaceRef.current;

    // ─── helpers ──────────────────────────────────────────────────

    // ดึงชื่อตัวแปรจาก VAR field พร้อม fallback chain
    const getResolvedVarName = (block, fallback = 'x') => {
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

    // ดึง code string จาก block (ลบ await ออก)
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

    // ดึง arguments ของ value inputs ออกเป็น array
    const getValueArgs = (block) =>
      (block.inputList || [])
        .filter(inp => inp.type === 1 && inp.connection?.targetBlock())
        .map(inp => getCodeValue(inp.connection.targetBlock()));

    // หา block ถัดไปใน chain (ไม่นับ output blocks)
    const getNextSibling = (block) =>
      (block.getNextBlock && !block.outputConnection) ? block.getNextBlock() : null;

    // ดึง child block จาก named input
    const getChild = (block, inputName) =>
      block.inputList.find(inp => inp.name === inputName)?.connection?.targetBlock() ?? null;

    // unique types จากทุก block ใน sub-tree ของ block นี้
    const gatherInnerTypes = (block) => {
      let types = [block.type];
      (block.inputList || []).forEach(inp => {
        if (inp.type === 1 && inp.connection?.targetBlock()) {
          types = types.concat(gatherInnerTypes(inp.connection.targetBlock()));
        }
      });
      return types;
    };

    // ─── parseCodeChain ───────────────────────────────────────────
    const parseCodeChain = (block, indent = 0) => {
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
            if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1));

            const elseChild = getChild(current, 'ELSE');
            if (elseChild) {
              result.push({ text: `${pfx}else`, blockType: '' });
              result = result.concat(parseCodeChain(elseChild, indent + 1));
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
            const varName = getResolvedVarName(current, 'i');
            const from = getCodeValue(current.getInputTargetBlock('FROM'));
            const to   = getCodeValue(current.getInputTargetBlock('TO'));
            result.push({ text: `${pfx}for ${varName} from ${from} to ${to} do`, blockType: uniqueTypes });

            const doChild = getChild(current, 'DO');
            if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1));

            result.push({ text: `${pfx}end for`, blockType: '' });
            current = getNextSibling(current);
            continue;

          } else if (type === 'controls_whileUntil') {
            const mode = current.getFieldValue('MODE') || 'WHILE';
            const cond = getCodeValue(current.getInputTargetBlock('BOOL')) || 'condition';
            const header = mode === 'UNTIL' ? `repeat until (${cond}) do` : `repeat while (${cond}) do`;
            result.push({ text: `${pfx}${header}`, blockType: uniqueTypes });

            const doChild = getChild(current, 'DO');
            if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1));

            result.push({ text: `${pfx}end while`, blockType: '' });
            current = getNextSibling(current);
            continue;

          } else if (type === 'controls_forEach' || type === 'controls_for_each' || type.includes('forEach') || type.includes('for_each')) {
            const iterVar  = getResolvedVarName(current, 'item');
            const listText = getCodeValue(current.getInputTargetBlock('LIST')) || 'list';
            result.push({ text: `${pfx}for each ${iterVar} in ${listText} do`, blockType: uniqueTypes });

            const doChild = getChild(current, 'DO');
            if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1));

            result.push({ text: `${pfx}end for`, blockType: '' });
            current = getNextSibling(current);
            continue;

          } else if (type === 'controls_repeat' || type === 'controls_repeat_ext') {
            const timesBlock = current.getInputTargetBlock('TIMES');
            const times = timesBlock ? getCodeValue(timesBlock) : (current.getFieldValue('TIMES') || 'n');
            result.push({ text: `${pfx}for i from 1 to ${times} do`, blockType: uniqueTypes });

            const doChild = getChild(current, 'DO');
            if (doChild) result = result.concat(parseCodeChain(doChild, indent + 1));

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
            if (stackChild) result = result.concat(parseCodeChain(stackChild, indent + 1));

            result.push({ text: `${pfx}end procedure`, blockType: '' });
            current = getNextSibling(current);
            continue;

          } else if (type === 'procedures_callnoreturn' || type === 'procedures_callreturn') {
            const funcName = current.getFieldValue('NAME') || 'func';
            text = `${funcName}(${getValueArgs(current).join(', ')})`;

          } else if (type === 'variables_set') {
            const varName = getResolvedVarName(current, 'x');
            text = `${varName} = ${getCodeValue(current.getInputTargetBlock('VALUE'))}`;

          } else if (type === 'lists_setIndex') {
            let listName = '?';
            const listBlock = current.getInputTargetBlock('LIST');
            if (listBlock?.type === 'variables_get') {
              listName = getResolvedVarName(listBlock, '?');
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
              result = result.concat(parseCodeChain(bodyChild, indent + 1));
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
              result = result.concat(parseCodeChain(bodyChild, indent + 1));
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

    // ─── Entry point ──────────────────────────────────────────────
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

    const newLines = validTopBlocks.flatMap(tb => parseCodeChain(tb, 0));

    if (newLines.length === 0) {
      alert('ไม่พบบล็อก โครงสร้าง หลักบนกระดานเลยครับ');
      return;
    }

    if (window.confirm(`สร้าง Pseudocode สำเร็จ (${newLines.length} บรรทัด)! ต้องการแทนที่ข้อมูลเดิมไหม?`)) {
      setLines(newLines);
      onChange(newLines);
    }
  }, [workspaceRef, lines, onChange]);

  return (
    <div className="bg-white border rounded-xl shadow-sm flex flex-col h-full mt-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1 rounded-md">
              <Type size={18} />
            </span>
            Pseudocode Editor (Step {stepIndex + 1})
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">แก้โค้ดด้านบน แล้วใส่ Block Type ด้านล่าง</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoGenerate}
          className="gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-sm transition-all"
        >
          <Wand2 size={14} className="animate-pulse" />
          Auto-Gen จาก Block
        </Button>
      </div>

      {/* Part 1: Monaco Code Editor */}
      <div className="border-b border-gray-200 h-[250px] shrink-0 relative bg-[#fffffe]">
        <div className="absolute top-0 left-0 right-0 bg-gray-100 px-3 py-1 border-b text-[10px] font-bold text-gray-500 flex justify-between z-10">
          <span>CODE EDITOR</span>
          <span className="font-normal">เขียนได้อย่างอิสระ (รองรับ Tab)</span>
        </div>
        <div className="pt-6 h-full">
          <Editor
            height="100%"
            defaultLanguage="pascal"
            value={monacoValue}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"Fira Code", monospace',
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              padding: { top: 8 },
              tabSize: 4,
              insertSpaces: true,
              autoIndent: 'none',
              detectIndentation: false,
            }}
          />
        </div>
      </div>

      {/* Part 2: Block Type Mapping */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="flex gap-3 px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="w-8 text-center shrink-0">#</div>
          <div className="flex-1">Pseudocode Preview</div>
          <div className="w-[180px] shrink-0">Block Type</div>
        </div>

        <div className="space-y-1.5 pb-8">
          {lines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed rounded-lg bg-white">
              พิมพ์โค้ดด้านบน หรือกด Auto-Gen เพื่อเริ่มการ Mapping
            </div>
          ) : (
            lines.map((line, idx) => (
              <div
                key={idx}
                className={`flex gap-3 items-center bg-white border border-gray-200 rounded-lg p-1.5 px-2 transition-all ${
                  line.blockType ? 'border-l-4 border-l-blue-400' : 'hover:border-blue-300'
                }`}
              >
                <div className="w-8 shrink-0 text-center font-mono text-[11px] text-gray-400">
                  {idx + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="font-mono text-[12px] text-gray-600 truncate opacity-70">
                    {line.text || <span className="italic text-gray-300">(บรรทัดว่าง)</span>}
                  </div>
                </div>
                <div className="w-[180px] shrink-0">
                  <Input
                    placeholder="เช่น controls_if"
                    value={line.blockType || ''}
                    onChange={(e) => handleTypeChange(idx, e.target.value)}
                    className="h-8 text-[11px] font-mono border-gray-200 focus-visible:ring-blue-400 bg-blue-50/30 placeholder:text-gray-300"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PseudocodeEditor;