// XML Comparison Functions for Hint System
import { analyzeXmlStructure } from './hintXmlUtils';

/**
 * คำนวณคะแนนความตรงกันของ XML pattern
 */
export function calculateXmlMatchScore(currentXml, targetXmlString) {
  console.log("🔍 calculateXmlMatchScore called with:", {
    currentXml: !!currentXml,
    targetXmlString: targetXmlString?.substring(0, 100) + "..."
  });

  if (!currentXml || !targetXmlString) {
    console.log("❌ Missing XML data, returning 0");
    return 0;
  }

  try {
    const parser = new DOMParser();
    const targetXml = parser.parseFromString(targetXmlString, 'text/xml');
    console.log("🔍 Target XML parsed successfully");

    // เปรียบเทียบ structure
    const score = compareXmlStructure(currentXml, targetXml);
    console.log("🔍 XML comparison score:", score);
    return score;
  } catch (error) {
    console.error("Error parsing XML:", error);
    return 0;
  }
}

/**
 * เปรียบเทียบ XML structure แบบ recursive
 */
function compareXmlStructure(currentNode, targetNode, depth = 0) {
  console.log(`${'  '.repeat(depth)}🔍 compareXmlStructure depth ${depth}`);

  let score = 0;
  const maxDepth = 10; // ป้องกัน infinite loop

  if (depth > maxDepth) {
    console.log(`${'  '.repeat(depth)}❌ Max depth reached, returning 0`);
    return score;
  }

  // เช็ค block type ตรงกันหรือไม่
  const currentBlocks = currentNode.querySelectorAll(':scope > block');
  const targetBlocks = targetNode.querySelectorAll(':scope > block');

  console.log(`${'  '.repeat(depth)}🔍 Found ${currentBlocks.length} current blocks, ${targetBlocks.length} target blocks`);

  const minLength = Math.min(currentBlocks.length, targetBlocks.length);

  for (let i = 0; i < minLength; i++) {
    const currentType = currentBlocks[i].getAttribute('type');
    const targetType = targetBlocks[i].getAttribute('type');

    console.log(`${'  '.repeat(depth)}🔍 Block ${i}: ${currentType} vs ${targetType}`);

    if (currentType === targetType) {
      score += 10; // คะแนนสำหรับ block ที่ตรง
      console.log(`${'  '.repeat(depth)}✅ Block types match! Score: ${score}`);

      // เช็ค nested blocks ข้างใน (เช่น if, repeat, while)
      const currentStatement = currentBlocks[i].querySelector('statement');
      const targetStatement = targetBlocks[i].querySelector('statement');

      if (currentStatement && targetStatement) {
        console.log(`${'  '.repeat(depth)}🔍 Checking statement blocks...`);
        score += compareXmlStructure(currentStatement, targetStatement, depth + 1);
      }

      // เช็ค next blocks
      const currentNext = currentBlocks[i].querySelector(':scope > next');
      const targetNext = targetBlocks[i].querySelector(':scope > next');

      if (currentNext && targetNext) {
        console.log(`${'  '.repeat(depth)}🔍 Checking next blocks...`);
        score += compareXmlStructure(currentNext, targetNext, depth + 1);
      }
    } else {
      console.log(`${'  '.repeat(depth)}❌ Block types don't match, stopping comparison`);
      break; // ถ้า block ไม่ตรงกัน หยุดเช็ค
    }
  }

  console.log(`${'  '.repeat(depth)}🔍 Final score at depth ${depth}: ${score}`);
  return score;
}

/**
 * เช็คว่า XML ตรงกันแบบ exact หรือไม่
 * @param {Document|Element} currentXml - Current XML DOM
 * @param {string} targetXmlString - Target XML string
 * @param {Blockly.Workspace} workspace - Optional workspace to resolve variable IDs
 * @returns {boolean} True if XML matches
 */
export function checkExactXmlMatch(currentXml, targetXmlString, workspace = null) {
  if (!currentXml || !targetXmlString) return false;

  try {
    const parser = new DOMParser();
    const targetXml = parser.parseFromString(targetXmlString, 'text/xml');

    // ใช้ flexible matching เพื่อรองรับ starter XML
    // CRITICAL: ส่ง workspace parameter เพื่อให้สามารถ resolve variable IDs เป็นชื่อตัวแปรได้
    return isXmlStructureMatch(currentXml, targetXml, 0, workspace);
  } catch (error) {
    console.error("Error checking exact match:", error);
    return false;
  }
}

