import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clinic,
  Patient,
  Report,
  LedgerEntry,
  LedgerEventType,
  UnlockedReport,
  ReportTier,
  AppSnapshot,
} from './types';
import {
  SEED_CLINICS,
  SEED_PATIENTS,
  VIEW_COST,
  INITIAL_CREDITS,
} from './constants';
import {
  canUseSupabaseSnapshotStore,
  loadAppSnapshot,
  saveAppSnapshot,
} from './appSnapshotStore';

type ActiveTab = 'settings' | 'create' | 'view' | 'ledger';
type IconName = 'settings' | 'plus' | 'search' | 'file-text' | 'lock';

type CreateReportInput = {
  patientId: string;
  tier: ReportTier;
  notes: string;
  summary: string;
  reportType: string;
  visitDate: string;
};

type NavItem = {
  id: ActiveTab;
  label: string;
  icon: IconName;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'create', label: 'My Reports', icon: 'plus' },
  { id: 'view', label: 'View Reports', icon: 'search' },
  { id: 'ledger', label: 'Ledger', icon: 'file-text' },
];

const SUPABASE_SAVE_DEBOUNCE_MS = 300;
const ACTIVE_TAB_DEFAULT: ActiveTab = 'settings';
const DEMO_PASSWORDS: Record<string, string> = {
  harbour: 'harbour123',
  peak: 'peak123',
  city: 'city123',
  north: 'north123',
  bayside: 'bayside123',
};

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

function getReportSummaryText(report: Report): string {
  const explicitSummary = report.summary?.trim();
  if (explicitSummary) {
    return explicitSummary;
  }

  if (report.tier === 'Summary') {
    return report.notes;
  }

  return report.notes.length > 100 ? `${report.notes.slice(0, 100)}...` : report.notes;
}

function getReportTypeLabel(report: Report): string {
  return report.reportType?.trim() || 'Clinical Note';
}

