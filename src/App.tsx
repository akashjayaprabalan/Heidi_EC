import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ANONYMIZED_LABEL_BY_CLINIC_ID,
  type ActiveTab,
  type AppSnapshot,
  buildInitialClinics,
  type Clinic,
  type CreateReportInput,
  type CreateReportResult,
  DEMO_PASSWORDS,
  getReportSharingBlockReason,
  getReportTierLabel,
  getSafePatientRef,
  getUnlockBlockReason,
  type LedgerEntry,
  LedgerEventType,
  makeId,
  PATIENT_BY_ID,
  PATIENTS,
  type Report,
  SEEDED_REPORTS,
  settleReportUnlock,
  snapshotToString,
  syncReportSharedCounts,
  syncSeedClinics,
  syncSeedReports,
  toRecordById,
  type UnlockedReport,
  unlockedKey,
  type ViewReportResult,
  VIEW_COST,
} from './domain';
import {
  AppShell,
  CreateReportTab,
  LeaderboardTab,
  LedgerTab,
  LoginScreen,
  SettingsTab,
  ViewReportsTab,
  WalkthroughTab,
} from './ui';
import {
  canUseSupabaseSnapshotStore,
  loadAppSnapshot,
  saveAppSnapshot,
} from './persistence';

const SUPABASE_SAVE_DEBOUNCE_MS = 300;
const ACTIVE_TAB_DEFAULT: ActiveTab = 'walkthrough';

function App() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>(buildInitialClinics);
  const [reports, setReports] = useState<Report[]>(() => [...SEEDED_REPORTS]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [unlockedReports, setUnlockedReports] = useState<UnlockedReport[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>(ACTIVE_TAB_DEFAULT);
  const [hasHydratedStore, setHasHydratedStore] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
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
          const syncedReports = syncSeedReports(snapshot.reports);
          const syncedClinics = syncSeedClinics(snapshot.clinics);

          lastSavedSnapshotRef.current = snapshotToString(snapshot);
          setClinics(syncReportSharedCounts(syncedClinics, syncedReports));
          setReports(syncedReports);
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

  const clinicById = useMemo(() => toRecordById(clinics), [clinics]);
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
      setLoginError('Unknown clinic username');
      return;
    }

    const expectedPassword = DEMO_PASSWORDS[match.username];
    if (!expectedPassword || password !== expectedPassword) {
      setLoginError('Incorrect password');
      return;
    }

    setLoginError(null);
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

  const handleCreateReport = (input: CreateReportInput): CreateReportResult => {
    if (!currentUser) {
      return {
        ok: false,
        message: 'Sign in before saving a report.',
      };
    }

    const patient = PATIENT_BY_ID[input.patientId];
    if (!patient) {
      return {
        ok: false,
        message: 'Patient record could not be found.',
      };
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
      return {
        ok: true,
        reportId: report.id,
        message: 'Report saved and listed in the Collective.',
      };
    }

    addLedgerEntry(
      LedgerEventType.BLOCKED,
      `${currentUser.name} saved a ${getReportTierLabel(report)} for ${getSafePatientRef(patient.id)}. Network listing blocked: ${sharingBlockReason}`,
    );

    return {
      ok: true,
      reportId: report.id,
      message: `Report saved locally. Network listing blocked: ${sharingBlockReason}.`,
    };
  };

  const handleViewReport = (report: Report): ViewReportResult => {
    if (!currentUser) {
      return {
        ok: false,
        message: 'Sign in before unlocking network history.',
      };
    }

    if (unlockedSet.has(unlockedKey(currentUser.id, report.id))) {
      return {
        ok: true,
        message: 'Report already unlocked.',
      };
    }

    const blockReason = getUnlockBlockReason(currentUser, report, PATIENT_BY_ID, clinicById);
    if (blockReason) {
      addLedgerEntry(
        LedgerEventType.BLOCKED,
        `${currentUser.name} could not unlock ${getSafePatientRef(report.patientId)}: ${blockReason}`,
      );
      return {
        ok: false,
        message: blockReason,
      };
    }

    const settlement = settleReportUnlock(clinics, currentUser.id, report.authorClinicId, false);
    if (!settlement.charged) {
      addLedgerEntry(
        LedgerEventType.BLOCKED,
        `${currentUser.name} could not unlock ${getSafePatientRef(report.patientId)}: credit transfer could not be completed`,
      );
      return {
        ok: false,
        message: 'Credit transfer could not be completed.',
      };
    }

    setClinics(settlement.clinics);
    addUnlockedReports([{ viewerClinicId: currentUser.id, reportId: report.id }]);

    addLedgerEntry(LedgerEventType.VIEW, `${currentUser.name} unlocked ${getReportTierLabel(report)} for ${getSafePatientRef(report.patientId)}`);
    addLedgerEntry(
      LedgerEventType.TRANSFER,
      `TRANSFER: -${VIEW_COST} from ${currentUser.name} -> +${VIEW_COST} to ${ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}`,
    );

    return {
      ok: true,
      message: `Unlocked report. ${VIEW_COST} credits transferred to ${ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'the author'}.`,
    };
  };

  if (!currentUser) {
    return <LoginScreen clinics={clinics} onLogin={handleLogin} loginError={loginError} />;
  }

  return (
    <AppShell
      currentUser={currentUser}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
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
    </AppShell>
  );
}

export default App;
