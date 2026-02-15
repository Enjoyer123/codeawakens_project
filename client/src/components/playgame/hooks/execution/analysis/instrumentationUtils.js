/**
 * instrumentationUtils.js
 * 
 * Shared utility for wrapping Blockly-generated functions with visual hooks.
 * Used by SubsetSum, CoinChange, and similar algorithm instrumentations.
 * 
 * Pattern: Rename original function -> inject wrapper that calls impl + visual hook.
 */

/**
 * Wraps a Blockly-generated function with a visual instrumentation wrapper.
 *
 * @param {string} code - The generated code
 * @param {Object} options - Configuration options
 * @returns {string} Instrumented code, or original code if no match
 */
export function wrapFunctionWithHook(code, {
    fnNamePattern,
    minParams,
    createWrapper,
    localVarDeclarations = ''
}) {
    // Build regex to match the function definition
    const fnNameStr = fnNamePattern.source;
    const fnMatch = code.match(
        new RegExp(`(async\\s+)?function\\s+(${fnNameStr})\\s*\\(([^)]*)\\)\\s*\\{`)
    );

    if (!fnMatch) return code;

    const originalName = fnMatch[2];
    const paramsStr = fnMatch[3] || '';
    const implName = `__${originalName}_impl`;

    // Skip if already instrumented
    if (code.includes(implName)) return code;

    const params = paramsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (params.length < minParams) return code;

    // Rename original function to impl name
    const renameRe = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(([^)]*)\\)\\s*\\{`);
    if (renameRe.test(code)) {
        code = code.replace(renameRe, (m, asyncKw, args) => {
            const varsLine = localVarDeclarations ? `\n  ${localVarDeclarations}\n` : '';
            return `${asyncKw || ''}function ${implName}(${args}) {${varsLine}`;
        });
    } else {
        const simpleRename = new RegExp(`(async\\s+)?function\\s+${originalName}\\s*\\(`);
        code = code.replace(simpleRename, `$1function ${implName}(`);
    }

    // Create the wrapper code
    const wrapper = createWrapper(implName, originalName, paramsStr, params);

    // Place wrapper right before the impl function definition
    const implHeaderRe = new RegExp(`(async\\s+)?function\\s+${implName}\\s*\\(`);
    code = code.replace(implHeaderRe, (m) => `${wrapper}\n${m}`);

    return code;
}
