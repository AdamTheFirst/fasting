import { phaseAt } from '../phases';

describe('phaseAt', () => {
  it('follows the milestone edges', () => {
    expect(phaseAt(0).key).toBe('settling');
    expect(phaseAt(11.9).key).toBe('settling');
    expect(phaseAt(12).key).toBe('insulin');
    expect(phaseAt(30).key).toBe('glycogen');
    expect(phaseAt(50).key).toBe('ketones');
    expect(phaseAt(24 * 14).key).toBe('deep');
  });
});
