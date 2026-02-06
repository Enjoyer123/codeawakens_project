// XML Utilities for Hint System
/**
 * ดึง XML structure จาก workspace
 */
export function getWorkspaceXml(workspace) {
  console.log("🔍 getWorkspaceXml called with:", {
    workspace: !!workspace,
    workspaceType: typeof workspace,
    hasBlockly: !!window.Blockly,
    hasBlocklyXml: !!window.Blockly?.Xml,
    hasWorkspaceToDom: !!window.Blockly?.Xml?.workspaceToDom
  });

  if (!workspace) {
    console.warn("⚠️ workspace is undefined in getWorkspaceXml");
    return null;
  }

  if (!window.Blockly || !window.Blockly.Xml) {
    console.warn("⚠️ Blockly.Xml is not ready yet");
    return null;
  }

  try {
    const xml = window.Blockly.Xml.workspaceToDom(workspace);
    console.log("🔍 XML converted successfully:", xml ? "XML DOM created" : "No XML DOM");
    return xml;
  } catch (err) {
    console.error("⚠️ Error converting workspace to XML:", err);
    return null;
  }
}

/**
 * Normalize variable name - เอา ID ออกถ้ามี
 * CRITICAL: ฟังก์ชันนี้ควรจะ normalize ชื่อตัวแปรให้เหมือนกัน
 * แต่ถ้า varValue ยังเป็น ID (ตัวเลข) แสดงว่ายังไม่ได้ resolve เป็นชื่อตัวแปร
 */
function normalizeVariableName(varValue) {
  if (!varValue) return '';

  // ถ้าเป็น ID (ตัวเลขทั้งหมด) - ควรจะ resolve เป็นชื่อตัวแปรก่อนเรียกฟังก์ชันนี้
  // แต่ถ้ายังเป็น ID อยู่ ให้คืนค่าเป็น ID (เพื่อให้เปรียบเทียบได้)
  if (/^\d+$/.test(varValue)) {
    console.log(`  - ⚠️ normalizeVariableName: varValue "${varValue}" is still an ID, should have been resolved earlier`);
    return varValue;
  }

  // ถ้ามีรูปแบบ name_number ให้เอาแค่ name (เช่น "neighbor_1" -> "neighbor")
  const match = varValue.match(/^(.+?)_(\d+)$/);
  if (match) {
    const baseName = match[1];
    console.log(`  - ℹ️ normalizeVariableName: "${varValue}" -> "${baseName}" (removed suffix)`);
    return baseName;
  }

  // ถ้าเป็นชื่อตัวแปรปกติ ให้คืนค่าเป็นชื่อตัวแปรนั้น
  console.log(`  - ℹ️ normalizeVariableName: "${varValue}" -> "${varValue}" (no normalization needed)`);
  return varValue;
}

/**
 * วิเคราะห์ XML structure แบบละเอียด
 * @param {Document|Element} xml - XML DOM element
 * @param {Blockly.Workspace} workspace - Optional workspace to resolve variable IDs to names
 */
