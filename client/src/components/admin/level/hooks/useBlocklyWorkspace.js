import { useSharedBlockly } from '../../../../gameutils/blockly/hooks/useSharedBlockly';

export const useBlocklyWorkspace = ({
    blocklyRef,
    enabledBlocks,
    refReady = true, // Optional trigger to force re-run when ref is ready
    initialData, // Optional: for future use
    readOnly = false // ← เพิ่ม
}) => {
    // Delegate to the universal hook
    return useSharedBlockly({
        blocklyRef,
        enabledBlocks,
        readOnly,
        autoInject: true,
        refReady
    });
};
