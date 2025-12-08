import React, { forwardRef } from 'react';

const PatternBlocklyWorkspace = forwardRef(({ currentStepIndex, blocklyLoaded }, ref) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        Blockly Workspace - Step {currentStepIndex + 1}
      </h2>

      {!blocklyLoaded && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg mb-2">⏳ กำลังโหลด Blockly...</div>
          </div>
        </div>
      )}

      <div
        ref={ref}
        id="blockly-workspace"
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
});

export default PatternBlocklyWorkspace;
