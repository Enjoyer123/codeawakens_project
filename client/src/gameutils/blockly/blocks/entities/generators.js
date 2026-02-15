// Blockly Entity Generators (Coins and People)
import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";

export function defineEntityGenerators() {
    // Coin generators
    javascriptGenerator.forBlock["collect_coin"] = function (block) {
        return 'await collectCoin();\n';
    };

    javascriptGenerator.forBlock["have_coin"] = function (block) {
        return ['haveCoin()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["has_coin"] = javascriptGenerator.forBlock["have_coin"];

    javascriptGenerator.forBlock["swap_coins"] = function (block) {
        const index1 = javascriptGenerator.valueToCode(block, 'INDEX1', javascriptGenerator.ORDER_ATOMIC) || '0';
        const index2 = javascriptGenerator.valueToCode(block, 'INDEX2', javascriptGenerator.ORDER_ATOMIC) || '0';
        return `await swapCoins(${index1}, ${index2});\n`;
    };

    javascriptGenerator.forBlock["compare_coins"] = function (block) {
        const index1 = javascriptGenerator.valueToCode(block, 'INDEX1', javascriptGenerator.ORDER_ATOMIC) || '0';
        const index2 = javascriptGenerator.valueToCode(block, 'INDEX2', javascriptGenerator.ORDER_ATOMIC) || '0';
        const operator = block.getFieldValue('OP');
        return [`compareCoins(${index1}, ${index2}, '${operator}')`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["get_coin_value"] = function (block) {
        const index = javascriptGenerator.valueToCode(block, 'INDEX', javascriptGenerator.ORDER_ATOMIC) || '0';
        return [`getCoinValue(${index})`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["coin_count"] = function (block) {
        return ['getCoinCount()', javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["is_sorted"] = function (block) {
        const order = block.getFieldValue('ORDER');
        return [`isSorted('${order}')`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["for_each_coin"] = function (block) {
        const variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        return `
    const coins = getPlayerCoins();
    for (let coinIndex = 0; coinIndex < coins.length; coinIndex++) {
        const ${variable} = coins[coinIndex];
        ${branch}
    }
    `;
    };

    // Person rescue generators
    javascriptGenerator.forBlock["rescue_person_at_node"] = function (block) {
        const nodeId = javascriptGenerator.valueToCode(block, 'NODE_ID', javascriptGenerator.ORDER_ATOMIC) || '0';
        return `await rescuePersonAtNode(${nodeId});\n`;
    };

    javascriptGenerator.forBlock["rescue_person"] = javascriptGenerator.forBlock["rescue_person_at_node"];

    javascriptGenerator.forBlock["has_person"] = function (block) {
        return [`hasPerson()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["person_rescued"] = function (block) {
        return [`personRescued()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["person_count"] = function (block) {
        return [`getPersonCount()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["all_people_rescued"] = function (block) {
        return [`allPeopleRescued()`, javascriptGenerator.ORDER_FUNCTION_CALL];
    };

    javascriptGenerator.forBlock["for_each_person"] = function (block) {
        const statements = javascriptGenerator.statementToCode(block, 'DO');
        return `for (let i = 0; i < 10; i++) {\n${statements}\n}\n`;
    };
}
