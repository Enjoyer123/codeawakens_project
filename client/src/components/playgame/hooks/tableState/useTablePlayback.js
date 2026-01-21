import { useState, useRef, useEffect } from 'react';
import { getCurrentGameState, setCurrentGameState } from '../../../../gameutils/shared/game';

/**
 * useTablePlayback
 * Shared logic for table playback, speed control, and state synchronization.
 */
export const useTablePlayback = ({
    stateKey,       // e.g. 'knapsackState'
    data,           // The static data (e.g. knapsackData)
    initTable       // Function to create initial empty table
}) => {
    const [localTable, setLocalTable] = useState(null);
    const [steps, setSteps] = useState([]);
    const [cursor, setCursor] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [speedMs, setSpeedMs] = useState(250);
    const [currentStep, setCurrentStep] = useState(null);
    const resetIdRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(!!data);
    }, [data]);

    useEffect(() => {
        const updateInterval = setInterval(() => {
            const gameState = getCurrentGameState();
            const state = gameState?.[stateKey];
            if (!state) return;

            if (state.resetId !== undefined && state.resetId !== resetIdRef.current) {
                resetIdRef.current = state.resetId;

                // Initialize table
                if (initTable && data) {
                    setLocalTable(initTable(data));
                }

                setSteps(Array.isArray(state.steps) ? state.steps : []);
                setCursor(0);
                setCurrentStep(null);
                setIsPlaying(true);
                return;
            }

            if (Array.isArray(state.steps)) setSteps(state.steps);

            const pb = state?.playback;
            if (pb && (pb.requestedSpeedMs !== undefined || pb.requestedIsPlaying !== undefined)) {
                const nextSpeed = pb.requestedSpeedMs !== undefined ? Number(pb.requestedSpeedMs) : null;
                const nextIsPlaying = pb.requestedIsPlaying !== undefined ? !!pb.requestedIsPlaying : null;

                if (nextSpeed !== null && Number.isFinite(nextSpeed) && nextSpeed > 0) setSpeedMs(nextSpeed);
                if (nextIsPlaying !== null) setIsPlaying(nextIsPlaying);

                try {
                    const newState = { ...state };
                    newState.playback = {
                        ...(pb || {}),
                        requestedSpeedMs: undefined,
                        requestedIsPlaying: undefined,
                    };
                    setCurrentGameState({ [stateKey]: newState });
                } catch (e) { /* ignore */ }
            }
        }, 100);
        return () => clearInterval(updateInterval);
    }, [data, stateKey, initTable]);

    useEffect(() => {
        if (!isVisible) return;
        try {
            const gameState = getCurrentGameState();
            const state = gameState?.[stateKey] || {};
            const newState = { ...state };
            newState.playback = {
                ...(state.playback || {}),
                cursor,
                isPlaying,
                speedMs,
                total: steps.length,
            };
            setCurrentGameState({ [stateKey]: newState });
        } catch (e) { /* ignore */ }
    }, [isVisible, cursor, isPlaying, speedMs, steps.length, stateKey]);

    useEffect(() => {
        if (!isVisible || !isPlaying || !localTable || cursor >= steps.length) return;

        const timer = setTimeout(() => {
            const step = steps[cursor];
            processStep(step);
        }, speedMs);

        return () => clearTimeout(timer);
    }, [isVisible, isPlaying, localTable, cursor, steps, speedMs]);

    const processStep = (step) => {
        if (!step) return;

        setLocalTable((prev) => {
            if (!prev) return prev;
            const next = prev.map(r => r.slice());
            // Only write when step.value is concrete (null is highlight/visit)
            if (step.value !== null && next[step.i] && step.j >= 0 && step.j < next[step.i].length) {
                next[step.i][step.j] = step.value;
            }
            return next;
        });
        setCurrentStep(step);
        setCursor((c) => c + 1);
    };

    const onNextStep = () => {
        if (!localTable || cursor >= steps.length) return;
        const step = steps[cursor];
        processStep(step);
        setIsPlaying(false);
    };

    return {
        isVisible,
        table: localTable,
        playback: {
            isPlaying,
            setIsPlaying,
            speedMs,
            setSpeedMs,
            progress: Math.min(cursor, steps.length),
            totalSteps: steps.length,
            onNextStep
        },
        currentStep
    };
};
