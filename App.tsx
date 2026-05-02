import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LedgerEventType } from './types';
import type {
  Clinic,
  ContinuityCapsule,
  Patient,
  Report,
  LedgerEntry,
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
import { LeaderboardTab } from './LeaderboardTab';
import { LoginScreen } from './LoginScreen';
import { getReportSharingBlockReason, isReportSharedToNetwork, toRecordById } from './sharing';
import {
  getReportCapsule,
  getReportTierLabel,
  getSharedReportPayload,
  getUnlockBlockReason,
  settleReportUnlock,
} from './incentives';
import { calculateAdoptionOutcome } from './adoption';

type ActiveTab = 'walkthrough' | 'settings' | 'create' | 'view' | 'leaderboard' | 'ledger' | 'adoption';
type IconName = 'compass' | 'settings' | 'plus' | 'search' | 'trending-up' | 'file-text' | 'lock' | 'target';

type CreateReportInput = {
  patientId: string;
  tier: ReportTier;
  notes: string;
  capsule: ContinuityCapsule;
  reportType: string;
  visitDate: string;
};

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
  { id: 'adoption', label: '80% Simulator', icon: 'target' },
];

const SUPABASE_SAVE_DEBOUNCE_MS = 300;
const ACTIVE_TAB_DEFAULT: ActiveTab = 'walkthrough';
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
      tier: 'Capsule',
      notes: 'Private local note: patient showing good progress on ACL recovery. Range of motion improved by 15 degrees. Detailed exercise adherence and clinician reasoning stay inside Harbour.',
      capsule: {
        status: 'ACL recovery progressing; knee range improved by 15 degrees.',
        interventions: 'Strength progression, gait retraining, and supervised return-to-run drills.',
        risks: 'Avoid cutting drills until swelling remains settled for 72 hours.',
        nextStep: 'Continue graded loading and reassess hop tolerance next visit.',
      },
      reportType: 'ACL Progress Note',
      timestamp: now - 86_400_000,
    },
    {
      id: 'r2',
      patientId: 'p3',
      authorClinicId: 'c2',
      tier: 'Capsule',
      notes: 'Private local note: shoulder impingement persists. Patient frustrated by overhead work. Full treatment reasoning is visible only to Peak unless full detail is explicitly shared.',
      capsule: {
        status: 'Shoulder impingement persists with overhead aggravation.',
        interventions: 'Shifted program toward eccentric loading and scapular control.',
        risks: 'Pain spikes above 6/10 after overhead sessions should trigger regression.',
        nextStep: 'Review load tolerance after two weeks before returning to throwing.',
      },
      reportType: 'Shoulder Continuity Capsule',
      timestamp: now - 172_800_000,
    },
    {
      id: 'r3',
      patientId: 'p6',
      authorClinicId: 'c3',
      tier: 'Full',
      notes: 'Complex lower back pain history. Full MRI details attached (simulated). Daily exercises required.',
      capsule: {
        status: 'Complex lower back pain with recurring morning stiffness.',
        interventions: 'Daily mobility, graded core loading, and education on flare pacing.',
        risks: 'Escalating neurological symptoms require medical review.',
        nextStep: 'Coordinate exercise plan with next treating physio if patient attends elsewhere.',
      },
      reportType: 'Lumbar Full Detail',
      timestamp: now - 259_200_000,
    },
    {
      id: 'r4',
      patientId: 'p7',
      authorClinicId: 'c4',
      tier: 'Capsule',
      notes: 'Private local note: ankle sprain Grade II. Standard RICE protocol followed for 1 week. Manual therapy notes stay local.',
      capsule: {
        status: 'Grade II ankle sprain; swelling reduced after first week.',
        interventions: 'Compression, range work, and progressive balance drills.',
        risks: 'Delay running if lateral hop remains painful.',
        nextStep: 'Progress proprioception and retest single-leg stability.',
      },
      reportType: 'Ankle Capsule',
      timestamp: now - 345_600_000,
    },
  ];
})();

const PATIENTS = SEED_PATIENTS;
const PATIENT_BY_ID = toRecordById(PATIENTS);
const SEED_CLINIC_BY_ID = toRecordById(SEED_CLINICS);
const ANONYMIZED_LABEL_BY_CLINIC_ID = SEED_CLINICS.reduce<Record<string, string>>((acc, clinic, index) => {
  acc[clinic.id] = `Contributor #${index + 1}`;
  return acc;
}, {});

