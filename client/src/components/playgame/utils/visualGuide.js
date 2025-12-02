/**
 * Visual guide utilities for highlighting Blockly blocks
 */

/**
 * Highlight blocks in the Blockly workspace
 * @param {Object} workspace - Blockly workspace
 * @param {Array} blockTypes - Array of block types to highlight
 * @param {Object} highlightOverlaysRef - Ref to store overlay elements
 * @param {Function} setHighlightedBlocks - Function to update highlighted blocks state
 */
export function highlightBlocks(workspace, blockTypes, highlightOverlaysRef, setHighlightedBlocks) {
  if (!workspace || !blockTypes || blockTypes.length === 0) {
    setHighlightedBlocks([]);
    return;
  }

  clearHighlights(workspace, highlightOverlaysRef, setHighlightedBlocks);

  let flyoutWorkspace = null;
  try {
    const flyout = workspace.getFlyout && workspace.getFlyout();
    if (flyout && typeof flyout.getWorkspace === 'function') {
      flyoutWorkspace = flyout.getWorkspace();
    }
  } catch (e) {
    console.warn('⚠️ Could not get flyout workspace:', e);
  }

  const flyoutBlocks = flyoutWorkspace && flyoutWorkspace.getAllBlocks
    ? flyoutWorkspace.getAllBlocks(false)
    : [];

  const applyHighlightToBlock = (block) => {
    const tryApply = (attempt = 1) => {
      try {
        const svgRoot = block.getSvgRoot && block.getSvgRoot();
        if (svgRoot) {
          svgRoot.classList.add('blockly-highlight-border');
          svgRoot.setAttribute('data-blockly-highlight', 'true');

          const shapeEls = svgRoot.querySelectorAll('path, rect, polygon, circle, ellipse');
          if (shapeEls && shapeEls.length > 0) {
            shapeEls.forEach(el => {
              try {
                el.style.stroke = '#00ff00';
                el.style.strokeWidth = '1.6px';
                el.style.strokeLinejoin = 'round';
                el.style.strokeLinecap = 'round';
                el.style.filter = 'drop-shadow(0 0 3px rgba(0,255,0,0.6))';
                el.setAttribute('data-blockly-highlight', 'true');
              } catch { }
            });
          } else {
            svgRoot.style.filter = 'drop-shadow(0 0 3px rgba(0,255,0,0.6))';
          }

          const rect = svgRoot.getBoundingClientRect && svgRoot.getBoundingClientRect();
          if (rect && rect.width > 2 && rect.height > 2) {
            const overlayId = `blockly-highlight-overlay-${block.id}`;
            document.getElementById(overlayId)?.remove();

            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.setAttribute('data-blockly-highlight-overlay', 'true');
            overlay.style.position = 'fixed';
            overlay.style.left = `${rect.left - 2}px`;
            overlay.style.top = `${rect.top - 2}px`;
            overlay.style.width = `${rect.width + 4}px`;
            overlay.style.height = `${rect.height + 4}px`;
            overlay.style.border = '1.5px solid #00ff00';
            overlay.style.borderRadius = '4px';
            overlay.style.boxShadow = '0 0 6px rgba(0,255,0,0.6)';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '2147483647';
            overlay.style.transition = 'opacity 150ms ease-in-out';
            overlay.style.opacity = '0.85';
            document.body.appendChild(overlay);
            highlightOverlaysRef.current[block.id] = overlay;
          }
          return true;
        }
      } catch (err) {
        if (attempt < 3) {
          setTimeout(() => tryApply(attempt + 1), 50);
        }
        return false;
      }
    };

    return tryApply();
  };

  const allBlocks = workspace.getAllBlocks(false);
  const blocksToHighlight = [];

  allBlocks.forEach(block => {
    const blockType = block.type;
    if (blockTypes.includes(blockType)) {
      blocksToHighlight.push(block);
    }
  });

  flyoutBlocks.forEach(block => {
    const blockType = block.type;
    if (blockTypes.includes(blockType)) {
      blocksToHighlight.push(block);
    }
  });

  blocksToHighlight.forEach(block => {
    applyHighlightToBlock(block);
  });

  setHighlightedBlocks(blockTypes);
}

/**
 * Clear all highlights from the Blockly workspace
 * @param {Object} workspace - Blockly workspace
 * @param {Object} highlightOverlaysRef - Ref to store overlay elements
 * @param {Function} setHighlightedBlocks - Function to update highlighted blocks state
 */
export function clearHighlights(workspace, highlightOverlaysRef, setHighlightedBlocks) {
  if (!workspace) return;

  const allBlocks = workspace.getAllBlocks(false);

  allBlocks.forEach(block => {
    try {
      const svgRoot = block.getSvgRoot && block.getSvgRoot();
      if (svgRoot) {
        svgRoot.classList.remove('blockly-highlight-border');
        svgRoot.removeAttribute('data-blockly-highlight');

        const shapeEls = svgRoot.querySelectorAll('[data-blockly-highlight]');
        shapeEls.forEach(el => {
          el.removeAttribute('data-blockly-highlight');
          el.style.stroke = '';
          el.style.strokeWidth = '';
          el.style.filter = '';
        });
      }
    } catch (e) {
      console.warn('Error clearing highlight:', e);
    }
  });

  Object.values(highlightOverlaysRef.current).forEach(overlay => {
    try {
      overlay.remove();
    } catch (e) {
      console.warn('Error removing overlay:', e);
    }
  });
  highlightOverlaysRef.current = {};
  setHighlightedBlocks([]);
}

