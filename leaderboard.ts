import { VIEW_COST } from './constants';
import { getAccessRunway, getContributionScore, getCreditsEarned } from './incentives';
import type { Clinic } from './types';

export type LeaderboardRow = {
  clinic: Clinic;
  creditsEarned: number;
  creditsUsed: number;
  remainingCredits: number;
  accessRunway: number;
  contributionScore: number;
};

export function buildLeaderboardRows(clinics: readonly Clinic[]): LeaderboardRow[] {
  return clinics
    .map((clinic) => {
      const creditsUsed = Math.max(0, (clinic.reportsViewed || 0) * VIEW_COST);
      const creditsEarned = getCreditsEarned(clinic);

      return {
        clinic,
        creditsEarned,
        creditsUsed,
        remainingCredits: clinic.credits,
        accessRunway: getAccessRunway(clinic.credits),
        contributionScore: getContributionScore(clinic),
      };
    })
    .sort(
      (a, b) =>
        b.contributionScore - a.contributionScore ||
        b.creditsEarned - a.creditsEarned ||
        b.remainingCredits - a.remainingCredits ||
        a.clinic.name.localeCompare(b.clinic.name),
    );
}
