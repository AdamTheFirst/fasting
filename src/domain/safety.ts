import { type Fast, goalReachedAt } from './fast';
import { HOUR } from './time';

export const SAFETY_THRESHOLD_MS = 72 * HOUR;

export const SAFETY_CARD = {
  title: 'Past three days',
  body: 'Keep electrolytes up (sodium, potassium, magnesium) and break the fast gently with small meals. Stop and get help if you feel faint, confused or your heart races. If you take insulin or blood-sugar medication, take blood-pressure medication or diuretics, have kidney disease or a heart condition, are pregnant, under 18, underweight or have had an eating disorder, talk to a doctor before fasting this long. This is not medical advice.',
  sources: [
    {
      label: 'NHS Highland: refeeding syndrome',
      url: 'https://rightdecisions.scot.nhs.uk/tam-treatments-and-medicines-nhs-highland/adult-therapeutic-guidelines/gastro-intestinal/refeeding-syndrome-in-adults-guidelines',
    },
    {
      label: 'Who should not fast',
      url: 'https://scienceinsights.org/who-should-not-intermittent-fast-groups-at-risk/',
    },
  ],
} as const;

/** Shown on the safety card and in Settings. Covers every country. */
export const HELPLINE = {
  label: 'Struggling with food or eating? Find a helpline',
  url: 'https://findahelpline.com',
} as const;

/**
 * The card shows once per fast when the running fast or its goal passes 72 h.
 * It never blocks anything, and the person can turn it off for good.
 */
export function shouldShowSafetyCard(
  fast: Fast | null,
  now: number,
  opts: { disabled: boolean; dismissedFastIds: readonly string[] },
): boolean {
  if (!fast || fast.end !== null || opts.disabled) return false;
  if (opts.dismissedFastIds.includes(fast.id)) return false;
  const goalAt = goalReachedAt(fast);
  const goalIsLong = goalAt !== null && goalAt - fast.start >= SAFETY_THRESHOLD_MS;
  return goalIsLong || now - fast.start >= SAFETY_THRESHOLD_MS;
}
