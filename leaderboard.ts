import { INITIAL_CREDITS, VIEW_COST } from './constants';
import type { Clinic } from './types';

export type LeaderboardRow = {
  clinic: Clinic;
  creditsEarned: number;
  creditsUsed: number;
  remainingCredits: number;
};

export function buildLeaderboardRows(clinics: readonly Clinic[]): LeaderboardRow[] {
  return clinics
    .map((clinic) => {
      const creditsUsed = Math.max(0, (clinic.reportsViewed || 0) * VIEW_COST);
      const creditsEarned = Math.max(0, clinic.credits - INITIAL_CREDITS + creditsUsed);

      return {
        clinic,
        creditsEarned,
        creditsUsed,
        remainingCredits: clinic.credits,
      };
    })
    .sort(
      (a, b) =>
        b.remainingCredits - a.remainingCredits ||
        b.creditsEarned - a.creditsEarned ||
        a.clinic.name.localeCompare(b.clinic.name),
    );
}
