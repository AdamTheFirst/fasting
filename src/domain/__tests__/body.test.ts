import { mergeWeights, type WeightEntry } from '../body';

describe('mergeWeights', () => {
  it('does not double-count a manual weight that also arrives from Health', () => {
    const manual: WeightEntry = { id: 'm', at: 1_000_000, kg: 80, source: 'manual' };
    const fromHealth: WeightEntry = { id: 'h', at: 1_010_000, kg: 80.01, source: 'health' };
    const other: WeightEntry = { id: 'h2', at: 9_000_000, kg: 79.5, source: 'health' };
    expect(mergeWeights([manual], [fromHealth, other]).map((w) => w.id)).toEqual(['m', 'h2']);
  });
});
