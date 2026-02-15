// Algorithm Visualization Helper Functions
import { getCurrentGameState } from '../../../shared/game';
import { resetCoinChangeVisual } from '../coin_change/visuals';

// ==========================================
// Direct re-exports (no added logic needed)
// ==========================================

// Knapsack visual functions
export {
    selectKnapsackItem as selectKnapsackItemVisual,
    unselectKnapsackItem as unselectKnapsackItemVisual,
    resetKnapsackItems as resetKnapsackItemsVisual,
    knapsackMaxWithVisual,
    resetKnapsackSelectionTracking,
    startKnapsackSelectionTracking,
    showKnapsackFinalSelection
} from '../../algorithms/knapsack/visuals';


// Subset Sum visual functions
export {
    addWarriorToSide1 as addWarriorToSide1Visual,
    addWarriorToSide2 as addWarriorToSide2Visual,
    resetSubsetSumWarriors as resetSubsetSumWarriorsVisual
} from '../../algorithms/subset_sum/visuals';

export {
    startSubsetSumTracking as startSubsetSumTrackingVisual,
    showSubsetSumFinalSolution as showSubsetSumFinalSolutionVisual,
    resetSubsetSumTracking as resetSubsetSumTrackingVisual
} from '../../algorithms/subset_sum/blocklySubsetSumTracking';

// Coin Change visual functions
export {
    addWarriorToSelection as addWarriorToSelectionVisual,
    resetCoinChangeSelectionTracking as resetCoinChangeSelectionTrackingWrapper,
    startCoinChangeSelectionTracking as startCoinChangeSelectionTrackingWrapper,
    trackCoinChangeDecision as trackCoinChangeDecisionWrapper,
    showCoinChangeFinalSolution as showCoinChangeFinalSolutionWrapper
} from '../../algorithms/coin_change/visuals';

// ==========================================
// Functions with added logic (kept as wrappers)
// ==========================================

/**
 * Reset coin change visual display — needs scene lookup
 */
export function resetCoinChangeVisualDisplay() {
    const currentState = getCurrentGameState();
    const scene = currentState.currentScene;
    if (scene) {
        resetCoinChangeVisual(scene);
    }
}

/**
 * Create a highlightEmeiPath function bound to visual dependencies.
 * Extracts path reconstruction + visual logic from emei_highlight_path generator.
 */
export function createHighlightEmeiPath(deps) {
    const { clearDfsVisuals, highlightCableCar, getCurrentGameState } = deps;

    return async function highlightEmeiPath(parent, end, bottleneck) {
        try {
            clearDfsVisuals(getCurrentGameState().currentScene);
        } catch (e) { /* ignore */ }

        // Reconstruct path from parent array
        let curr = end;
        const pathEdges = [];
        while (curr !== undefined && parent[curr] !== undefined) {
            const u = parent[curr];
            if (u === -1) break;
            pathEdges.push({ u, v: curr });
            curr = u;
        }

        // Highlight edges in forward order
        for (let i = pathEdges.length - 1; i >= 0; i--) {
            const edge = pathEdges[i];
            await highlightCableCar(edge.u, edge.v, bottleneck);
        }
    };
}

/**
 * Create a dictSet function bound to MST visual dependencies.
 * For 'parent' dictionaries, triggers showMSTEdges after setting the value.
 */
export function createDictSetWithVisual(deps) {
    const { showMSTEdges, getCurrentGameState } = deps;

    return async function dictSetWithVisual(dict, key, value, dictName) {
        if (dict && (typeof dict === 'object' || typeof dict === 'function')) {
            dict[key] = value;
        }

        // Show MST edges when modifying parent dictionary
        if (dictName.includes('parent') || dictName.includes('Parent')) {
            const state = getCurrentGameState();
            if (state && state.currentScene && typeof showMSTEdges === 'function') {
                showMSTEdges(state.currentScene, dict);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    };
}

/**
 * Pure dictSet — no visuals (for test/clean mode)
 */
export function dictSet(dict, key, value) {
    if (dict && (typeof dict === 'object' || typeof dict === 'function')) {
        dict[key] = value;
    }
}

