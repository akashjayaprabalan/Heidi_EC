import { memo, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ANONYMIZED_LABEL_BY_CLINIC_ID,
  type ActiveTab,
  buildLeaderboardRows,
  type Clinic,
  type CreateReportInput,
  type CreateReportResult,
  formatPercent,
  formatReportVisitDate,
  getCapsuleEntries,
  getOptInRate,
  getReportCapsule,
  getPatientHistoryReports,
  getReportSharingBlockReason,
  getReportTierLabel,
  getReportTypeLabel,
  getSharedReportPayload,
  getUnlockBlockReason,
  type IconName,
  INITIAL_CREDITS,
  isReportSharedToNetwork,
  type LeaderboardRow,
  type LedgerEntry,
  LedgerEventType,
  type Patient,
  PATIENT_BY_ID,
  type Report,
  toRecordById,
  unlockedKey,
  type ViewReportResult,
  VIEW_COST,
} from './domain';

type LoginScreenProps = {
  clinics: Clinic[];
  onLogin: (e: FormEvent<HTMLFormElement>) => void;
  loginError?: string | null;
};

type LoginViewMode = 'login' | 'leaderboard';

export function LoginScreen({ clinics, onLogin, loginError }: LoginScreenProps) {
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
              {loginError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {loginError}
                </div>
              )}
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
              <div className="text-sm text-slate-500">Ranked by contribution score.</div>
            </div>
            <LeaderboardTable rows={leaderboardRows} />
          </div>
        )}
      </div>
    </div>
  );
}

type AppShellProps = {
  activeTab: ActiveTab;
  currentUser: Clinic;
  children: ReactNode;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
};

export function AppShell({ activeTab, currentUser, children, onTabChange, onLogout }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 md:px-8 lg:px-10 py-4 lg:py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">K</div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-slate-800">Kinetic</h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-base lg:text-lg font-bold text-slate-800">{currentUser.name}</div>
            <div className={`text-xs font-black uppercase tracking-wide ${currentUser.optedIn ? 'text-green-600' : 'text-red-500'}`}>
              {currentUser.optedIn ? 'Network Active' : 'Network Off'}
            </div>
          </div>
          <div className="h-12 w-px bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-bold tracking-wide text-slate-400">Balance</span>
            <span className={`text-2xl font-black leading-none ${currentUser.credits < VIEW_COST ? 'text-red-500' : 'text-blue-600'}`}>
              {currentUser.credits}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
        <div className="flex-1 bg-slate-50/50 min-h-[calc(100vh-88px)] overflow-x-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: IconName;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'walkthrough', label: 'Walkthrough', icon: 'compass' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'create', label: 'My Reports', icon: 'plus' },
  { id: 'view', label: 'View Reports', icon: 'search' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'trending-up' },
  { id: 'ledger', label: 'Ledger', icon: 'file-text' },
];

type SidebarProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
};

function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="w-72 lg:w-80 bg-white border-r min-h-[calc(100vh-88px)] sticky top-0">
      <nav className="p-5 lg:p-6 space-y-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-base font-medium transition-colors ${
              activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
        <div className="mt-10 pt-8 border-t">
          <button
            onClick={onLogout}
            className="w-full text-left px-5 py-3 text-base text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Switch Clinic (Demo Logout)
          </button>
        </div>
      </nav>
    </div>
  );
}

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

type SettingsTabProps = {
  currentUser: Clinic;
  onToggleOptIn: () => void;
};

