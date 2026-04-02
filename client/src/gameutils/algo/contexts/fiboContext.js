import { getAlgoPayload } from '../../shared/levelType';

export function injectFiboStubs(context, levelData, trace) {
    const payload = getAlgoPayload(levelData, 'FIBONACCI');
    if (payload) {
        context.n = payload.n || 0;
    }

    context.trackFiboDecision = (action, n = null, value = null) => {
        trace.push({
            type: 'fibo',
            action, // 'call', 'base_case', 'return'
            n,
            value
        });
    };
}
