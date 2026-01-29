import { useEffect } from 'react';

/**
 * Hook to suppress specific Blockly deprecation warnings in the console.
 * This filters out warnings related to variable handling that are expected in our version.
 */
export const useSuppressBlocklyWarnings = () => {
    useEffect(() => {
        const originalConsoleWarn = console.warn;
        console.warn = function (...args) {
            const message = args.join(' ');
            if (message.includes('createVariable was deprecated') ||
                message.includes('Use Blockly.Workspace.getVariableMap().createVariable instead') ||
                message.includes('getAllVariables was deprecated') ||
                message.includes('Use Blockly.Workspace.getVariableMap().getAllVariables instead') ||
                message.includes('Blockly.Workspace.getAllVariables was deprecated') ||
                message.includes('getVariable was deprecated') ||
                message.includes('Use Blockly.Workspace.getVariableMap().getVariable instead') ||
                message.includes('Blockly.Workspace.getVariable was deprecated') ||
                message.includes('getVariableById was deprecated') ||
                message.includes('Use Blockly.Workspace.getVariableMap().getVariableById instead') ||
                message.includes('Blockly.Workspace.getVariableById was deprecated')) {
                return;
            }
            originalConsoleWarn.apply(console, args);
        };

        return () => {
            console.warn = originalConsoleWarn;
        };
    }, []);
};
