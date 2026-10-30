import { DEFAULT_MILESTONE_SETTINGS, type MilestoneSettings } from './milestones';

/** Everything a fresh install starts with. Nothing is on that the person did not turn on. */
export interface AppSettings {
  milestones: MilestoneSettings;
  safetyCardDisabled: boolean;
  safetyCardDismissedFor: string[];
  healthSyncEnabled: boolean;
  streakMinHours: number;
  showBmi: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  milestones: DEFAULT_MILESTONE_SETTINGS,
  safetyCardDisabled: false,
  safetyCardDismissedFor: [],
  healthSyncEnabled: false,
  streakMinHours: 16,
  showBmi: false,
};
