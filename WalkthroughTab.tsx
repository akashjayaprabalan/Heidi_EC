import type { ActiveTab } from './appTypes';
import { formatPercent, getOptInRate } from './appHelpers';
import { VIEW_COST } from './constants';
import { PATIENT_BY_ID } from './demoData';
import { isReportSharedToNetwork, toRecordById } from './sharing';
import type { Clinic, Report } from './types';

type WalkthroughTabProps = {
  clinics: Clinic[];
  reports: Report[];
  currentUser: Clinic;
  onTabChange: (tab: ActiveTab) => void;
};

export function WalkthroughTab({ clinics, reports, currentUser, onTabChange }: WalkthroughTabProps) {
  const optInRate = getOptInRate(clinics);
  const clinicById = toRecordById(clinics);
  const sharedReports = reports.filter((report) => isReportSharedToNetwork(report, PATIENT_BY_ID, clinicById)).length;
  const citySports = clinics.find((clinic) => clinic.username === 'city');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="text-sm font-black uppercase tracking-wide text-blue-600 mb-2">Reciprocity market for patient continuity</div>
        <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">Sharing becomes the selfish move.</h2>
        <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
          Clinics earn credits when competitors use their capsules, and they must stay opted in to unlock history from others. The market rewards useful continuity without exposing private reasoning by default.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">Current opt-in</div>
          <div className="text-4xl font-black text-blue-600 mt-2">{formatPercent(optInRate)}</div>
          <div className="text-sm text-slate-500 mt-1">{clinics.filter((clinic) => clinic.optedIn).length} of {clinics.length} demo clinics</div>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">Shared inventory</div>
          <div className="text-4xl font-black text-green-600 mt-2">{sharedReports}</div>
          <div className="text-sm text-slate-500 mt-1">reports visible while authors stay opted in</div>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">Unlock price</div>
          <div className="text-4xl font-black text-slate-900 mt-2">{VIEW_COST}</div>
          <div className="text-sm text-slate-500 mt-1">credits transferred to the author</div>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400">Opted-out demo clinic</div>
          <div className="text-2xl font-black text-red-500 mt-3">{citySports?.name ?? 'City Sports Rehab'}</div>
          <div className="text-sm text-slate-500 mt-1">login: city / city123</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400 mb-3">Acceptance flow</div>
          <ol className="space-y-4 text-sm text-slate-600">
            <li><strong>1.</strong> Login as City Sports Rehab, an opted-out competitor.</li>
            <li><strong>2.</strong> Search Sam Lee and see the unlock button blocked.</li>
            <li><strong>3.</strong> Opt in, unlock the capsule, and watch 10 credits transfer to the author.</li>
            <li><strong>4.</strong> Open Ledger and Leaderboard to see reinforcement.</li>
            <li><strong>5.</strong> Toggle the author out and their reports leave the network.</li>
          </ol>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400 mb-3">Why competitors join</div>
          <div className="space-y-4 text-sm text-slate-600">
            <p><strong>Receive history:</strong> Access is gated behind opt-in, so free-riding stops after the initial runway.</p>
            <p><strong>Earn from switching:</strong> If a patient goes elsewhere, the original clinic can still earn from its useful history.</p>
            <p><strong>Reduce judgment:</strong> The default shared object is a structured capsule with anonymous origin labels.</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-400 mb-3">Current clinic</div>
          <div className="text-2xl font-black text-slate-900">{currentUser.name}</div>
          <div className={`mt-2 text-sm font-black uppercase ${currentUser.optedIn ? 'text-green-600' : 'text-red-500'}`}>
            {currentUser.optedIn ? 'Can unlock and earn' : 'Blocked from unlocking and earning'}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => onTabChange('view')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">
              Request History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
