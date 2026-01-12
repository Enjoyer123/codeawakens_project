import React from 'react';

const BlocklyWorkspaceTab = ({ blocklyRef, activeTab }) => {
    return (
        <div
            className="absolute inset-0 blockly-workspace"
            style={{
                visibility: activeTab === 'blocks' ? 'visible' : 'hidden',
                zIndex: activeTab === 'blocks' ? 1 : -1
            }}
        >
            <div
                ref={blocklyRef}
                className="w-full h-full"
                style={{
                    border: "none"
                }}
            />
        </div>
    );
};

export default BlocklyWorkspaceTab;
