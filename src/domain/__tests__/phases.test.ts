import { phaseAt, phaseFill, roadPosition } from '../phases';

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

describe('roadPosition', () => {
  it('gives each phase an equal share', () => {
    expect(roadPosition(0)).toBe(0);
    expect(roadPosition(6)).toBeCloseTo(0.1);
    expect(roadPosition(12)).toBeCloseTo(0.2);
    expect(roadPosition(36)).toBeCloseTo(0.5);
    expect(roadPosition(72)).toBeCloseTo(0.8);
    expect(roadPosition(24 * 30)).toBe(1);
  });

  it('fills phases in order', () => {
    expect(phaseFill(0, 30)).toBe(1);
    expect(phaseFill(2, 36)).toBeCloseTo(0.5);
    expect(phaseFill(3, 36)).toBe(0);
  });
});
