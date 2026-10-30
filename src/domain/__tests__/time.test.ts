import { DAY, formatDuration, formatElapsed, formatShort, formatSpoken, HOUR, MINUTE } from '../time';

describe('formatElapsed', () => {
  it('shows days as days with no cap', () => {
    expect(formatElapsed(13 * DAY + 22 * HOUR + 5 * MINUTE)).toBe('13d 22h 05m');
    expect(formatElapsed(40 * DAY)).toBe('40d 00h 00m');
  });
  it('shows seconds under a day', () => {
    expect(formatElapsed(16 * HOUR + 5 * MINUTE + 12_000)).toBe('16h 05m 12s');
  });
  it('never goes negative', () => {
    expect(formatElapsed(-5000)).toBe('0h 00m 00s');
  });
});

describe('formatDuration and formatSpoken', () => {
  it('formats rows and screen-reader text', () => {
    expect(formatDuration(72 * HOUR + 10 * MINUTE)).toBe('3d 0h 10m');
    expect(formatDuration(16 * HOUR)).toBe('16h 00m');
    expect(formatSpoken(3 * DAY + 4 * HOUR + 1 * MINUTE)).toBe('3 days 4 hours 1 minute');
  });
});

describe('formatShort', () => {
  it('shows minutes under an hour, then hours, then days and hours', () => {
    expect(formatShort(13 * MINUTE)).toBe('13m');
    expect(formatShort(16 * HOUR + 5 * MINUTE)).toBe('16h');
    expect(formatShort(3 * DAY + 4 * HOUR)).toBe('3d 4h');
  });
});