export function analyzeXmlStructure(xml, workspace = null) {
  if (!xml) return "No XML provided";

  const blocks = xml.querySelectorAll('block');
  const analysis = [];

  // CRITICAL: สร้าง variable ID to name mapping จาก XML variables section
  const variableMap = new Map();
  const variablesSection = xml.querySelector('variables');
  if (variablesSection) {
    const variables = variablesSection.querySelectorAll('variable');
    variables.forEach(variable => {
      const varId = variable.getAttribute('id');
      const varName = variable.textContent || variable.getAttribute('name') || '';
      if (varId && varName) {
        variableMap.set(varId, varName);
        console.log(`  - 📝 Variable mapping from XML: ${varId} -> ${varName}`);
      }
    });
  }

  // CRITICAL: ถ้าไม่มี variables section ใน XML แต่มี workspace ให้ resolve จาก workspace
  if (!variablesSection && workspace && workspace.getVariableMap) {
    try {
      const variableMap_workspace = workspace.getVariableMap();
      const allVariables = variableMap_workspace.getAllVariables();
      allVariables.forEach(variable => {
        const varId = variable.getId();
        const varName = variable.name;
        if (varId && varName) {
          variableMap.set(varId, varName);
          console.log(`  - 📝 Variable mapping from workspace: ${varId} -> ${varName}`);
        }
      });
    } catch (e) {
      console.log(`  - ⚠️ Error getting variables from workspace: ${e.message}`);
    }
  }

  console.log(`  - 📊 Total variable mappings: ${variableMap.size}`);

  blocks.forEach((block, index) => {
    const type = block.getAttribute('type');
    const blockInfo = {
      index,
      type,
      hasStatement: !!block.querySelector('statement'),
      hasValue: !!block.querySelector('value'),
      hasNext: !!block.querySelector(':scope > next')
    };

    // CRITICAL: เช็ค field values สำหรับ blocks ที่สำคัญ
    // สำหรับ variables_set และ variables_get: เช็ค VAR field
    if (type === 'variables_set' || type === 'variables_get') {
      const varField = block.querySelector('field[name="VAR"]');
      if (varField) {
        // CRITICAL: Blockly ใช้ id attribute ใน field VAR แทน textContent
        // ลองดึง id ก่อน แล้วค่อย textContent แล้วค่อย value
        const varId = varField.getAttribute('id');
        const varText = varField.textContent;
        const varValueAttr = varField.getAttribute('value');
        let varValue = varId || varText || varValueAttr || '';

        console.log(`  - 🔍 VAR field raw: id=${varId}, textContent="${varText}", value=${varValueAttr}, initial="${varValue}"`);
        console.log(`  - 🔍 Variable map size: ${variableMap.size}, has "${varValue}": ${variableMap.has(varValue)}`);

        // CRITICAL: ถ้า varValue เป็น ID (อาจเป็นตัวเลขหรือ string ที่เป็น ID) ให้หา variable name จาก variableMap
        // Blockly variable IDs อาจเป็น string ที่ไม่ใช่ตัวเลข (เช่น "S=:s{UNuK~JF42YVTzI5")
        if (varValue && variableMap.has(varValue)) {
          const mappedName = variableMap.get(varValue);
          varValue = mappedName;
          console.log(`  - ✅ VAR field ID "${varId}" mapped to name: "${mappedName}"`);
        } else if (varValue && /^\d+$/.test(varValue)) {
          // ถ้าเป็นตัวเลขทั้งหมด ให้ลองหาใน variableMap
          const mappedName = variableMap.get(varValue);
          if (mappedName) {
            varValue = mappedName;
            console.log(`  - ✅ VAR field numeric ID "${varId}" mapped to name: "${mappedName}"`);
          } else {
            console.log(`  - ⚠️ VAR field numeric ID "${varId}" not found in variableMap (size: ${variableMap.size}), keeping as ID`);
            // ถ้าไม่พบใน variableMap และเป็นตัวเลข อาจเป็น ID ที่ยังไม่ได้ resolve
            // ให้ลองหาใน workspace (ถ้ามี)
            if (workspace && workspace.getVariableMap) {
              try {
                const variableMap_workspace = workspace.getVariableMap();
                const variable = variableMap_workspace.getVariableById(varValue);
                if (variable) {
                  varValue = variable.name;
                  console.log(`  - ✅ VAR field ID "${varId}" resolved from workspace: "${varValue}"`);
                }
              } catch (e) {
                console.log(`  - ⚠️ Error resolving variable ID from workspace: ${e.message}`);
              }
            }
          }
        } else if (varValue && !variableMap.has(varValue)) {
          // ถ้าไม่ใช่ ID และไม่พบใน variableMap อาจเป็นชื่อตัวแปรโดยตรง
          // แต่ถ้าเป็น string ที่ยาวและมี special characters อาจเป็น ID
          if (varValue.length > 10 || /[^a-zA-Z0-9_]/.test(varValue)) {
            console.log(`  - ⚠️ VAR field value "${varValue}" looks like an ID but not in variableMap`);
            // ลองหาใน workspace
            if (workspace && workspace.getVariableMap) {
              try {
                const variableMap_workspace = workspace.getVariableMap();
                const variable = variableMap_workspace.getVariableById(varValue);
                if (variable) {
                  varValue = variable.name;
                  console.log(`  - ✅ VAR field ID "${varId}" resolved from workspace: "${varValue}"`);
                } else {
                  console.log(`  - ⚠️ VAR field ID "${varId}" not found in workspace either`);
                }
              } catch (e) {
                console.log(`  - ⚠️ Error resolving variable ID from workspace: ${e.message}`);
              }
            }
          } else {
            console.log(`  - ℹ️ VAR field value "${varValue}" not in variableMap, assuming it's a variable name`);
          }
        }

        console.log(`  - 🔍 VAR field final value: "${varValue}"`);

        const normalized = normalizeVariableName(varValue);
        blockInfo.varName = normalized;
        console.log(`  - ✅ Normalized VAR: ${varValue} -> ${normalized}`);
      } else {
        console.log(`  - ⚠️ No VAR field found for ${type} block`);
      }
    }


    // สำหรับ procedures: เช็ค NAME field
    if (type === 'procedures_defreturn' || type === 'procedures_defnoreturn' ||
      type === 'procedures_callreturn' || type === 'procedures_callnoreturn') {
      const nameField = block.querySelector('field[name="NAME"]');
      console.log(`  - 🔍 Procedure block ${type}: NAME field exists=${!!nameField}`);
      if (nameField) {
        const textContent = nameField.textContent;
        const valueAttr = nameField.getAttribute('value');
        blockInfo.procedureName = textContent || valueAttr || '';
        console.log(`  - ✅ Procedure NAME: textContent="${textContent}", value="${valueAttr}", final="${blockInfo.procedureName}"`);
      } else {
        console.log(`  - ⚠️ No NAME field found for ${type} block`);
      }
    }

    // วิเคราะห์ statement blocks
    if (blockInfo.hasStatement) {
      const statementBlocks = block.querySelectorAll('statement block');
      blockInfo.statementBlocks = Array.from(statementBlocks).map(b => b.getAttribute('type'));
    }

    // วิเคราะห์ value blocks - CRITICAL: เช็ค variable names ใน value blocks ด้วย
    if (blockInfo.hasValue) {
      const valueBlocks = block.querySelectorAll('value block');
      blockInfo.valueBlocks = Array.from(valueBlocks).map(b => {
        const blockType = b.getAttribute('type');
        const blockInfo = { type: blockType };

        // CRITICAL: ถ้าเป็น variables_get ใน value block ให้เช็ค VAR field ด้วย
        if (blockType === 'variables_get') {
          const varField = b.querySelector('field[name="VAR"]');
          if (varField) {
            const varId = varField.getAttribute('id');
            const varText = varField.textContent;
            const varValueAttr = varField.getAttribute('value');
            let varValue = varId || varText || varValueAttr || '';

            // CRITICAL: ถ้า varValue เป็น ID (อาจเป็นตัวเลขหรือ string ที่เป็น ID) ให้หา variable name จาก variableMap
            if (varValue && variableMap.has(varValue)) {
              const mappedName = variableMap.get(varValue);
              varValue = mappedName;
              console.log(`  - 🔍 Value block VAR field ID ${varId} mapped to name: ${mappedName}`);
            } else if (varValue && /^\d+$/.test(varValue)) {
              // ถ้าเป็นตัวเลขทั้งหมด ให้ลองหาใน variableMap
              const mappedName = variableMap.get(varValue);
              if (mappedName) {
                varValue = mappedName;
                console.log(`  - 🔍 Value block VAR field numeric ID ${varId} mapped to name: ${mappedName}`);
              } else {
                console.log(`  - ⚠️ Value block VAR field numeric ID ${varId} not found in variableMap, keeping as ID`);
              }
            } else if (varValue && !variableMap.has(varValue)) {
              // ถ้าไม่ใช่ ID และไม่พบใน variableMap อาจเป็นชื่อตัวแปรโดยตรง
              console.log(`  - ℹ️ Value block VAR field value "${varValue}" not in variableMap, assuming it's a variable name`);
            }

            const normalized = normalizeVariableName(varValue);
            blockInfo.varName = normalized;
            console.log(`  - ✅ Value block variables_get VAR: ${varValue} -> ${normalized}`);
          }
        }

        return blockInfo;
      });
    }

    analysis.push(blockInfo);
  });

  return analysis;
}