export function SettingsTab({ currentUser, onToggleOptIn }: SettingsTabProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10 w-full min-h-[calc(100vh-88px)] flex flex-col">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8">Clinic Settings</h2>

      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border shadow-sm p-5 md:p-6 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h3 className="font-semibold text-xl md:text-2xl lg:text-3xl leading-tight">Participation Status</h3>
            <p className="mt-2 text-base md:text-lg text-slate-500 leading-tight">Opt in to unlock history, earn from useful capsules, and stay visible in the market.</p>
          </div>

          <div className="space-y-5 lg:space-y-6 text-base md:text-lg lg:text-xl text-slate-600 leading-snug">
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">1</div>
              <p>View costs <strong>10 credits</strong>, which are transferred directly to the report&apos;s author clinic.</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">2</div>
              <p>Opted-out clinics cannot unlock history, cannot earn credits, and their shared inventory disappears from search.</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">3</div>
              <p>Judgement-safe: The default shared object is a <strong>Continuity Capsule</strong>; full notes stay local unless explicitly shared.</p>
            </div>
          </div>
        </div>

        {!currentUser.optedIn && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <strong>Market Off:</strong> While opted out, you cannot view network reports, earn from competitor unlocks, or keep your reports visible in the Collective.
          </div>
        )}

        <div className="mt-auto pt-8 flex justify-center">
          <button
            onClick={onToggleOptIn}
            className={`px-10 lg:px-14 py-4 lg:py-5 rounded-full font-bold text-xl lg:text-2xl tracking-wide transition-all ${
              currentUser.optedIn
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {currentUser.optedIn ? 'OPTED IN' : 'OPTED OUT'}
          </button>
        </div>
      </div>
    </div>
  );
}

type CreateReportTabProps = {
  currentUser: Clinic;
  patients: Patient[];
  patientById: Record<string, Patient>;
  reports: Report[];
  onCreateReport: (input: CreateReportInput) => CreateReportResult;
};

export function CreateReportTab({ currentUser, patients, patientById, reports, onCreateReport }: CreateReportTabProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('Progress Note');
  const [notes, setNotes] = useState('');
  const [capsuleStatus, setCapsuleStatus] = useState('');
  const [capsuleInterventions, setCapsuleInterventions] = useState('');
  const [capsuleRisks, setCapsuleRisks] = useState('');
  const [capsuleNextStep, setCapsuleNextStep] = useState('');
  const [shareFullDetail, setShareFullDetail] = useState(false);
  const [selectedLocalReportId, setSelectedLocalReportId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<CreateReportResult | null>(null);

  const myReports = useMemo(
    () => reports.filter((report) => report.authorClinicId === currentUser.id),
    [reports, currentUser.id],
  );
  const selectedLocalReport = useMemo(
    () => myReports.find((report) => report.id === selectedLocalReportId) ?? null,
    [myReports, selectedLocalReportId],
  );

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !selectedPatientId ||
      !notes.trim() ||
      !capsuleStatus.trim() ||
      !capsuleInterventions.trim() ||
      !capsuleRisks.trim() ||
      !capsuleNextStep.trim()
    ) {
      setFormStatus({ ok: false, message: 'Complete every report and capsule field before saving.' });
      return;
    }

    const result = onCreateReport({
      patientId: selectedPatientId,
      tier: shareFullDetail ? 'Full' : 'Capsule',
      notes: notes.trim(),
      capsule: {
        status: capsuleStatus.trim(),
        interventions: capsuleInterventions.trim(),
        risks: capsuleRisks.trim(),
        nextStep: capsuleNextStep.trim(),
      },
      reportType: reportType.trim(),
      visitDate,
    });

    setFormStatus(result);

    if (!result.ok) {
      return;
    }

    setNotes('');
    setCapsuleStatus('');
    setCapsuleInterventions('');
    setCapsuleRisks('');
    setCapsuleNextStep('');
    setShareFullDetail(false);

    if (result.reportId) {
      setSelectedLocalReportId(result.reportId);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
      <div>
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Record Visit</h2>
        <form onSubmit={handleSave} className="bg-white rounded-2xl border p-6 lg:p-8 shadow-sm space-y-5">
          {formStatus && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${
              formStatus.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {formStatus.message}
            </div>
          )}

          <div>
            <label className="block text-base font-semibold mb-2">Patient</label>
            <select
              className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} {patient.homeClinicId === currentUser.id ? '(Owned)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Sharing Tier</label>
            <label className="flex items-start gap-3 p-4 border rounded-xl bg-blue-50 border-blue-100 cursor-pointer">
              <input
                type="checkbox"
                checked={shareFullDetail}
                onChange={(event) => setShareFullDetail(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm lg:text-base font-bold text-slate-800">
                  {shareFullDetail ? 'Share full detail after unlock' : 'Default: share Continuity Capsule only'}
                </span>
                <span className="block mt-1 text-xs lg:text-sm text-slate-500">
                  Full clinical notes stay local unless this is explicitly enabled.
                </span>
              </span>
            </label>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Report Details</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Report Type</label>
                <input
                  type="text"
                  className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  placeholder="e.g. Progress Note"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Full Report</label>
            <textarea
              className="w-full border rounded-xl p-3 lg:p-4 h-40 bg-slate-50 text-base"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Full clinical report details..."
              required
            />
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Continuity Capsule</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleStatus}
                onChange={(e) => setCapsuleStatus(e.target.value)}
                placeholder="Current status"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleInterventions}
                onChange={(e) => setCapsuleInterventions(e.target.value)}
                placeholder="What has been tried"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleRisks}
                onChange={(e) => setCapsuleRisks(e.target.value)}
                placeholder="Risks / watch-outs"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleNextStep}
                onChange={(e) => setCapsuleNextStep(e.target.value)}
                placeholder="Recommended next step"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold text-base py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Save Report
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Clinic History</h2>
        <div className="space-y-5">
          <h3 className="text-sm lg:text-base font-bold uppercase text-slate-400 tracking-wider">My Local Reports</h3>
          {myReports.length === 0 ? (
            <p className="text-slate-500 italic text-base">No reports saved yet.</p>
          ) : (
            myReports.map((report) => {
              const patient = patientById[report.patientId];
              const sharingBlockReason = getReportSharingBlockReason(currentUser, patient, report.tier);
              const isShared = sharingBlockReason === null;
              const isSelected = selectedLocalReportId === report.id;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedLocalReportId(report.id)}
                  className={`w-full text-left bg-white border rounded-xl p-5 lg:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm transition-colors ${
                    isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-lg text-slate-800">{patient?.name}</div>
                    <div className="text-sm text-slate-500">
                      {formatReportVisitDate(report)} &bull; {getReportTypeLabel(report)}
                    </div>
                    <div className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      report.tier === 'Private' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getReportTierLabel(report)}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      isShared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`} title={sharingBlockReason ?? 'Shared with the Collective'}>
                      {isShared ? 'Shared' : 'Private'}
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-md font-bold uppercase bg-slate-100 text-slate-500">
                      {isSelected ? 'Viewing' : 'Click to View'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
          {selectedLocalReport && (
            <div className="bg-white border rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {patientById[selectedLocalReport.patientId]?.name ?? 'Patient'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {formatReportVisitDate(selectedLocalReport)} &bull; {getReportTypeLabel(selectedLocalReport)}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Saved {new Date(selectedLocalReport.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Continuity Capsule Shared To Network</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCapsuleEntries(getReportCapsule(selectedLocalReport)).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-slate-700 leading-relaxed">
                        <div className="text-[11px] font-black uppercase tracking-wide text-blue-500 mb-1">{label}</div>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Full Local Report</div>
                  <div className="rounded-xl border bg-slate-50 p-4 text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedLocalReport.notes}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewReportsTabProps = {
  currentUser: Clinic;
  reports: Report[];
  patients: Patient[];
  patientById: Record<string, Patient>;
  clinicById: Record<string, Clinic>;
  unlockedSet: Set<string>;
  onViewReport: (report: Report) => ViewReportResult;
};

export function ViewReportsTab({ currentUser, reports, patients, patientById, clinicById, unlockedSet, onViewReport }: ViewReportsTabProps) {
  const [searchPatientId, setSearchPatientId] = useState('');
  const [viewStatusByReportId, setViewStatusByReportId] = useState<Record<string, ViewReportResult>>({});

  const patientHistoryReports = useMemo(() => {
    if (!searchPatientId) {
      return [];
    }

    return getPatientHistoryReports(reports, searchPatientId, patientById, clinicById);
  }, [searchPatientId, reports, patientById, clinicById]);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Request Patient History</h2>
      {!currentUser.optedIn && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700 text-sm font-semibold">
          Opted-out clinics can search the market, but cannot unlock history or earn from their own reports until they opt in.
        </div>
      )}
      <div className="bg-white rounded-2xl border p-6 lg:p-8 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-end">
        <div className="flex-1">
          <label className="block text-base font-semibold mb-2">Search Patient</label>
          <select
            className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
          >
            <option value="">Select Patient to See Availability</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-50 px-5 py-3 border rounded-xl text-base text-slate-500 whitespace-nowrap">
          {patientHistoryReports.length} Records Available
        </div>
      </div>

      <div className="space-y-8">
        {searchPatientId && patientHistoryReports.length === 0 && (
          <div className="text-center py-16 bg-white border rounded-2xl border-dashed">
            <p className="text-slate-400 text-lg">No shared records found for this patient.</p>
          </div>
        )}

        {patientHistoryReports.map((report) => {
          const isOwnReport = report.authorClinicId === currentUser.id;
          const isUnlocked = isOwnReport || unlockedSet.has(unlockedKey(currentUser.id, report.id));
          const unlockBlockReason = isOwnReport ? null : getUnlockBlockReason(currentUser, report, patientById, clinicById);
          const sharedPayload = getSharedReportPayload(report);
          const viewStatus = viewStatusByReportId[report.id];

          return (
            <div key={report.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-5 lg:p-6 bg-slate-50 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base lg:text-lg text-slate-700">
                    {isOwnReport ? 'Your Clinic' : ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-sm text-slate-400">{formatReportVisitDate(report)}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-sm text-slate-400">{getReportTypeLabel(report)}</span>
                </div>
                <span className={`text-xs md:text-sm px-3 py-1.5 rounded-md font-bold uppercase ${
                  report.tier === 'Full' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {getReportTierLabel(report)} Available
                </span>
              </div>
              <div className="p-6 lg:p-8">
                {viewStatus && (
                  <div className={`mb-5 rounded-xl border p-4 text-sm font-semibold ${
                    viewStatus.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {viewStatus.message}
                  </div>
                )}

                {!isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon name="lock" />
                      <span className="text-base font-medium">Continuity Capsule Locked</span>
                    </div>
                    <button
                      disabled={unlockBlockReason !== null}
                      onClick={() => {
                        const result = onViewReport(report);
                        setViewStatusByReportId((prev) => ({ ...prev, [report.id]: result }));
                      }}
                      className={`px-10 py-4 rounded-xl text-base font-bold transition-all shadow-md ${
                        unlockBlockReason === null
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Unlock Report (Cost {VIEW_COST} Credits)
                    </button>
                    {unlockBlockReason && (
                      <p className="text-sm text-red-500 font-semibold text-center">{unlockBlockReason}</p>
                    )}
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">Full local notes hidden unless the author explicitly shared full detail</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Continuity Capsule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getCapsuleEntries(sharedPayload.capsule).map(([label, value]) => (
                          <div key={label} className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-slate-700 text-base leading-relaxed">
                            <div className="text-[11px] font-black uppercase tracking-wide text-blue-500 mb-1">{label}</div>
                            {value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {sharedPayload.fullTreatmentDetail && (
                      <div>
                        <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Explicitly Shared Full Treatment Detail</h4>
                        <div className="p-5 rounded-xl border bg-slate-50 text-slate-800 text-base leading-relaxed">
                          {sharedPayload.fullTreatmentDetail}
                        </div>
                      </div>
                    )}

                    {!sharedPayload.fullTreatmentDetail && (
                      <div className="p-5 rounded-xl border border-amber-100 bg-amber-50 text-amber-800 text-sm font-semibold">
                        Full clinical notes and private reasoning stayed inside the author clinic. Only the structured capsule entered the market.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Visit Date</div>
                        <div className="text-sm font-semibold text-slate-700">{formatReportVisitDate(report)}</div>
                      </div>
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Report Type</div>
                        <div className="text-sm font-semibold text-slate-700">{getReportTypeLabel(report)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400 uppercase font-bold tracking-wide">
                      <span>{isOwnReport ? 'Local Clinic Record' : 'Unlocked Content'}</span>
                      <span className="text-blue-500 italic">
                        {isOwnReport ? 'Your clinic authored this record.' : 'Judgement-safe: structured capsule, origin hidden.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  currentUserId?: string;
};

function LeaderboardTable({ rows, currentUserId }: LeaderboardTableProps) {
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

const Icon = memo(function Icon({ name }: { name: IconName }) {
  switch (name) {
    case 'compass':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'plus':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'search':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'trending-up':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'file-text':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'lock':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    default:
      return null;
  }
});
