import type { Fast } from '../fast';
import { customMilestone, DEFAULT_MILESTONE_SETTINGS, planAlerts } from '../milestones';
import { HOUR } from '../time';

const NOW = Date.UTC(2026, 9, 30, 12);
const running: Fast = { id: 'f', start: NOW - 10 * HOUR, end: null, goal: null, presetId: null, note: null };

describe('planAlerts', () => {
  it('schedules nothing on a fresh install', () => {
    expect(planAlerts(running, DEFAULT_MILESTONE_SETTINGS, 50 * HOUR, NOW)).toEqual([]);
  });

  it('schedules chosen milestones from the start time, skipping ones already passed', () => {
    const alerts = planAlerts(running, { ...DEFAULT_MILESTONE_SETTINGS, enabledIds: ['h12', 'h24'] }, 0, NOW);
    expect(alerts.map((a) => a.fireAt)).toEqual([running.start + 12 * HOUR, running.start + 24 * HOUR]);
    const later = planAlerts(
      running,
      { ...DEFAULT_MILESTONE_SETTINGS, enabledIds: ['h12'] },
      0,
      NOW + 3 * HOUR,
    );
    expect(later).toEqual([]);
  });

  it('moves every alert when the start is edited', () => {
    const settings = { ...DEFAULT_MILESTONE_SETTINGS, enabledIds: ['h24'] };
    const moved = planAlerts({ ...running, start: running.start - 2 * HOUR }, settings, 0, NOW);
    expect(moved[0]?.fireAt).toBe(running.start + 22 * HOUR);
  });

  it('cites a source in every built-in message', () => {
    const all = planAlerts(
      { ...running, start: NOW },
      { ...DEFAULT_MILESTONE_SETTINGS, enabledIds: ['h12', 'h24', 'h48', 'h72'] },
      0,
      NOW,
    );
    expect(all).toHaveLength(4);
    for (const a of all) expect(a.body).toMatch(/Source: /);
  });

  it('adds goal, personal best and custom milestones when turned on', () => {
    const alerts = planAlerts(
      { ...running, goal: { kind: 'duration', ms: 36 * HOUR } },
      {
        enabledIds: [],
        custom: [{ id: 'walk', hours: 30, title: '30 h: walk', body: 'Go for a walk.', source: null }],
        notifyGoal: true,
        notifyPersonalBest: true,
      },
      48 * HOUR,
      NOW,
    );
    expect(alerts.map((a) => a.title)).toEqual(['30 h: walk', 'Goal reached', 'New longest fast']);
  });

  it('never schedules for an ended fast', () => {
    const settings = { ...DEFAULT_MILESTONE_SETTINGS, enabledIds: ['h24'] };
    expect(planAlerts({ ...running, end: NOW }, settings, 0, NOW)).toEqual([]);
  });
});

describe('customMilestone', () => {
  it('names a milestone by its length and keeps your note', () => {
    expect(customMilestone(36, ' walk ', 'c1')).toEqual({
      id: 'c1',
      hours: 36,
      title: '1d 12h',
      body: 'walk',
      source: null,
    });
    expect(customMilestone(120, '', 'c2')?.title).toBe('5d');
    expect(customMilestone(18, '', 'c3')?.body).toBe('You reached 18h.');
    expect(customMilestone(0.5, '', 'c5')?.title).toBe('30m');
    expect(customMilestone(0, '', 'c4')).toBeNull();
  });
});
