/**
 * executionRunner.js
 * 
 * Handles the raw execution of user code within a constructed context.
 * This separates the "how to run" mechanics from the "what to run" logic.
 */

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;

/**
 * Executes the prepared user code within a specific context.
 * 
 * @param {string} code - The final, instrumented code string to execute.
 * @param {Object} context - An object mapping variable names to their values. 
 *                           Keys become the parameter names of the AsyncFunction.
 *                           Values become the arguments passed to the call.
 * @param {Promise} timeoutPromise - A promise that rejects if execution takes too long.
 * @returns {Promise<any>} - The result of the user code execution.
 */
export const executeUserCode = async (code, context, timeoutPromise) => {
    // 1. Extract keys and values from context
    const argNames = Object.keys(context);
    const argValues = argNames.map(name => context[name]);

    // 2. Create the AsyncFunction
    // The arguments are: ...argNames, codeBody
    const executionFn = new AsyncFunction(
        ...argNames,
        '"use strict";\n' + code // Enforce strict mode for cleaner execution
    );

    // 3. Race against the timeout
    try {
        const result = await Promise.race([
            executionFn(...argValues),
            timeoutPromise
        ]);
        return result;
    } catch (error) {
        // If the error is not a timeout (which is handled by useCodeExecution catching the race rejection),
        // we re-throw it so it can be handled upstream.
        throw error;
    }
};
