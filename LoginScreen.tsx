import { FormEvent, useMemo, useState } from 'react';
import { LeaderboardTable } from './LeaderboardTable';
import { buildLeaderboardRows } from './leaderboard';
import type { Clinic } from './types';

type LoginScreenProps = {
  clinics: Clinic[];
  onLogin: (e: FormEvent<HTMLFormElement>) => void;
};

type LoginViewMode = 'login' | 'leaderboard';

export function LoginScreen({ clinics, onLogin }: LoginScreenProps) {
  const [viewMode, setViewMode] = useState<LoginViewMode>('login');
  const leaderboardRows = useMemo(() => buildLeaderboardRows(clinics), [clinics]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-900">
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-screen">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">Kinetic</h1>
        </div>

        <div className="relative w-full max-w-md mb-8 rounded-full bg-slate-700 p-1">
          <div
            className={`pointer-events-none absolute top-1 left-1 h-10 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-md transition-transform duration-300 ${
              viewMode === 'leaderboard' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <div className="relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => setViewMode('login')}
              className={`h-10 rounded-full text-sm font-bold transition-colors ${
                viewMode === 'login' ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setViewMode('leaderboard')}
              className={`h-10 rounded-full text-sm font-bold transition-colors ${
                viewMode === 'leaderboard' ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {viewMode === 'login' ? (
          <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-12 w-full max-w-xl">
            <h2 className="text-2xl font-bold mb-8 text-slate-800 text-center">Sign-in</h2>
            <form onSubmit={onLogin} className="space-y-5">
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Username</label>
                <input
                  name="username"
                  type="text"
                  placeholder="e.g. harbour"
                  autoComplete="username"
                  className="w-full border rounded-xl p-4 text-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-slate-700 mb-2">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter demo password"
                  autoComplete="current-password"
                  className="w-full border rounded-xl p-4 text-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <button className="w-full bg-blue-600 text-white text-lg font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">
                Enter Network
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Leaderboard</h2>
              <div className="text-sm text-slate-500">Ranked by remaining credits.</div>
            </div>
            <LeaderboardTable rows={leaderboardRows} />
          </div>
        )}
      </div>
    </div>
  );
}