function formatReportVisitDate(report: Report): string {
  if (report.visitDate) {
    const parsedDate = new Date(`${report.visitDate}T00:00:00`);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
  }

  return new Date(report.timestamp).toLocaleDateString();
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

function snapshotToString(snapshot: AppSnapshot): string {
  return JSON.stringify(snapshot);
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
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">Kinetic</h1>
      </div>

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
    <div className="bg-slate-900 text-white px-6 py-4 md:px-8 md:py-5 flex flex-wrap items-center gap-6 md:gap-10 text-sm md:text-base">
      <div className="flex flex-col">
        <span className="text-slate-400 text-[11px] md:text-xs uppercase tracking-wider font-bold">Network Health</span>
        <span className="font-semibold text-sm md:text-base">{optInCount}/{totalClinics} Clinics Opted In</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400 text-[11px] md:text-xs uppercase tracking-wider font-bold">Volume</span>
        <span className="font-semibold text-sm md:text-base">{reportsCount} Reports Shared</span>
      </div>
      <div className="flex flex-col">
        <span className="text-slate-400 text-[11px] md:text-xs uppercase tracking-wider font-bold">Rule</span>
        <span className="font-semibold italic text-sm md:text-base">View cost: {VIEW_COST} → Transferred to Author</span>
      </div>
      <div className="flex flex-col ml-auto">
        <span className="text-slate-400 text-[11px] md:text-xs uppercase tracking-wider font-bold">Active Balance</span>
        <span className={`font-bold text-xl md:text-2xl ${credits < VIEW_COST ? 'text-red-400' : 'text-green-400'}`}>
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

type SettingsTabProps = {
  currentUser: Clinic;
  onToggleOptIn: () => void;
};

function SettingsTab({ currentUser, onToggleOptIn }: SettingsTabProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10 w-full min-h-[calc(100vh-88px)] flex flex-col">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8">Clinic Settings</h2>

      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border shadow-sm p-5 md:p-6 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h3 className="font-semibold text-xl md:text-2xl lg:text-3xl leading-tight">Participation Status</h3>
            <p className="mt-2 text-base md:text-lg text-slate-500 leading-tight">Enable network sharing and viewing</p>
          </div>

          <div className="space-y-5 lg:space-y-6 text-base md:text-lg lg:text-xl text-slate-600 leading-snug">
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">1</div>
              <p>View costs <strong>10 credits</strong>, which are transferred directly to the report&apos;s author clinic.</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">2</div>
              <p>Clinics that only consume will run out after 5 views ({INITIAL_CREDITS} initial credits / 10 cost).</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">3</div>
              <p>Judgement-safe: Origins are shown as <strong>Contributor #XX</strong>. Private notes are never shared.</p>
            </div>
          </div>
        </div>

        {!currentUser.optedIn && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <strong>Action Blocked:</strong> While opted out, you cannot view network reports or share your own reports to the Collective.
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
  onCreateReport: (input: CreateReportInput) => void;
};

function CreateReportTab({ currentUser, patients, patientById, reports, onCreateReport }: CreateReportTabProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('Progress Note');
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedLocalReportId, setSelectedLocalReportId] = useState<string | null>(null);

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
    if (!selectedPatientId || !notes.trim() || !summary.trim()) {
      return;
    }

    onCreateReport({
      patientId: selectedPatientId,
      tier: 'Full',
      notes: notes.trim(),
      summary: summary.trim(),
      reportType: reportType.trim(),
      visitDate,
    });

    setNotes('');
    setSummary('');
    alert('Report saved successfully');
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
      <div>
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Record Visit</h2>
        <form onSubmit={handleSave} className="bg-white rounded-2xl border p-6 lg:p-8 shadow-sm space-y-5">
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
            <div className="p-3.5 lg:p-4 text-sm lg:text-base font-semibold border rounded-xl bg-blue-600 text-white border-blue-600">
              Full Report
            </div>
            <p className="mt-2 text-xs lg:text-sm text-slate-500">
              Summary is now captured separately below.
            </p>
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
            <label className="block text-base font-semibold mb-2">Summary</label>
            <textarea
              className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Short continuity summary for sharing..."
              required
            />
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
              const isShared = currentUser.optedIn && patient?.consent && report.tier !== 'Private';
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
                      {formatReportVisitDate(report)} • {getReportTypeLabel(report)}
                    </div>
                    <div className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      report.tier === 'Private' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {report.tier}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      isShared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
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
                    {formatReportVisitDate(selectedLocalReport)} • {getReportTypeLabel(selectedLocalReport)}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Saved {new Date(selectedLocalReport.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Summary</div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-slate-700 leading-relaxed">
                    {getReportSummaryText(selectedLocalReport)}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Full Report</div>
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
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Request Patient History</h2>
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
          {availableReports.length} External Reports Available
        </div>
      </div>

      <div className="space-y-8">
        {searchPatientId && availableReports.length === 0 && (
          <div className="text-center py-16 bg-white border rounded-2xl border-dashed">
            <p className="text-slate-400 text-lg">No external shared reports found for this patient.</p>
          </div>
        )}

        {availableReports.map((report) => {
          const isUnlocked = unlockedSet.has(unlockedKey(currentUser.id, report.id));
          const canAfford = currentUser.credits >= VIEW_COST;

          return (
            <div key={report.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-5 lg:p-6 bg-slate-50 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base lg:text-lg text-slate-700">{ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-sm text-slate-400">{formatReportVisitDate(report)}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-sm text-slate-400">{getReportTypeLabel(report)}</span>
                </div>
                <span className={`text-xs md:text-sm px-3 py-1.5 rounded-md font-bold uppercase ${
                  report.tier === 'Full' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {report.tier} Tier Available
                </span>
              </div>
              <div className="p-6 lg:p-8">
                {!isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon name="lock" />
                      <span className="text-base font-medium">Content Redacted</span>
                    </div>
                    <button
                      disabled={!canAfford || !currentUser.optedIn}
                      onClick={() => onViewReport(report)}
                      className={`px-10 py-4 rounded-xl text-base font-bold transition-all shadow-md ${
                        canAfford && currentUser.optedIn
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Unlock Report (Cost {VIEW_COST} Credits)
                    </button>
                    {!currentUser.optedIn && (
                      <p className="text-sm text-red-500 font-semibold">You are Opted Out</p>
                    )}
                    {currentUser.optedIn && !canAfford && (
                      <p className="text-sm text-red-500 font-semibold italic">Insufficient Credits ({currentUser.credits})</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Continuity Summary</h4>
                      <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-slate-700 text-base leading-relaxed italic">
                        &quot;{getReportSummaryText(report)}&quot;
                      </div>
                    </div>

                    {report.tier === 'Full' && (
                      <div>
                        <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Full Treatment Detail</h4>
                        <div className="p-5 rounded-xl border bg-slate-50 text-slate-800 text-base leading-relaxed">
                          {report.notes}
                        </div>
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

type LedgerTabProps = {
  ledger: LedgerEntry[];
};

function LedgerTab({ ledger }: LedgerTabProps) {
  const creditRequestTransactions = ledger.filter(
    (entry) =>
      entry.type === LedgerEventType.TRANSFER &&
      entry.message.includes(`-${VIEW_COST}`) &&
      entry.message.includes(`+${VIEW_COST}`),
  );

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">Ledger Log</h2>
        <div className="bg-white border rounded-2xl p-5 max-w-md text-sm leading-snug text-slate-500">
          <div className="font-bold uppercase text-slate-400 mb-1">Incentive Rules</div>
          • Start: {INITIAL_CREDITS} credits per clinic<br />
          • View: 10 cost (transferred to author)<br />
          • Requirement: Opt-in + Patient Consent
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
            {creditRequestTransactions.map((entry) => (
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
            {creditRequestTransactions.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-14 text-center text-slate-400 italic text-base">
                  No 10-credit request transactions recorded yet.
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
  const [hasHydratedStore, setHasHydratedStore] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    const hydrateFromSupabase = async () => {
      if (!canUseSupabaseSnapshotStore()) {
        if (!cancelled) {
          setHasHydratedStore(true);
        }
        return;
      }

      try {
        const snapshot = await loadAppSnapshot();
        if (cancelled) {
          return;
        }

        if (snapshot) {
          lastSavedSnapshotRef.current = snapshotToString(snapshot);
          setClinics(snapshot.clinics);
          setReports(snapshot.reports);
          setLedger(snapshot.ledger);
          setUnlockedReports(snapshot.unlockedReports);
        }
      } catch (error) {
        console.warn('Supabase snapshot hydration failed; using local seed data instead.', error);
      } finally {
        if (!cancelled) {
          setHasHydratedStore(true);
        }
      }
    };

    void hydrateFromSupabase();

    return () => {
      cancelled = true;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedStore || !canUseSupabaseSnapshotStore()) {
      return;
    }

    const snapshot: AppSnapshot = {
      clinics,
      reports,
      ledger,
      unlockedReports,
    };

    const serializedSnapshot = snapshotToString(snapshot);
    if (serializedSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      lastSavedSnapshotRef.current = serializedSnapshot;

      void saveAppSnapshot(snapshot).catch((error) => {
        lastSavedSnapshotRef.current = '';
        console.warn('Supabase snapshot save failed.', error);
      });
    }, SUPABASE_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [clinics, hasHydratedStore, ledger, reports, unlockedReports]);

  const clinicById = useMemo(
    () => clinics.reduce<Record<string, Clinic>>((acc, clinic) => {
      acc[clinic.id] = clinic;
      return acc;
    }, {}),
    [clinics],
  );

  const currentUser = currentUserId ? clinicById[currentUserId] ?? null : null;

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
    const password = String(formData.get('password') ?? '');
    const match = clinics.find((clinic) => clinic.username === username);
    if (!match) {
      alert('Unknown clinic username');
      return;
    }
    const expectedPassword = DEMO_PASSWORDS[match.username];
    if (!expectedPassword || password !== expectedPassword) {
      alert('Incorrect password');
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
      summary: input.summary,
      reportType: input.reportType,
      visitDate: input.visitDate,
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

  if (!currentUser) {
    return <LoginScreen clinics={clinics} onLogin={handleLogin} />;
  }

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
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        <div className="flex-1 bg-slate-50/50 min-h-[calc(100vh-88px)] overflow-x-auto">
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
          {activeTab === 'ledger' && <LedgerTab ledger={ledger} />}
        </div>
      </main>
    </div>
  );
}

export default App;
