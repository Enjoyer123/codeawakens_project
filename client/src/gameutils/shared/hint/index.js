// Hint System - Re-export hub
// Central export point for all hint-related functionality

// Re-export from sub-modules
export {
    getNextBlockHint,
    showRealTimeReward
} from './hintCore';

export {
    getWorkspaceXml,
    analyzeXmlStructure
} from './hintXmlUtils';

export {
    calculateXmlMatchScore,
    checkExactXmlMatch,
    isXmlStructureMatch,
    isXmlStructureEqual
} from './hintXmlComparison';

export {
    findCurrentStep,
    calculatePatternMatchPercentage,
    checkPatternMatch
} from './hintPatternMatching';

export {
    validateTextCode
} from './hintTextCodeValidation';

export {
    findBestThreePartsMatch,
    checkThreePartsMatch
} from './hintThreeParts';
