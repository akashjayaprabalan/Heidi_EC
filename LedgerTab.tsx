import { INITIAL_CREDITS } from './constants';
import { LedgerEventType } from './types';
import type { LedgerEntry } from './types';

type LedgerTabProps = {
  ledger: LedgerEntry[];
};

export function LedgerTab({ ledger }: LedgerTabProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">Ledger Log</h2>
        <div className="bg-white border rounded-2xl p-5 max-w-md text-sm leading-snug text-slate-500">
          <div className="font-bold uppercase text-slate-400 mb-1">Incentive Rules</div>
          &bull; Start: {INITIAL_CREDITS} credits per clinic<br />
          &bull; View: 10 cost (transferred to author)<br />
          &bull; Requirement: Opt-in + Patient Consent<br />
          &bull; Opt-out removes reports from search and stops earnings
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-y-auto max-h-[700px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ledger.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-5 text-slate-400 whitespace-nowrap align-top">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-6 py-5 align-top">
                  <span className={`px-3 py-1.5 rounded-full font-black text-[10px] ${
                    entry.type === LedgerEventType.TRANSFER
                      ? 'bg-green-100 text-green-700'
                      : entry.type === LedgerEventType.BLOCKED
                        ? 'bg-red-100 text-red-700'
                        : entry.type === LedgerEventType.VIEW
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {entry.type}
                  </span>
                </td>
                <td className="px-6 py-5 text-slate-700 font-medium leading-relaxed">{entry.message}</td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-14 text-center text-slate-400 italic text-base">
                  No market events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
