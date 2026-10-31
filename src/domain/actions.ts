import { type Goal, parseDurationGoal } from './fast';

/**
 * Links that start or end a fast without tapping through the app, for Shortcuts, Siri,
 * Back Tap, the Action Button, NFC tags and app-icon quick actions:
 *
 *   fastaway://action/start            open-ended
 *   fastaway://action/start?hours=36   or ?days=3
 *   fastaway://action/start?preset=<id>
 *   fastaway://action/end
 */
export type LinkAction =
  { kind: 'start'; goal: Goal | null; presetId: string | null } | { kind: 'end' } | { kind: 'unknown' };

export function parseAction(
  verb: string | undefined,
  params: Record<string, string | undefined>,
): LinkAction {
  if (verb === 'end' || verb === 'stop') return { kind: 'end' };
  if (verb !== 'start') return { kind: 'unknown' };
  if (params.preset) return { kind: 'start', goal: null, presetId: params.preset };
  const goal = params.hours
    ? parseDurationGoal(params.hours, 'hours')
    : params.days
      ? parseDurationGoal(params.days, 'days')
      : null;
  return { kind: 'start', goal, presetId: null };
}
