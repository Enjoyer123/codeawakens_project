import { useState, useEffect } from 'react';

export const useHintSystem = (levelData) => {
    const [showHint, setShowHint] = useState(false);
    const [hints, setHints] = useState([]);

    useEffect(() => {
        if (levelData?.hints && levelData.hints.length > 0) {
            // Filter out explicitly deactivated hints
            const activeHints = levelData.hints.filter(hint => hint.is_active !== false);
            setHints(activeHints);
        } else {
            setHints([]);
        }
        // Prevent hint from auto-showing on level load
        setShowHint(false);
    }, [levelData]);

    const closeHint = () => {
        setShowHint(false);
    };

    const openHint = () => {
        if (hints.length > 0) {
            setShowHint(true);
        }
    };

    return {
        showHint,
        hints,
        closeHint,
        openHint,
        hasHints: hints.length > 0
    };
};
