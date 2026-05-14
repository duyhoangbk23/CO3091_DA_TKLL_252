const { calculateYAxisDomain, replaceNoiseWithPrevious } = require('../../../frontend/public/js/chartUtils');

describe('chart y-axis domain utility', () => {
    test('keeps fixed range around average when values are close', () => {
        expect(calculateYAxisDomain([29, 32], { delta: 5 })).toEqual([25.5, 35.5]);
    });

    test('expands max when actual data exceeds base range around average', () => {
        const [min, max] = calculateYAxisDomain([0, 35, 35], { delta: 5 });
        expect(min).toBe(0);
        expect(max).toBe(35);
    });

    test('ignores invalid values and uses fallback when none are valid', () => {
        expect(calculateYAxisDomain([null, NaN, undefined], { fallback: [0, 100] })).toEqual([0, 100]);
    });
});

describe('chart noise filtering', () => {
    test('replaces abnormal jumps with the previous valid value', () => {
        const noiseEvents = [];
        const rows = replaceNoiseWithPrevious(
            [{ temperature: 30 }, { temperature: 31 }, { temperature: 90 }, { temperature: 32 }],
            { temperature: { maxDelta: 8 } },
            event => noiseEvents.push(event)
        );

        expect(rows.map(row => row.temperature)).toEqual([30, 31, 31, 32]);
        expect(noiseEvents).toHaveLength(1);
        expect(noiseEvents[0].metric).toBe('temperature');
    });
});
