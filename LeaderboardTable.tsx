import type { LeaderboardRow } from './leaderboard';

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  currentUserId?: string;
};

export function LeaderboardTable({ rows, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs">
          <tr>
            <th className="px-6 py-4">Rank</th>
            <th className="px-6 py-4">Clinic</th>
            <th className="px-6 py-4">Contribution Score</th>
            <th className="px-6 py-4">Credits Earned</th>
            <th className="px-6 py-4">Credits Used</th>
            <th className="px-6 py-4">Access Runway</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, index) => {
            const isCurrentUser = currentUserId ? row.clinic.id === currentUserId : false;
            return (
              <tr key={row.clinic.id} className={isCurrentUser ? 'bg-blue-50/60' : 'hover:bg-slate-50/80 transition-colors'}>
                <td className="px-6 py-5 font-bold text-slate-700">#{index + 1}</td>
                <td className="px-6 py-5">
                  <div className="font-semibold text-slate-800">{row.clinic.name}</div>
                  <div className={`text-xs font-bold uppercase ${row.clinic.optedIn ? 'text-green-600' : 'text-slate-400'}`}>
                    {row.clinic.optedIn ? 'Opted In' : 'Opted Out'}
                  </div>
                </td>
                <td className="px-6 py-5 text-blue-700 font-black text-base">{row.contributionScore}</td>
                <td className="px-6 py-5 text-green-700 font-semibold">{row.creditsEarned}</td>
                <td className="px-6 py-5 text-red-600 font-semibold">{row.creditsUsed}</td>
                <td className="px-6 py-5">
                  <div className="text-slate-800 font-bold text-base">{row.accessRunway} unlocks</div>
                  <div className="text-xs text-slate-400">{row.remainingCredits} credits left</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
