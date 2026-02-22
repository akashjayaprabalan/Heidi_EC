import { FormEvent, memo, useCallback, useMemo, useState } from 'react';
import {
  Clinic,
  Patient,
  Report,
  LedgerEntry,
  LedgerEventType,
  UnlockedReport,
  ReportTier,
} from './types';
import {
  SEED_CLINICS,
  SEED_PATIENTS,
  VIEW_COST,
  INITIAL_CREDITS,
} from './constants';

type ActiveTab = 'settings' | 'create' | 'view' | 'simulator' | 'ledger';
type IconName = 'settings' | 'plus' | 'search' | 'trending-up' | 'file-text' | 'lock';

type CreateReportInput = {
  patientId: string;
  tier: ReportTier;
  notes: string;
};

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: IconName;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'create', label: 'Create Report', icon: 'plus' },
  { id: 'view', label: 'View Reports', icon: 'search' },
  { id: 'simulator', label: 'Credit Monitor', icon: 'trending-up' },
  { id: 'ledger', label: 'Ledger', icon: 'file-text' },
];

const REPORT_TIERS: ReportTier[] = ['Private', 'Summary', 'Full'];
const MAX_SIMULATED_VIEWS = 5;
const ACTIVE_TAB_DEFAULT: ActiveTab = 'settings';

const SEEDED_REPORTS: Report[] = (() => {
  const now = Date.now();
  return [
    {
      id: 'r1',
      patientId: 'p1',
      authorClinicId: 'c1',
      tier: 'Summary',
      notes: 'Patient showing good progress on ACL recovery. Range of motion improved by 15 degrees.',
      timestamp: now - 86_400_000,
    },
    {
      id: 'r2',
      patientId: 'p3',
      authorClinicId: 'c2',
      tier: 'Summary',
      notes: 'Shoulder impingement persists. Recommended switching to eccentric loading.',
      timestamp: now - 172_800_000,
    },
    {
      id: 'r3',
      patientId: 'p6',
      authorClinicId: 'c3',
      tier: 'Full',
      notes: 'Complex lower back pain history. Full MRI details attached (simulated). Daily exercises required.',
      timestamp: now - 259_200_000,
    },
    {
      id: 'r4',
      patientId: 'p7',
      authorClinicId: 'c4',
      tier: 'Summary',
      notes: 'Ankle sprain Grade II. Standard RICE protocol followed for 1 week.',
      timestamp: now - 345_600_000,
    },
  ];
})();

const PATIENTS = SEED_PATIENTS;
const PATIENT_BY_ID = toRecordById(PATIENTS);
const ANONYMIZED_LABEL_BY_CLINIC_ID = SEED_CLINICS.reduce<Record<string, string>>((acc, clinic, index) => {
  acc[clinic.id] = `Contributor #${index + 1}`;
  return acc;
}, {});

function getSafePatientRef(patientId: string): string {
  return `Patient Record ${patientId.toUpperCase()}`;
}

