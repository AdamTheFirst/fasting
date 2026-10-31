export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Elapsed time for display. Days are shown as days and nothing is capped:
 * >= 24 h is "3d 04h 12m", under 24 h is "16h 05m 12s". Never "76:12".
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
}

/** Short duration for rows and messages: "3d 0h 10m", or "16h 05m" under a day. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / MINUTE));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${pad(minutes)}m`;
  return `${hours}h ${pad(minutes)}m`;
}

/** Words for screen readers: "3 days 4 hours 12 minutes". */
export function formatSpoken(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / MINUTE));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const parts: string[] = [];
  if (days) parts.push(part(days, 'day'));
  if (hours) parts.push(part(hours, 'hour'));
  parts.push(part(minutes, 'minute'));
  return parts.join(' ');
}

/** Compact duration for stat tiles: "3d 4h", "16h", and minutes only under an hour ("13m"). */
export function formatShort(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / MINUTE));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}
