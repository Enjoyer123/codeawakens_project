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
 * วิเคราะห์ XML structure แบบละเอียด
 */
export function analyzeXmlStructure(xml) {
  if (!xml) return "No XML provided";

  const blocks = xml.querySelectorAll('block');
  const analysis = [];

  blocks.forEach((block, index) => {
    const type = block.getAttribute('type');
    const blockInfo = {
      index,
      type,
      hasStatement: !!block.querySelector('statement'),
      hasValue: !!block.querySelector('value'),
      hasNext: !!block.querySelector(':scope > next')
    };

    // วิเคราะห์ statement blocks
    if (blockInfo.hasStatement) {
      const statementBlocks = block.querySelectorAll('statement block');
      blockInfo.statementBlocks = Array.from(statementBlocks).map(b => b.getAttribute('type'));
    }

    // วิเคราะห์ value blocks
    if (blockInfo.hasValue) {
      const valueBlocks = block.querySelectorAll('value block');
      blockInfo.valueBlocks = Array.from(valueBlocks).map(b => b.getAttribute('type'));
    }

    analysis.push(blockInfo);
  });

  return analysis;
}

