import * as Blockly from 'blockly/core';

export const highlightBlocks = (workspace, blockTypes, highlightOverlaysRef, setHighlightedBlocks) => {
  if (!workspace || !blockTypes || blockTypes.length === 0) return;

  const performHighlight = () => {
    const blocks = workspace.getAllBlocks(false);
    const matchedBlocks = blocks.filter(block => blockTypes.includes(block.type));

    // Clear existing highlights first
    clearHighlights(workspace, highlightOverlaysRef, setHighlightedBlocks);

    matchedBlocks.forEach(block => {
      // Add custom CSS class for highlighting
      const svgRoot = block.getSvgRoot();
      if (svgRoot) {
        Blockly.utils.dom.addClass(svgRoot, 'blockly-highlight-border');
      }
    });

    if (setHighlightedBlocks) {
      setHighlightedBlocks(matchedBlocks.map(b => b.id));
    }

    // Store reference to highlighted blocks for cleanup
    if (highlightOverlaysRef) {
      highlightOverlaysRef.current = matchedBlocks.map(b => b.id);
    }
  };

  performHighlight();
};

export const clearHighlights = (workspace, highlightOverlaysRef, setHighlightedBlocks) => {
  if (!workspace) return;

  // If we have refs to specific blocks, clean them up
  if (highlightOverlaysRef && highlightOverlaysRef.current && Array.isArray(highlightOverlaysRef.current)) {
    highlightOverlaysRef.current.forEach(blockId => {
      const block = workspace.getBlockById(blockId);
      if (block) {
        const svgRoot = block.getSvgRoot();
        if (svgRoot) {
          Blockly.utils.dom.removeClass(svgRoot, 'blockly-highlight-border');
        }
      }
    });
    highlightOverlaysRef.current = [];
  } else {
    // Fallback: iterate all blocks if tracking is missing
    const blocks = workspace.getAllBlocks(false);
    blocks.forEach(block => {
      const svgRoot = block.getSvgRoot();
      if (svgRoot) {
        Blockly.utils.dom.removeClass(svgRoot, 'blockly-highlight-border');
      }
    });
  }

  if (setHighlightedBlocks) {
    setHighlightedBlocks([]);
  }
};
