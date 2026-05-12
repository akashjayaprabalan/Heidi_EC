import { useMemo } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { buildLeaderboardRows } from './leaderboard';
import type { Clinic } from './types';

type LeaderboardTabProps = {
  clinics: Clinic[];
  currentUserId: string;
};

export function LeaderboardTab({ clinics, currentUserId }: LeaderboardTabProps) {
  const leaderboardRows = useMemo(() => buildLeaderboardRows(clinics), [clinics]);

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">Leaderboard</h2>
        <div className="bg-white border rounded-2xl p-5 max-w-md text-sm leading-snug text-slate-500">
          Ranked by contribution score: opt-in status, useful shared reports, and credits earned from other clinics.
        </div>
      </div>

      <LeaderboardTable rows={leaderboardRows} currentUserId={currentUserId} />
    </div>
  );
}
