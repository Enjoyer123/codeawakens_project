// Hint System - Re-export hub
// This file now acts as a re-export hub for all hint-related functionality

// Re-export from sub-modules
export {
  getNextBlockHint,
  showRealTimeReward
} from './hint/hintCore';

export {
  getWorkspaceXml,
  analyzeXmlStructure
} from './hint/hintXmlUtils';

export {
  calculateXmlMatchScore,
  checkExactXmlMatch,
  isXmlStructureMatch,
  isXmlStructureEqual
} from './hint/hintXmlComparison';

export {
  findCurrentStep,
  calculatePatternMatchPercentage,
  checkPatternMatch
} from './hint/hintPatternMatching';

export {
  validateTextCode
} from './hint/hintTextCodeValidation';