/**
 * เปรียบเทียบ XML structure แบบยืดหยุ่น (flexible matching)
 * รองรับ starter XML โดยค้นหา block ที่ตรงกับ target แทนที่จะเปรียบเทียบจาก block แรก
 * @param {Document|Element} currentXml - Current XML DOM
 * @param {Document|Element} targetXml - Target XML DOM
 * @param {number} depth - Current depth for recursion
 * @param {Blockly.Workspace} workspace - Optional workspace to resolve variable IDs
 * @returns {boolean} True if structure matches
 */
export function isXmlStructureMatch(currentXml, targetXml, depth = 0, workspace = null) {
  if (!currentXml || !targetXml) {
    console.log(`${'  '.repeat(depth)}❌ One of the nodes is null`);
    return false;
  }

  const indent = '  '.repeat(depth);

  // ดึง blocks ของแต่ละ XML
  const currentBlocks = Array.from(currentXml.querySelectorAll(':scope > block'));
  const targetBlocks = Array.from(targetXml.querySelectorAll(':scope > block'));

  if (currentBlocks.length === 0 || targetBlocks.length === 0) {
    console.log(`${indent}❌ One of the XMLs has no blocks`);
    return false;
  }

  // CRITICAL: สร้าง variable ID to name mapping จาก XML variables section
  const getVariableMap = (xml) => {
    const variableMap = new Map();
    const variablesSection = xml.querySelector('variables');
    if (variablesSection) {
      const variables = variablesSection.querySelectorAll('variable');
      variables.forEach(variable => {
        const varId = variable.getAttribute('id');
        const varName = variable.textContent || variable.getAttribute('name') || '';
        if (varId && varName) {
          variableMap.set(varId, varName);
        }
      });
    }
    // ถ้าไม่มี variables section ใน XML แต่มี workspace ให้ resolve จาก workspace
    if (!variablesSection && workspace && workspace.getVariableMap) {
      try {
        const variableMap_workspace = workspace.getVariableMap();
        const allVariables = variableMap_workspace.getAllVariables();
        allVariables.forEach(variable => {
          const varId = variable.getId();
          const varName = variable.name;
          if (varId && varName) {
            variableMap.set(varId, varName);
          }
        });
      } catch (e) {
        console.log(`  - ⚠️ Error getting variables from workspace: ${e.message}`);
      }
    }
    return variableMap;
  };

  const currentVariableMap = getVariableMap(currentXml);
  const targetVariableMap = getVariableMap(targetXml);

  // Helper function to resolve variable name from field
  const resolveVariableName = (block, variableMap) => {
    const varField = block.querySelector('field[name="VAR"]');
    if (!varField) return null;
    
    const varId = varField.getAttribute('id');
    const varText = varField.textContent;
    const varValueAttr = varField.getAttribute('value');
    let varValue = varId || varText || varValueAttr || '';
    
    if (varValue && variableMap.has(varValue)) {
      return variableMap.get(varValue);
    }
    
    // Try to resolve from workspace if available
    if (workspace && workspace.getVariableMap && varValue) {
      try {
        const variableMap_workspace = workspace.getVariableMap();
        const variable = variableMap_workspace.getVariableById(varValue);
        if (variable) {
          return variable.name;
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return varValue;
  };

  // Helper function to get procedure name
  const getProcedureName = (block) => {
    const nameField = block.querySelector('field[name="NAME"]');
    if (nameField) {
      return nameField.textContent || nameField.getAttribute('value') || '';
    }
    return null;
  };

  // หา block แรกของ target
  const targetFirstBlock = targetBlocks[0];
  const targetType = targetFirstBlock.getAttribute('type');
  
  console.log(`${indent}🔍 Looking for target block type: ${targetType} in ${currentBlocks.length} current blocks`);

  // หา block ใน current XML ที่ตรงกับ target block แรก
  // ถ้า depth = 0 (root level) ให้ค้นหาทั้งหมด แต่ถ้า depth > 0 ให้ใช้ block แรก
  let currentFirstBlock = null;
  
  if (depth === 0) {
    // ที่ root level ให้ค้นหา block ที่ตรงกับ target แรก (รองรับ starter XML)
    currentFirstBlock = currentBlocks.find(block => {
      const blockType = block.getAttribute('type');
      return blockType === targetType;
    });
    
    if (!currentFirstBlock) {
      console.log(`${indent}❌ Could not find matching block type ${targetType} in current XML`);
      // Log all current block types for debugging
      const currentTypes = currentBlocks.map(b => b.getAttribute('type'));
      console.log(`${indent}🔍 Current block types:`, currentTypes);
      return false;
    }
    
    console.log(`${indent}✅ Found matching block type ${targetType} in current XML`);
  } else {
    // ที่ nested level ให้ใช้ block แรก (เพราะ structure ควรจะตรงกันแล้ว)
    currentFirstBlock = currentBlocks[0];
    const currentType = currentFirstBlock.getAttribute('type');
    
    if (currentType !== targetType) {
      console.log(`${indent}❌ Block types don't match at depth ${depth}: ${currentType} vs ${targetType}`);
      return false;
    }
  }

  const currentType = currentFirstBlock.getAttribute('type');
  console.log(`${indent}🔍 Comparing blocks: ${currentType} vs ${targetType}`);

  // CRITICAL: เช็ค variable names สำหรับ variables_set และ variables_get
  if (currentType === 'variables_set' || currentType === 'variables_get') {
    const currentVarName = resolveVariableName(currentFirstBlock, currentVariableMap);
    const targetVarName = resolveVariableName(targetFirstBlock, targetVariableMap);
    
    if (targetVarName && currentVarName !== targetVarName) {
      console.log(`${indent}❌ Variable names don't match: current="${currentVarName}", target="${targetVarName}"`);
      return false;
    }
    if (targetVarName) {
      console.log(`${indent}✅ Variable names match: "${currentVarName}"`);
    }
  }

  // CRITICAL: เช็ค procedure names สำหรับ procedure blocks
  if (currentType === 'procedures_defreturn' || currentType === 'procedures_defnoreturn' ||
      currentType === 'procedures_callreturn' || currentType === 'procedures_callnoreturn') {
    const currentProcName = getProcedureName(currentFirstBlock);
    const targetProcName = getProcedureName(targetFirstBlock);
    
    if (targetProcName && currentProcName !== targetProcName) {
      console.log(`${indent}❌ Procedure names don't match: current="${currentProcName}", target="${targetProcName}"`);
      return false;
    }
    if (targetProcName) {
      console.log(`${indent}✅ Procedure names match: "${currentProcName}"`);
    }
  }

  // เช็ค next blocks แบบ recursive
  const currentNext = currentFirstBlock.querySelector(':scope > next');
  const targetNext = targetFirstBlock.querySelector(':scope > next');

  if (targetNext && !currentNext) {
    console.log(`${indent}❌ Target has next block but current doesn't`);
    return false;
  }

  if (targetNext && currentNext) {
    console.log(`${indent}🔍 Checking next blocks recursively...`);
    // เปรียบเทียบ next blocks แบบ recursive (depth + 1 เพื่อให้ใช้ block แรก)
    if (!isXmlStructureMatch(currentNext, targetNext, depth + 1, workspace)) {
      return false;
    }
  }

  // เช็ค statement blocks
  const currentStatement = currentFirstBlock.querySelector('statement');
  const targetStatement = targetFirstBlock.querySelector('statement');

  if (targetStatement && !currentStatement) {
    console.log(`${indent}❌ Target has statement but current doesn't`);
    return false;
  }

  if (targetStatement && currentStatement) {
    console.log(`${indent}🔍 Checking statement blocks...`);
    if (!isXmlStructureMatch(currentStatement, targetStatement, depth + 1, workspace)) {
      return false;
    }
  }

  // เช็ค value blocks
  const currentValues = currentFirstBlock.querySelectorAll('value');
  const targetValues = targetFirstBlock.querySelectorAll('value');

  if (targetValues.length > 0) {
    console.log(`${indent}🔍 Checking ${targetValues.length} value blocks...`);

    for (let i = 0; i < targetValues.length; i++) {
      const targetValue = targetValues[i];
      const currentValue = currentValues[i];

      if (!currentValue) {
        console.log(`${indent}❌ Missing value block ${i}`);
        return false;
      }

      const targetValueBlock = targetValue.querySelector('block');
      const currentValueBlock = currentValue.querySelector('block');

      if (targetValueBlock && !currentValueBlock) {
        console.log(`${indent}❌ Missing block in value ${i}`);
        return false;
      }

      if (targetValueBlock && currentValueBlock) {
        const targetValueType = targetValueBlock.getAttribute('type');
        const currentValueType = currentValueBlock.getAttribute('type');

        if (targetValueType !== currentValueType) {
          console.log(`${indent}❌ Value block ${i} types don't match: ${currentValueType} vs ${targetValueType}`);
          return false;
        }

        // CRITICAL: เช็ค variable names ใน value blocks (เช่น variables_get ใน value)
        if (currentValueType === 'variables_get') {
          const currentVarName = resolveVariableName(currentValueBlock, currentVariableMap);
          const targetVarName = resolveVariableName(targetValueBlock, targetVariableMap);
          
          if (targetVarName && currentVarName !== targetVarName) {
            console.log(`${indent}❌ Value block ${i} variable names don't match: current="${currentVarName}", target="${targetVarName}"`);
            return false;
          }
          if (targetVarName) {
            console.log(`${indent}✅ Value block ${i} variable names match: "${currentVarName}"`);
          }
        }

        // CRITICAL: เช็ค nested value blocks แบบ recursive
        if (!isXmlStructureMatch(currentValueBlock, targetValueBlock, depth + 1, workspace)) {
          return false;
        }
      }
    }
  }

  console.log(`${indent}✅ Structure matches at depth ${depth}`);
  return true;
}

/**
 * เปรียบเทียบ XML structure แบบ exact พร้อม debug logging
 */
export function isXmlStructureEqual(node1, node2, depth = 0) {
  if (!node1 || !node2) {
    console.log(`${'  '.repeat(depth)}❌ One of the nodes is null`);
    return false;
  }

  const indent = '  '.repeat(depth);

  // เช็ค blocks ทั้งหมด
  const blocks1 = node1.querySelectorAll(':scope > block');
  const blocks2 = node2.querySelectorAll(':scope > block');

  console.log(`${indent}🔍 Comparing ${blocks1.length} vs ${blocks2.length} blocks`);

  if (blocks1.length !== blocks2.length) {
    console.log(`${indent}❌ Different number of blocks: ${blocks1.length} vs ${blocks2.length}`);
    return false;
  }

  for (let i = 0; i < blocks1.length; i++) {
    const type1 = blocks1[i].getAttribute('type');
    const type2 = blocks2[i].getAttribute('type');

    console.log(`${indent}🔍 Block ${i}: ${type1} vs ${type2}`);

    if (type1 !== type2) {
      console.log(`${indent}❌ Block types don't match: ${type1} vs ${type2}`);
      return false;
    }

    // เช็ค statement blocks (blocks ข้างใน if, repeat, etc.)
    const statement1 = blocks1[i].querySelector('statement');
    const statement2 = blocks2[i].querySelector('statement');

    console.log(`${indent}🔍 Statement blocks: ${statement1 ? 'present' : 'missing'} vs ${statement2 ? 'present' : 'missing'}`);

    if ((statement1 && !statement2) || (!statement1 && statement2)) {
      console.log(`${indent}❌ Statement blocks mismatch`);
      return false;
    }

    if (statement1 && statement2) {
      console.log(`${indent}🔍 Checking statement content...`);
      if (!isXmlStructureEqual(statement1, statement2, depth + 1)) {
        console.log(`${indent}❌ Statement content doesn't match`);
        return false;
      }
    }

    // เช็ค value blocks (condition ใน if, จำนวนรอบใน repeat)
    const values1 = blocks1[i].querySelectorAll('value');
    const values2 = blocks2[i].querySelectorAll('value');

    console.log(`${indent}🔍 Value blocks: ${values1.length} vs ${values2.length}`);

    if (values1.length !== values2.length) {
      console.log(`${indent}❌ Different number of value blocks: ${values1.length} vs ${values2.length}`);
      return false;
    }

    for (let j = 0; j < values1.length; j++) {
      const valueBlock1 = values1[j].querySelector('block');
      const valueBlock2 = values2[j].querySelector('block');

      console.log(`${indent}🔍 Value ${j}: ${valueBlock1?.getAttribute('type') || 'missing'} vs ${valueBlock2?.getAttribute('type') || 'missing'}`);

      if ((valueBlock1 && !valueBlock2) || (!valueBlock1 && valueBlock2)) {
        console.log(`${indent}❌ Value block ${j} presence mismatch`);
        return false;
      }

      if (valueBlock1 && valueBlock2) {
        const valueType1 = valueBlock1.getAttribute('type');
        const valueType2 = valueBlock2.getAttribute('type');

        if (valueType1 !== valueType2) {
          console.log(`${indent}❌ Value block ${j} types don't match: ${valueType1} vs ${valueType2}`);
          return false;
        }
      }
    }

    // เช็ค next blocks
    const next1 = blocks1[i].querySelector(':scope > next');
    const next2 = blocks2[i].querySelector(':scope > next');

    console.log(`${indent}🔍 Next blocks: ${next1 ? 'present' : 'missing'} vs ${next2 ? 'present' : 'missing'}`);

    if ((next1 && !next2) || (!next1 && next2)) {
      console.log(`${indent}❌ Next blocks mismatch`);
      return false;
    }

    if (next1 && next2) {
      console.log(`${indent}🔍 Checking next content...`);
      if (!isXmlStructureEqual(next1, next2, depth + 1)) {
        console.log(`${indent}❌ Next content doesn't match`);
        return false;
      }
    }
  }

  console.log(`${indent}✅ All blocks match at depth ${depth}`);
  return true;
}

