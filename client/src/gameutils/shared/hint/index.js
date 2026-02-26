// Hint System - Re-export hub
// Central export point for all hint-related functionality

// Re-export from sub-modules
export {
    getNextBlockHint,
    showRealTimeReward
} from './hintCore';

export {
    getWorkspaceXml,
    analyzeXmlStructure,
    findCurrentStep,
    calculatePatternMatchPercentage
} from './hintMatcher';

export {
    validateTextCode
} from './hintTextCodeValidation';

export {
    findBestThreePartsMatch,
    checkThreePartsMatch
} from './hintThreeParts';
