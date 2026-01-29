/**
 * Blockly Procedure Utilities
 * Shared utility functions for managing procedure blocks
 */

import * as Blockly from 'blockly/core';

/**
 * Sync procedure parameters between definition and call block
 * @param {Object} callBlock - Procedure call block
 * @param {Object} defBlock - Procedure definition block
 * @param {Object} workspace - Blockly workspace
 */
export function syncProcedureParameters(callBlock, defBlock, workspace) {
    if (!callBlock.setProcedureParameters || !defBlock) return;

    const params = defBlock.getVars ? defBlock.getVars() : [];
    let paramIds = [];

    try {
        if (defBlock.paramIds_ && defBlock.paramIds_.length === params.length) {
            paramIds = defBlock.paramIds_;
        } else if (defBlock.getVarModels) {
            const models = defBlock.getVarModels();
            if (models && models.length === params.length) {
                paramIds = models.map(m => m.getId());
            }
        }

        if ((!paramIds || paramIds.length !== params.length) && workspace) {
            const varMap = workspace.getVariableMap ? workspace.getVariableMap() : null;
            if (varMap) {
                paramIds = params.map(p => {
                    try {
                        const v = varMap.getVariable(p);
                        return v ? v.getId() : null;
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);
            } else if (workspace.getVariable) {
                // Fallback for older Blockly API
                paramIds = params.map(p => {
                    try {
                        const v = workspace.getVariable(p);
                        return v ? v.getId() : null;
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);
            }
        }
    } catch (e) {
        console.error('Error getting parameter IDs:', e);
    }

    if (params.length && paramIds && params.length === paramIds.length) {
        callBlock.setProcedureParameters(params, paramIds, true);
    }

    if (callBlock.render) callBlock.render();
}

/**
 * Remove variable IDs from XML string to prevent ID conflicts
 * @param {string} xmlString - XML string to clean
 * @returns {string} - Cleaned XML string
 */
export function removeVariableIdsFromXml(xmlString) {
    if (!xmlString) return xmlString;

    let cleaned = xmlString.replace(/varid="[^"]*"/g, '');
    cleaned = cleaned.replace(/<variable[^>]*\sid="[^"]*"[^>]*>/g, (match) => {
        return match.replace(/\sid="[^"]*"/g, '');
    });
    cleaned = cleaned.replace(/<variables>[\s\S]*?<\/variables>/g, '');

    return cleaned;
}

/**
 * Get parameter count from procedure definition block
 * @param {Object} def - Procedure definition block
 * @returns {number} - Number of parameters
 */
export function getParamCount(def) {
    try {
        const mutation = def.mutationToDom && def.mutationToDom();
        if (mutation && mutation.getAttribute) {
            const attrCount = mutation.getAttribute('arguments');
            if (attrCount) return parseInt(attrCount, 10) || 0;
        }
        if (mutation && mutation.childNodes) {
            return Array.from(mutation.childNodes).filter(n => n.nodeName === 'arg').length;
        }
    } catch (e) {
        console.error('Error getting parameter count:', e);
    }
    return 0;
}

/**
 * Rebind call blocks from one procedure name to another
 * @param {string} fromName - Original procedure name
 * @param {string} toName - New procedure name
 * @param {Object} workspace - Blockly workspace
 */
export function rebindCallers(fromName, toName, workspace) {
    try {
        const callers = Blockly.Procedures.getCallers(fromName || '', workspace) || [];
        callers.forEach(cb => {
            try {
                const nameField = cb.getField('NAME');
                if (nameField) {
                    nameField.setValue(toName);
                }
            } catch (e) {
                console.error('Error rebinding caller:', e);
            }
        });
    } catch (e) {
        console.error('Error in rebindCallers:', e);
    }
}