function toRecordById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function buildInitialClinics(): Clinic[] {
  const sharedCounts = SEEDED_REPORTS.reduce<Record<string, number>>((acc, report) => {
    acc[report.authorClinicId] = (acc[report.authorClinicId] ?? 0) + 1;
    return acc;
  }, {});

  return SEED_CLINICS.map((clinic) => ({
    ...clinic,
    reportsShared: sharedCounts[clinic.id] ?? clinic.reportsShared ?? 0,
  }));
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function unlockedKey(viewerClinicId: string, reportId: string): string {
  return `${viewerClinicId}:${reportId}`;
}

const Icon = memo(function Icon({ name }: { name: IconName }) {
  switch (name) {
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

type LoginScreenProps = {
  clinics: Clinic[];
  onLogin: (e: FormEvent<HTMLFormElement>) => void;
};

function LoginScreen({ clinics, onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Heidi Collective</h1>
        <p className="text-slate-400 max-w-md">The "Give-to-Get" incentive system for competing clinics to share patient history safely.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 text-slate-800">Demo Sign-in</h2>
        <p className="text-sm text-slate-500 mb-6">
          Choose a clinic identity by username. No passwords are stored in this client demo.
        </p>
        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              name="username"
              type="text"
              placeholder="e.g. harbour"
              autoComplete="username"
              className="w-full border rounded-lg p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
          </div>
          <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95">
            Enter Network
          </button>
        </form>

        <div className="mt-8 pt-8 border-t">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Demo Access</h3>
          <div className="grid grid-cols-1 gap-2">
            {clinics.map((clinic) => (
              <div key={clinic.id} className="text-[10px] flex justify-between bg-slate-50 p-2 rounded">
                <span className="font-bold text-slate-600">{clinic.name}</span>
                <span className="text-slate-400 font-mono">{clinic.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-md text-center text-slate-500 text-xs">
        This is a behavior prototype. No real data is stored.
      </div>
    </div>
  );
}

type KPIStripProps = {
  optInCount: number;
  totalClinics: number;
  reportsCount: number;
  credits: number;
};

function KPIStrip({ optInCount, totalClinics, reportsCount, credits }: KPIStripProps) {
  return (
    <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center gap-6 text-sm">
      <div className="flex flex-col">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Network Health</span>
        <span className="font-semibold">{optInCount}/{totalClinics} Clinics Opted In</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Volume</span>
        <span className="font-semibold">{reportsCount} Reports Shared</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Rule</span>
        <span className="font-semibold italic">View cost: {VIEW_COST} → Transferred to Author</span>
      </div>
      <div className="flex flex-col ml-auto">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Active Balance</span>
        <span className={`font-bold text-lg ${credits < VIEW_COST ? 'text-red-400' : 'text-green-400'}`}>
          {credits} Credits
        </span>
      </div>
    </div>
  );
}

type SidebarProps = {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
};

function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r h-[calc(100vh-140px)] sticky top-0">
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
        <div className="mt-8 pt-8 border-t">
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            Switch Clinic (Demo Logout)
          </button>
        </div>
      </nav>
    </div>
  );
}

type SettingsTabProps = {
  currentUser: Clinic;
  onToggleOptIn: () => void;
};

function SettingsTab({ currentUser, onToggleOptIn }: SettingsTabProps) {
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Clinic Settings</h2>

      <div className="bg-white rounded-xl border p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg">Participation Status</h3>
            <p className="text-sm text-slate-500">Enable network sharing and viewing</p>
          </div>
          <button
            onClick={onToggleOptIn}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              currentUser.optedIn
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {currentUser.optedIn ? 'OPTED IN' : 'OPTED OUT'}
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
            <p>View costs <strong>10 credits</strong>, which are transferred directly to the report's author clinic.</p>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
            <p>Clinics that only consume will run out after 5 views (30 initial credits / 10 cost).</p>
          </div>
          <div className="flex gap-3">
            <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
            <p>Judgement-safe: Origins are shown as <strong>Contributor #XX</strong>. Private notes are never shared.</p>
          </div>
        </div>
      </div>

      {!currentUser.optedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          <strong>Action Blocked:</strong> While opted out, you cannot view network reports or share your own reports to the Collective.
        </div>
      )}
    </div>
  );
}

type CreateReportTabProps = {
  currentUser: Clinic;
  patients: Patient[];
  patientById: Record<string, Patient>;
  reports: Report[];
  onCreateReport: (input: CreateReportInput) => void;
};

function CreateReportTab({ currentUser, patients, patientById, reports, onCreateReport }: CreateReportTabProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [tier, setTier] = useState<ReportTier>('Summary');
  const [notes, setNotes] = useState('');

  const myReports = useMemo(
    () => reports.filter((report) => report.authorClinicId === currentUser.id),
    [reports, currentUser.id],
  );

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatientId || !notes.trim()) {
      return;
    }

    onCreateReport({
      patientId: selectedPatientId,
      tier,
      notes: notes.trim(),
    });

    setNotes('');
    alert('Report saved successfully');
  };

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Record Visit</h2>
        <form onSubmit={handleSave} className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient</label>
            <select
              className="w-full border rounded-lg p-2 bg-slate-50"
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
            <label className="block text-sm font-medium mb-1">Sharing Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {REPORT_TIERS.map((reportTier) => (
                <button
                  key={reportTier}
                  type="button"
                  onClick={() => setTier(reportTier)}
                  className={`p-2 text-sm font-medium border rounded-lg transition-colors ${
                    tier === reportTier ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  {reportTier}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Visit Notes</label>
            <textarea
              className="w-full border rounded-lg p-2 h-32 bg-slate-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical notes..."
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Report
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Clinic History</h2>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">My Local Reports</h3>
          {myReports.length === 0 ? (
            <p className="text-slate-500 italic text-sm">No reports saved yet.</p>
          ) : (
            myReports.map((report) => {
              const patient = patientById[report.patientId];
              const isShared = currentUser.optedIn && patient?.consent && report.tier !== 'Private';

              return (
                <div key={report.id} className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <div className="font-semibold text-slate-800">{patient?.name}</div>
                    <div className="text-xs text-slate-500">{new Date(report.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                      report.tier === 'Private' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {report.tier}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                      isShared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isShared ? 'Shared' : 'Private'}
                    </span>
                  </div>
                </div>
              );
            })
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
  unlockedSet: Set<string>;
  onViewReport: (report: Report) => void;
};

function ViewReportsTab({ currentUser, reports, patients, patientById, unlockedSet, onViewReport }: ViewReportsTabProps) {
  const [searchPatientId, setSearchPatientId] = useState('');

  const availableReports = useMemo(() => {
    if (!searchPatientId) {
      return [];
    }

    return reports.filter((report) => {
      const patient = patientById[report.patientId];
      return (
        report.patientId === searchPatientId &&
        report.authorClinicId !== currentUser.id &&
        report.tier !== 'Private' &&
        Boolean(patient?.consent)
      );
    });
  }, [searchPatientId, reports, patientById, currentUser.id]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Request Patient History</h2>
      <div className="bg-white rounded-xl border p-6 shadow-sm mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Search Patient</label>
          <select
            className="w-full border rounded-lg p-2 bg-slate-50"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
          >
            <option value="">Select Patient to See Availability</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-50 px-4 py-2 border rounded-lg text-sm text-slate-500">
          {availableReports.length} External Reports Available
        </div>
      </div>

      <div className="space-y-6">
        {searchPatientId && availableReports.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-xl border-dashed">
            <p className="text-slate-400">No external shared reports found for this patient.</p>
          </div>
        )}

        {availableReports.map((report) => {
          const isUnlocked = unlockedSet.has(unlockedKey(currentUser.id, report.id));
          const canAfford = currentUser.credits >= VIEW_COST;

          return (
            <div key={report.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleDateString()}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                  report.tier === 'Full' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {report.tier} Tier Available
                </span>
              </div>
              <div className="p-6">
                {!isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon name="lock" />
                      <span className="text-sm font-medium">Content Redacted</span>
                    </div>
                    <button
                      disabled={!canAfford || !currentUser.optedIn}
                      onClick={() => onViewReport(report)}
                      className={`px-8 py-3 rounded-lg font-bold transition-all shadow-md ${
                        canAfford && currentUser.optedIn
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Unlock Report (Cost {VIEW_COST} Credits)
                    </button>
                    {!currentUser.optedIn && (
                      <p className="text-xs text-red-500 font-semibold">You are Opted Out</p>
                    )}
                    {currentUser.optedIn && !canAfford && (
                      <p className="text-xs text-red-500 font-semibold italic">Insufficient Credits ({currentUser.credits})</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Continuity Summary</h4>
                      <div className="bg-blue-50/50 p-4 rounded border border-blue-100 text-slate-700 leading-relaxed italic">
                        &quot;{report.tier === 'Summary' ? report.notes : `${report.notes.slice(0, 100)}...`}&quot;
                      </div>
                    </div>

                    {report.tier === 'Full' && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Full Treatment Detail</h4>
                        <div className="p-4 rounded border bg-slate-50 text-slate-800 leading-relaxed">
                          {report.notes}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                      <span>Unlocked Content</span>
                      <span className="text-blue-500 italic">Judgement-Safe: Standardized summary, origin hidden.</span>
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

type EconomySimulatorTabProps = {
  currentUser: Clinic;
  clinics: Clinic[];
  onSimulateConsumeOnly: () => void;
  onSimulateOthersViewMe: () => void;
};

function EconomySimulatorTab({ currentUser, clinics, onSimulateConsumeOnly, onSimulateOthersViewMe }: EconomySimulatorTabProps) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Credit Monitor</h2>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-bold">Clinic</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Credits</th>
              <th className="px-6 py-4 font-bold text-center">Shared</th>
              <th className="px-6 py-4 font-bold text-center">Viewed</th>
              <th className="px-6 py-4 font-bold">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clinics.map((clinic) => {
              const net = clinic.credits - INITIAL_CREDITS;

              return (
                <tr key={clinic.id} className={clinic.id === currentUser.id ? 'bg-blue-50/50' : ''}>
                  <td className="px-6 py-4 font-medium text-slate-900">{clinic.name} {clinic.id === currentUser.id ? '(Me)' : ''}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      clinic.optedIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {clinic.optedIn ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{clinic.credits}</td>
                  <td className="px-6 py-4 text-center">{clinic.reportsShared || 0}</td>
                  <td className="px-6 py-4 text-center">{clinic.reportsViewed || 0}</td>
                  <td className={`px-6 py-4 font-bold ${net > 0 ? 'text-green-600' : net < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {net > 0 ? '+' : ''}{net}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Consume Action</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Simulate the drain of your credits by viewing multiple external reports.
            This demonstrates how a clinic that doesn't share eventually hits the credit floor.
          </p>
          <button
            onClick={onSimulateConsumeOnly}
            className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Simulate 5 Views (Consume-only)
          </button>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Earning Action</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Simulate another clinic viewing one of your shared reports.
            This demonstrates how contribution sustains your ability to access data.
          </p>
          <button
            onClick={onSimulateOthersViewMe}
            className="w-full bg-blue-100 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Simulate Others Viewing My Report
          </button>
        </div>
      </div>
    </div>
  );
}

type LedgerTabProps = {
  ledger: LedgerEntry[];
};

function LedgerTab({ ledger }: LedgerTabProps) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Ledger Log</h2>
        <div className="bg-white border rounded-lg p-4 max-w-sm text-[10px] leading-snug text-slate-500">
          <div className="font-bold uppercase text-slate-400 mb-1">Incentive Rules</div>
          • Start: 30 credits per clinic<br />
          • View: 10 cost (transferred to author)<br />
          • Requirement: Opt-in + Patient Consent
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden overflow-y-auto max-h-[600px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Event</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ledger.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full font-black text-[9px] ${
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
                <td className="px-6 py-4 text-slate-700 font-medium">{entry.message}</td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No ledger events recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function App() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>(buildInitialClinics);
  const [reports, setReports] = useState<Report[]>(() => [...SEEDED_REPORTS]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [unlockedReports, setUnlockedReports] = useState<UnlockedReport[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ACTIVE_TAB_DEFAULT);

  const clinicById = useMemo(
    () => clinics.reduce<Record<string, Clinic>>((acc, clinic) => {
      acc[clinic.id] = clinic;
      return acc;
    }, {}),
    [clinics],
  );

  const currentUser = currentUserId ? clinicById[currentUserId] ?? null : null;

  const optInCount = useMemo(
    () => clinics.reduce((count, clinic) => count + (clinic.optedIn ? 1 : 0), 0),
    [clinics],
  );

  const unlockedSet = useMemo(() => {
    return unlockedReports.reduce<Set<string>>((set, unlocked) => {
      set.add(unlockedKey(unlocked.viewerClinicId, unlocked.reportId));
      return set;
    }, new Set<string>());
  }, [unlockedReports]);

  const addLedgerEntry = useCallback((type: LedgerEventType, message: string) => {
    const entry: LedgerEntry = {
      id: makeId(),
      timestamp: Date.now(),
      type,
      message,
    };

    setLedger((prev) => [entry, ...prev]);
  }, []);

  const updateClinic = useCallback((id: string, updater: Partial<Clinic> | ((clinic: Clinic) => Clinic)) => {
    setClinics((prev) =>
      prev.map((clinic) => {
        if (clinic.id !== id) {
          return clinic;
        }

        if (typeof updater === 'function') {
          return updater(clinic);
        }

        return { ...clinic, ...updater };
      }),
    );
  }, []);

  const addUnlockedReports = useCallback((entries: UnlockedReport[]) => {
    if (entries.length === 0) {
      return;
    }

    setUnlockedReports((prev) => {
      const seen = new Set(prev.map((item) => unlockedKey(item.viewerClinicId, item.reportId)));
      let changed = false;
      const next = [...prev];

      for (const entry of entries) {
        const key = unlockedKey(entry.viewerClinicId, entry.reportId);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        next.push(entry);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, []);

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get('username') ?? '').trim();
    const match = clinics.find((clinic) => clinic.username === username);
    if (!match) {
      alert('Unknown clinic username');
      return;
    }

    setCurrentUserId(match.id);
    addLedgerEntry(LedgerEventType.LOGIN, `Successful login: ${match.name}`);
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setActiveTab(ACTIVE_TAB_DEFAULT);
  };

  const handleToggleOptIn = () => {
    if (!currentUser) {
      return;
    }

    const nextOptIn = !currentUser.optedIn;
    updateClinic(currentUser.id, { optedIn: nextOptIn });
    addLedgerEntry(
      LedgerEventType.OPT,
      `${currentUser.name} switched status to ${nextOptIn ? 'OPTED IN' : 'OPTED OUT'}`,
    );
  };

  const handleCreateReport = (input: CreateReportInput) => {
    if (!currentUser) {
      return;
    }

    const patient = PATIENT_BY_ID[input.patientId];
    if (!patient) {
      return;
    }

    const report: Report = {
      id: makeId(),
      patientId: input.patientId,
      authorClinicId: currentUser.id,
      tier: input.tier,
      notes: input.notes,
      timestamp: Date.now(),
    };

    setReports((prev) => [...prev, report]);

    const canShare = currentUser.optedIn && patient.consent && input.tier !== 'Private';
    if (canShare) {
      updateClinic(currentUser.id, (clinic) => ({
        ...clinic,
        reportsShared: (clinic.reportsShared || 0) + 1,
      }));
      addLedgerEntry(
        LedgerEventType.SHARE,
        `${currentUser.name} shared a ${input.tier} report for ${getSafePatientRef(patient.id)}`,
      );
      return;
    }

    let reason = '';
    if (!currentUser.optedIn) {
      reason = 'Clinic Opted Out';
    } else if (!patient.consent) {
      reason = 'No Patient Consent';
    } else if (input.tier === 'Private') {
      reason = 'Private Tier Selected';
    }

    addLedgerEntry(
      LedgerEventType.BLOCKED,
      `${currentUser.name} saved a ${input.tier} report for ${getSafePatientRef(patient.id)}. Network share blocked: ${reason}`,
    );
  };

  const handleViewReport = (report: Report) => {
    if (!currentUser) {
      return;
    }

    if (!currentUser.optedIn) {
      alert('You must be Opted In to view reports.');
      return;
    }

    if (currentUser.credits < VIEW_COST) {
      alert('Insufficient credits. Start sharing reports to earn credits!');
      return;
    }

    if (unlockedSet.has(unlockedKey(currentUser.id, report.id))) {
      return;
    }

    setClinics((prev) =>
      prev.map((clinic) => {
        if (clinic.id === currentUser.id) {
          return {
            ...clinic,
            credits: clinic.credits - VIEW_COST,
            reportsViewed: (clinic.reportsViewed || 0) + 1,
          };
        }

        if (clinic.id === report.authorClinicId) {
          return {
            ...clinic,
            credits: clinic.credits + VIEW_COST,
          };
        }

        return clinic;
      }),
    );

    addUnlockedReports([{ viewerClinicId: currentUser.id, reportId: report.id }]);

    addLedgerEntry(LedgerEventType.VIEW, `${currentUser.name} viewed report for ${getSafePatientRef(report.patientId)}`);
    addLedgerEntry(
      LedgerEventType.TRANSFER,
      `TRANSFER: -${VIEW_COST} from ${currentUser.name} → +${VIEW_COST} to ${ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}`,
    );
  };

  const handleSimulateConsumeOnly = () => {
    if (!currentUser) {
      return;
    }

    if (!currentUser.optedIn) {
      alert('Opt in first');
      return;
    }

    const externalReports = reports.filter((report) => {
      if (report.authorClinicId === currentUser.id || report.tier === 'Private') {
        return false;
      }

      const patient = PATIENT_BY_ID[report.patientId];
      if (!patient?.consent) {
        return false;
      }

      return !unlockedSet.has(unlockedKey(currentUser.id, report.id));
    });

    let creditsUsed = 0;
    let count = 0;
    const newUnlocks: UnlockedReport[] = [];
    const authorCreditDelta: Record<string, number> = {};

    for (const report of externalReports) {
      if (count >= MAX_SIMULATED_VIEWS) {
        break;
      }
      if (currentUser.credits - creditsUsed < VIEW_COST) {
        break;
      }

      creditsUsed += VIEW_COST;
      count += 1;
      newUnlocks.push({ viewerClinicId: currentUser.id, reportId: report.id });
      authorCreditDelta[report.authorClinicId] = (authorCreditDelta[report.authorClinicId] ?? 0) + VIEW_COST;

      addLedgerEntry(
        LedgerEventType.TRANSFER,
        `SIMULATION: ${currentUser.name} consumed ${(ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor')}'s report. -${VIEW_COST} credits.`,
      );
    }

    if (count === 0) {
      alert('No eligible external reports available to simulate.');
      return;
    }

    addUnlockedReports(newUnlocks);

    setClinics((prev) =>
      prev.map((clinic) => {
        if (clinic.id === currentUser.id) {
          return {
            ...clinic,
            credits: clinic.credits - creditsUsed,
            reportsViewed: (clinic.reportsViewed || 0) + count,
          };
        }

        const delta = authorCreditDelta[clinic.id] ?? 0;
        if (!delta) {
          return clinic;
        }

        return {
          ...clinic,
          credits: clinic.credits + delta,
        };
      }),
    );

    alert(`Simulation: Consumed ${count} reports costing ${creditsUsed} credits.`);
  };

  const handleSimulateOthersViewMe = () => {
    if (!currentUser) {
      return;
    }

    const mySharedReports = reports.filter((report) => {
      if (report.authorClinicId !== currentUser.id || report.tier === 'Private') {
        return false;
      }
      const patient = PATIENT_BY_ID[report.patientId];
      return Boolean(patient?.consent);
    });

    if (mySharedReports.length === 0) {
      alert('You haven’t shared any eligible reports yet. Create one first!');
      return;
    }

    const otherClinic = clinics.find((clinic) => clinic.id !== currentUser.id && clinic.credits >= VIEW_COST);
    if (!otherClinic) {
      alert('No other clinics have enough credits to view your reports.');
      return;
    }

    setClinics((prev) =>
      prev.map((clinic) => {
        if (clinic.id === otherClinic.id) {
          return { ...clinic, credits: clinic.credits - VIEW_COST };
        }
        if (clinic.id === currentUser.id) {
          return { ...clinic, credits: clinic.credits + VIEW_COST };
        }
        return clinic;
      }),
    );

    addLedgerEntry(LedgerEventType.TRANSFER, `SIMULATION: ${otherClinic.name} viewed your report. +${VIEW_COST} credits to you.`);
    alert(`Simulation: Someone viewed your report. +${VIEW_COST} credits!`);
  };

  if (!currentUser) {
    return <LoginScreen clinics={clinics} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs">H</div>
          <h1 className="text-lg font-black tracking-tight text-slate-800">Heidi Collective</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
            <div className={`text-[10px] font-black uppercase ${currentUser.optedIn ? 'text-green-600' : 'text-red-500'}`}>
              {currentUser.optedIn ? 'Network Active' : 'Network Off'}
            </div>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Balance</span>
            <span className={`text-lg font-black leading-none ${currentUser.credits < VIEW_COST ? 'text-red-500' : 'text-blue-600'}`}>
              {currentUser.credits}
            </span>
          </div>
        </div>
      </header>

      <KPIStrip
        optInCount={optInCount}
        totalClinics={clinics.length}
        reportsCount={reports.length}
        credits={currentUser.credits}
      />

      <main className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <div className="flex-1 bg-slate-50/50 min-h-[calc(100vh-140px)]">
          {activeTab === 'settings' && (
            <SettingsTab currentUser={currentUser} onToggleOptIn={handleToggleOptIn} />
          )}
          {activeTab === 'create' && (
            <CreateReportTab
              currentUser={currentUser}
              patients={PATIENTS}
              patientById={PATIENT_BY_ID}
              reports={reports}
              onCreateReport={handleCreateReport}
            />
          )}
          {activeTab === 'view' && (
            <ViewReportsTab
              currentUser={currentUser}
              reports={reports}
              patients={PATIENTS}
              patientById={PATIENT_BY_ID}
              unlockedSet={unlockedSet}
              onViewReport={handleViewReport}
            />
          )}
          {activeTab === 'simulator' && (
            <EconomySimulatorTab
              currentUser={currentUser}
              clinics={clinics}
              onSimulateConsumeOnly={handleSimulateConsumeOnly}
              onSimulateOthersViewMe={handleSimulateOthersViewMe}
            />
          )}
          {activeTab === 'ledger' && <LedgerTab ledger={ledger} />}
        </div>
      </main>
    </div>
  );
}

export default App;
