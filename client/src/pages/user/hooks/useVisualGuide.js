// Custom hook for visual guide system (highlightBlocks, clearHighlights)
import { useState, useRef } from 'react';

/**
 * Custom hook for visual guide system
 * @param {Object} workspaceRef - Ref to Blockly workspace
 * @returns {Object} Visual guide functions and state
 */
export const useVisualGuide = (workspaceRef) => {
  const [highlightedBlocks, setHighlightedBlocks] = useState([]);
  const highlightOverlaysRef = useRef({});

  const highlightBlocks = (blockTypes) => {
    if (!workspaceRef.current || !blockTypes || blockTypes.length === 0) {
      setHighlightedBlocks([]);
      return;
    }

    clearHighlights();

    const workspace = workspaceRef.current;

    let flyoutWorkspace = null;
    try {
      const flyout = workspace.getFlyout && workspace.getFlyout();
      if (flyout && typeof flyout.getWorkspace === 'function') {
        flyoutWorkspace = flyout.getWorkspace();
      }
    } catch (e) {
      console.warn('⚠️ Could not get flyout workspace:', e);
    }

    // ✅ ดึง block จากเมนู flyout (menu ให้เลือก block)
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

            // ✅ ปรับความบางของเส้น highlight
            const shapeEls = svgRoot.querySelectorAll('path, rect, polygon, circle, ellipse');
            if (shapeEls && shapeEls.length > 0) {
              shapeEls.forEach(el => {
                try {
                  el.style.stroke = '#00ff00';
                  el.style.strokeWidth = '1.6px'; // ✅ เส้นบางลง
                  el.style.strokeLinejoin = 'round';
                  el.style.strokeLinecap = 'round';
                  el.style.filter = 'drop-shadow(0 0 3px rgba(0,255,0,0.6))';
                  el.setAttribute('data-blockly-highlight', 'true');
                } catch { }
              });
            } else {
              svgRoot.style.filter = 'drop-shadow(0 0 3px rgba(0,255,0,0.6))';
            }

            // ✅ วาด overlay แบบบางสุด
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

          // fallback
          if (block.svgPath_) {
            block.svgPath_.classList.add('blockly-highlight-border');
            block.svgPath_.style.stroke = '#00ff00';
            block.svgPath_.style.strokeWidth = '1.6px';
            block.svgPath_.style.filter = 'drop-shadow(0 0 3px rgba(0,255,0,0.6))';
            block.svgPath_.setAttribute('data-blockly-highlight', 'true');
            return true;
          }

          if (attempt < 4) {
            setTimeout(() => tryApply(attempt + 1), 120);
            return false;
          }

          console.warn('⚠️ Could not apply highlight to block after retries:', { type: block.type, id: block.id });
          return false;
        } catch (err) {
          console.warn('Error applying highlight to block:', err, { type: block.type, id: block.id });
          return false;
        }
      };

      tryApply(1);
    };

    // ✅ Highlight เฉพาะ block ใน flyout เท่านั้น
    flyoutBlocks.forEach(block => {
      if (blockTypes.includes(block.type)) applyHighlightToBlock(block);
    });

    setHighlightedBlocks(blockTypes);
  };

  const clearHighlights = () => {
    if (!workspaceRef.current) {
      return;
    }

    const workspace = workspaceRef.current;

    // Clear highlights from main workspace blocks
    try {
      const allBlocks = workspace.getAllBlocks ? workspace.getAllBlocks(false) : [];
      allBlocks.forEach(block => {
        try {
          const svgGroup = block.getSvgRoot && block.getSvgRoot();
          if (svgGroup) {
            svgGroup.classList.remove('blockly-highlight-border');
            svgGroup.removeAttribute('data-blockly-highlight');
          }
          if (block.svgPath_) {
            try { block.svgPath_.classList.remove('blockly-highlight-border'); } catch (e) { }
          }
        } catch (err) {
          // ignore per-block errors
        }
      });
    } catch (err) {
      console.warn('Error clearing highlights from main workspace:', err);
    }

    // Clear highlights from flyout/toolbox
    try {
      const flyout = workspace.getFlyout && workspace.getFlyout();
      const flyoutWorkspace = flyout && flyout.getWorkspace ? flyout.getWorkspace() : null;
      const flyoutBlocks = flyoutWorkspace && flyoutWorkspace.getAllBlocks ? flyoutWorkspace.getAllBlocks(false) : [];
      flyoutBlocks.forEach(block => {
        try {
          const svgGroup = block.getSvgRoot && block.getSvgRoot();
          if (svgGroup) {
            svgGroup.classList.remove('blockly-highlight-border');
            svgGroup.removeAttribute('data-blockly-highlight');
          }
          if (block.svgPath_) {
            try { block.svgPath_.classList.remove('blockly-highlight-border'); } catch (e) { }
          }
        } catch (err) { }
      });
    } catch (err) {
      // ignore
    }

    // DOM fallback clear
    const domHighlighted = document.querySelectorAll('[data-blockly-highlight="true"], .blockly-highlight-border');
    domHighlighted.forEach(el => {
      try { el.classList.remove('blockly-highlight-border'); } catch (e) { }
      try { el.removeAttribute('data-blockly-highlight'); } catch (e) { }
    });

    // Remove overlay fallbacks
    try {
      const overlays = document.querySelectorAll('[data-blockly-highlight-overlay="true"]');
      overlays.forEach(o => {
        try { o.remove(); } catch (e) { }
      });
      highlightOverlaysRef.current = {};
    } catch (e) {
      // ignore
    }

    setHighlightedBlocks([]);
  };

  return {
    highlightedBlocks,
    highlightBlocks,
    clearHighlights
  };
};