function getSafePatientRef(patientId: string): string {
  return `Patient Record ${patientId.toUpperCase()}`;
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

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function getOptInRate(clinics: readonly Clinic[]): number {
  if (clinics.length === 0) {
    return 0;
  }

  return clinics.filter((clinic) => clinic.optedIn).length / clinics.length;
}

function buildInitialClinics(): Clinic[] {
  const sharedCounts = SEEDED_REPORTS.reduce<Record<string, number>>((acc, report) => {
    if (isReportSharedToNetwork(report, PATIENT_BY_ID, SEED_CLINIC_BY_ID)) {
      acc[report.authorClinicId] = (acc[report.authorClinicId] ?? 0) + 1;
    }

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
    case 'target':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    default:
      return null;
  }
});

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

function WalkthroughTab({ clinics, reports, currentUser, onTabChange }: WalkthroughTabProps) {
  const optInRate = getOptInRate(clinics);
  const sharedReports = reports.filter((report) => isReportSharedToNetwork(report, PATIENT_BY_ID, toRecordById(clinics))).length;
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
            <button type="button" onClick={() => onTabChange('adoption')} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Show 80% Path
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdoptionSimulatorTab() {
  const [accessGate, setAccessGate] = useState(75);
  const [trustConversion, setTrustConversion] = useState(52.4);
  const outcome = useMemo(
    () =>
      calculateAdoptionOutcome({
        accessGateConversionRate: accessGate / 100,
        trustConversionRate: trustConversion / 100,
      }),
    [accessGate, trustConversion],
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl">
      <div className="mb-8">
        <div className="text-sm font-black uppercase tracking-wide text-blue-600 mb-2">80% adoption simulator</div>
        <h2 className="text-3xl lg:text-5xl font-black text-slate-900">From 19% sharing to {formatPercent(outcome.finalOptInRate)} opt-in</h2>
        <p className="mt-4 max-w-3xl text-lg text-slate-600 leading-relaxed">
          The model separates desire from action. Clinics already want to receive history; Kinetic makes receiving conditional on participation, then reduces the remaining fear with capsules and anonymous contribution accounting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-black uppercase tracking-wide text-slate-400 mb-3">
              Receiver-only clinics converted by access gate: {accessGate}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={accessGate}
              onChange={(event) => setAccessGate(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-black uppercase tracking-wide text-slate-400 mb-3">
              Remaining holdouts converted by trust controls: {trustConversion.toFixed(1)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={trustConversion}
              onChange={(event) => setTrustConversion(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
            <div className="text-xs font-black uppercase tracking-wide text-blue-500">Projected network</div>
            <div className="text-5xl font-black text-blue-700 mt-2">{outcome.finalOptedInClinics}</div>
            <div className="text-sm text-blue-700 mt-1">of {outcome.totalClinics} clinics opted in</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {outcome.stages.map((stage) => (
            <div key={stage.label} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col min-h-[260px]">
              <div className="text-xs font-black uppercase tracking-wide text-slate-400">{stage.label}</div>
              <div className="text-5xl font-black text-slate-900 mt-5">{formatPercent(stage.optInRate)}</div>
              <div className="text-sm text-slate-500 mt-1">{stage.optedInClinics} clinics</div>
              <p className="text-sm text-slate-600 leading-relaxed mt-auto">{stage.explanation}</p>
            </div>
          ))}
        </div>
      </div>
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
  onCreateReport: (input: CreateReportInput) => void;
};

function CreateReportTab({ currentUser, patients, patientById, reports, onCreateReport }: CreateReportTabProps) {
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
      return;
    }

    onCreateReport({
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

    setNotes('');
    setCapsuleStatus('');
    setCapsuleInterventions('');
    setCapsuleRisks('');
    setCapsuleNextStep('');
    setShareFullDetail(false);
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
                      {formatReportVisitDate(report)} • {getReportTypeLabel(report)}
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
                    {formatReportVisitDate(selectedLocalReport)} • {getReportTypeLabel(selectedLocalReport)}
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
                    {Object.entries(getReportCapsule(selectedLocalReport)).map(([label, value]) => (
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
  onViewReport: (report: Report) => void;
};

function ViewReportsTab({ currentUser, reports, patients, patientById, clinicById, unlockedSet, onViewReport }: ViewReportsTabProps) {
  const [searchPatientId, setSearchPatientId] = useState('');

  const availableReports = useMemo(() => {
    if (!searchPatientId) {
      return [];
    }

    return reports.filter(
      (report) =>
        report.patientId === searchPatientId &&
        report.authorClinicId !== currentUser.id &&
        isReportSharedToNetwork(report, patientById, clinicById),
    );
  }, [searchPatientId, reports, patientById, clinicById, currentUser.id]);

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
          const unlockBlockReason = getUnlockBlockReason(currentUser, report, patientById, clinicById);
          const sharedPayload = getSharedReportPayload(report);
          const capsuleEntries = Object.entries(sharedPayload.capsule);

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
                  {getReportTierLabel(report)} Available
                </span>
              </div>
              <div className="p-6 lg:p-8">
                {!isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon name="lock" />
                      <span className="text-base font-medium">Continuity Capsule Locked</span>
                    </div>
                    <button
                      disabled={unlockBlockReason !== null}
                      onClick={() => onViewReport(report)}
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
                        {capsuleEntries.map(([label, value]) => (
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
                      <span>Unlocked Content</span>
                      <span className="text-blue-500 italic">Judgement-safe: structured capsule, origin hidden.</span>
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
  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">Ledger Log</h2>
        <div className="bg-white border rounded-2xl p-5 max-w-md text-sm leading-snug text-slate-500">
          <div className="font-bold uppercase text-slate-400 mb-1">Incentive Rules</div>
          • Start: {INITIAL_CREDITS} credits per clinic<br />
          • View: 10 cost (transferred to author)<br />
          • Requirement: Opt-in + Patient Consent<br />
          • Opt-out removes reports from search and stops earnings
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
    const username = String(formData.get('username') ?? '').trim().toLowerCase();
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
      `${currentUser.name} switched status to ${nextOptIn ? 'OPTED IN: can unlock history and earn credits' : 'OPTED OUT: reports removed from search and earning stopped'}`,
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
      capsule: input.capsule,
      reportType: input.reportType,
      visitDate: input.visitDate,
      timestamp: Date.now(),
    };

    setReports((prev) => [...prev, report]);

    const sharingBlockReason = getReportSharingBlockReason(currentUser, patient, input.tier);
    if (sharingBlockReason === null) {
      updateClinic(currentUser.id, (clinic) => ({
        ...clinic,
        reportsShared: (clinic.reportsShared || 0) + 1,
      }));
      addLedgerEntry(
        LedgerEventType.SHARE,
        `${currentUser.name} listed a ${getReportTierLabel(report)} for ${getSafePatientRef(patient.id)}. Private notes ${input.tier === 'Full' ? 'were explicitly made unlockable' : 'stayed local'}.`,
      );
      return;
    }

    addLedgerEntry(
      LedgerEventType.BLOCKED,
      `${currentUser.name} saved a ${getReportTierLabel(report)} for ${getSafePatientRef(patient.id)}. Network listing blocked: ${sharingBlockReason}`,
    );
  };

  const handleViewReport = (report: Report) => {
    if (!currentUser) {
      return;
    }

    if (unlockedSet.has(unlockedKey(currentUser.id, report.id))) {
      return;
    }

    const blockReason = getUnlockBlockReason(currentUser, report, PATIENT_BY_ID, clinicById);
    if (blockReason) {
      alert(blockReason);
      addLedgerEntry(
        LedgerEventType.BLOCKED,
        `${currentUser.name} could not unlock ${getSafePatientRef(report.patientId)}: ${blockReason}`,
      );
      return;
    }

    const wasAlreadyUnlocked = unlockedSet.has(unlockedKey(currentUser.id, report.id));
    setClinics((prev) => settleReportUnlock(prev, currentUser.id, report.authorClinicId, wasAlreadyUnlocked).clinics);

    addUnlockedReports([{ viewerClinicId: currentUser.id, reportId: report.id }]);

    addLedgerEntry(LedgerEventType.VIEW, `${currentUser.name} unlocked ${getReportTierLabel(report)} for ${getSafePatientRef(report.patientId)}`);
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
          {activeTab === 'walkthrough' && (
            <WalkthroughTab
              clinics={clinics}
              reports={reports}
              currentUser={currentUser}
              onTabChange={setActiveTab}
            />
          )}
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
              clinicById={clinicById}
              unlockedSet={unlockedSet}
              onViewReport={handleViewReport}
            />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab
              clinics={clinics}
              currentUserId={currentUser.id}
            />
          )}
          {activeTab === 'ledger' && <LedgerTab ledger={ledger} />}
          {activeTab === 'adoption' && <AdoptionSimulatorTab />}
        </div>
      </main>
    </div>
  );
}

export default App;
