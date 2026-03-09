// Dictionary & DSU Block Generators
// Moved from blocks/data/generators.js
import { javascriptGenerator } from "blockly/javascript";

export function defineDictionaryGenerators() {

    // Normalize 'r'/'c' key for Prim's algorithm
    const coerceRcKeyCode = (keyCode) => {
        let s = String(keyCode || '').trim();
        while (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1).trim();
        if (/^['"]r['"]$/i.test(s)) return `'r'`;
        if (/^['"]c['"]$/i.test(s)) return `'c'`;
        return keyCode;
    };

    javascriptGenerator.forBlock["dict_create"] = function () {
        return ["{}", javascriptGenerator.ORDER_ATOMIC];
    };

    javascriptGenerator.forBlock["dict_set"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        const value = javascriptGenerator.valueToCode(block, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || 'null';
        const keyCode = coerceRcKeyCode(key);
        if (javascriptGenerator.isCleanMode) return `${dict}[${keyCode}] = ${value};\n`;
        return `await dictSet(${dict}, ${keyCode}, ${value}, '${dict.trim()}');\n`;
    };

    javascriptGenerator.forBlock["dict_get"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        return [`${dict}[${coerceRcKeyCode(key)}]`, javascriptGenerator.ORDER_MEMBER];
    };

    javascriptGenerator.forBlock["dict_has_key"] = function (block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const key = javascriptGenerator.valueToCode(block, 'KEY', javascriptGenerator.ORDER_MEMBER) || 'null';
        return [`${dict}.hasOwnProperty(${key})`, javascriptGenerator.ORDER_RELATIONAL];
    };

    javascriptGenerator.forBlock["dsu_find"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const node = javascriptGenerator.valueToCode(block, 'NODE', javascriptGenerator.ORDER_MEMBER) || '0';
        if (javascriptGenerator.isCleanMode) return [`dsu_find(${parent}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
        return [`await dsuFind(${parent}, ${node})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["dsu_union"] = function (block) {
        const parent = javascriptGenerator.valueToCode(block, 'PARENT', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rank = javascriptGenerator.valueToCode(block, 'RANK', javascriptGenerator.ORDER_MEMBER) || '{}';
        const rootU = javascriptGenerator.valueToCode(block, 'ROOT_U', javascriptGenerator.ORDER_MEMBER) || '0';
        const rootV = javascriptGenerator.valueToCode(block, 'ROOT_V', javascriptGenerator.ORDER_MEMBER) || '0';
        if (javascriptGenerator.isCleanMode) return `dsu_union(${parent}, ${rank}, ${rootU}, ${rootV});\n`;
        return `await dsuUnion(${parent}, ${rank}, ${rootU}, ${rootV});\n`;
    };
}
