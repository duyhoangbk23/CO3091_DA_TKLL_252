(function (root) {
    const DEFAULT_FALLBACK = [0, 10];

    function toFiniteNumbers(values) {
        return (values || [])
            .filter(value => value !== null && value !== undefined && value !== '')
            .map(Number)
            .filter(Number.isFinite);
    }

    function calculateYAxisDomain(values, options = {}) {
        const delta = Number.isFinite(Number(options.delta)) ? Number(options.delta) : 5;
        const fallback = Array.isArray(options.fallback) ? options.fallback : DEFAULT_FALLBACK;
        const valid = toFiniteNumbers(values);
        if (valid.length === 0) return fallback;

        const avg = valid.reduce((sum, value) => sum + value, 0) / valid.length;
        const actualMin = Math.min(...valid);
        const actualMax = Math.max(...valid);
        return [
            Math.min(avg - delta, actualMin),
            Math.max(avg + delta, actualMax)
        ];
    }

    function replaceNoiseWithPrevious(rows, metricConfig, onNoise) {
        const lastValid = {};
        return (rows || []).map((row) => {
            const next = { ...row };
            Object.entries(metricConfig || {}).forEach(([metric, config]) => {
                const value = Number(row[metric]);
                if (!Number.isFinite(value)) return;

                const previous = lastValid[metric];
                if (Number.isFinite(previous) && Math.abs(value - previous) > config.maxDelta) {
                    next[metric] = previous;
                    if (typeof onNoise === 'function') {
                        onNoise({ metric, value, replacement: previous, maxDelta: config.maxDelta, row });
                    }
                    return;
                }

                lastValid[metric] = value;
            });
            return next;
        });
    }

    const api = { calculateYAxisDomain, toFiniteNumbers, replaceNoiseWithPrevious };
    root.ChartUtils = api;
    if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
