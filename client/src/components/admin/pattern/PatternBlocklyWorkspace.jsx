import React, { forwardRef } from 'react';
import ContentLoader from '@/components/shared/Loading/ContentLoader';

const PatternBlocklyWorkspace = forwardRef(({ currentStepIndex, blocklyLoaded, title }, ref) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      {title && (
        <h2 className="text-xl font-bold mb-4">
          {title}
        </h2>
      )}

      {!blocklyLoaded && (
        <ContentLoader message="Loading Blockly..." height="h-96" />
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