import { describe, expect, it } from 'vitest';
import {
  getReportSharingBlockReason,
  getSharedReportPayload,
  getUnlockBlockReason,
  INITIAL_CREDITS,
  isReportSharedToNetwork,
  PATIENT_BY_ID,
  SEEDED_REPORTS,
  SEED_CLINICS,
  SEED_PATIENTS,
  settleReportUnlock,
  syncReportSharedCounts,
  syncSeedClinics,
  syncSeedReports,
  toRecordById,
  VIEW_COST,
} from './domain';
import type { Clinic, Patient, Report } from './domain';

const clinics: Clinic[] = [
  { id: 'c1', name: 'Harbour Physio', username: 'harbour', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 1, reportsViewed: 0 },
  { id: 'c2', name: 'Peak Performance', username: 'peak', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 1, reportsViewed: 0 },
  { id: 'c3', name: 'City Sports Rehab', username: 'city', optedIn: false, credits: INITIAL_CREDITS, reportsShared: 1, reportsViewed: 0 },
];

const patients: Patient[] = [
  { id: 'p1', name: 'Sam Lee', homeClinicId: 'c1', consent: true },
  { id: 'p2', name: 'No Consent', homeClinicId: 'c2', consent: false },
];

const patientById = toRecordById(patients);

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    patientId: 'p1',
    authorClinicId: 'c1',
    tier: 'Capsule',
    notes: 'Private local clinician reasoning.',
    capsule: {
      status: 'Status shared',
      interventions: 'Intervention shared',
      risks: 'Risk shared',
      nextStep: 'Next step shared',
    },
    timestamp: 1,
    ...overrides,
  };
}

describe('incentive mechanics', () => {
  it('blocks opted-out viewers from unlocking history', () => {
    const clinicById = toRecordById(clinics);
    const report = makeReport({ authorClinicId: 'c1' });

    expect(getUnlockBlockReason(clinicById.c3, report, patientById, clinicById)).toBe('Opt in to unlock network history');
  });

  it('does not let opted-out authors earn because their reports leave search', () => {
    const clinicById = toRecordById(clinics);
    const optedOutAuthorReport = makeReport({ authorClinicId: 'c3' });

    expect(isReportSharedToNetwork(optedOutAuthorReport, patientById, clinicById)).toBe(false);

    const settlement = settleReportUnlock(clinics, 'c2', 'c3', false);
    expect(settlement.charged).toBe(false);
    expect(settlement.clinics.find((clinic) => clinic.id === 'c3')?.credits).toBe(INITIAL_CREDITS);
  });

  it('transfers credits exactly once for an unlock', () => {
    const first = settleReportUnlock(clinics, 'c2', 'c1', false);
    expect(first.charged).toBe(true);
    expect(first.clinics.find((clinic) => clinic.id === 'c2')?.credits).toBe(INITIAL_CREDITS - VIEW_COST);
    expect(first.clinics.find((clinic) => clinic.id === 'c1')?.credits).toBe(INITIAL_CREDITS + VIEW_COST);

    const second = settleReportUnlock(first.clinics, 'c2', 'c1', true);
    expect(second.charged).toBe(false);
    expect(second.clinics.find((clinic) => clinic.id === 'c2')?.credits).toBe(INITIAL_CREDITS - VIEW_COST);
    expect(second.clinics.find((clinic) => clinic.id === 'c1')?.credits).toBe(INITIAL_CREDITS + VIEW_COST);
  });

  it('keeps private notes out of default capsule payloads', () => {
    const payload = getSharedReportPayload(makeReport());

    expect(payload.capsule.status).toBe('Status shared');
    expect(payload.fullTreatmentDetail).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('Private local clinician reasoning');
  });

  it('blocks no-consent patients and private reports from network sharing', () => {
    const clinicById = toRecordById(clinics);

    expect(isReportSharedToNetwork(makeReport({ patientId: 'p2' }), patientById, clinicById)).toBe(false);
    expect(isReportSharedToNetwork(makeReport({ tier: 'Private' }), patientById, clinicById)).toBe(false);
  });
});

describe('sharing rules', () => {
  const sharingClinics: Clinic[] = [
    { id: 'c1', name: 'Harbour Physio', username: 'harbour', optedIn: true, credits: 50, reportsShared: 0, reportsViewed: 0 },
    { id: 'c2', name: 'City Sports Rehab', username: 'city', optedIn: false, credits: 50, reportsShared: 0, reportsViewed: 0 },
  ];

  const sharingPatients: Patient[] = [
    { id: 'p1', name: 'Sam Lee', homeClinicId: 'c1', consent: true },
    { id: 'p2', name: 'Noah Singh', homeClinicId: 'c2', consent: false },
  ];

  const clinicById = toRecordById(sharingClinics);
  const sharingPatientById = toRecordById(sharingPatients);

  it('allows opted-in clinics to share consented non-private reports', () => {
    expect(isReportSharedToNetwork(makeReport(), sharingPatientById, clinicById)).toBe(true);
  });

  it('blocks reports from opted-out author clinics', () => {
    expect(isReportSharedToNetwork(makeReport({ authorClinicId: 'c2' }), sharingPatientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c2, sharingPatientById.p1, 'Capsule')).toBe('Clinic Opted Out');
  });

  it('blocks reports for patients who have not consented', () => {
    expect(isReportSharedToNetwork(makeReport({ patientId: 'p2' }), sharingPatientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c1, sharingPatientById.p2, 'Capsule')).toBe('No Patient Consent');
  });

  it('blocks private reports even when the author and patient are eligible', () => {
    expect(isReportSharedToNetwork(makeReport({ tier: 'Private' }), sharingPatientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c1, sharingPatientById.p1, 'Private')).toBe('Private Tier Selected');
  });
});

describe('seed data coverage', () => {
  const seedClinicById = toRecordById(SEED_CLINICS);

  it('imports all twenty original CSV reports as full-detail records', () => {
    expect(SEEDED_REPORTS).toHaveLength(20);
    expect(SEEDED_REPORTS.every((report) => report.tier === 'Full')).toBe(true);
    expect(SEEDED_REPORTS.map((report) => report.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `r${index + 1}`),
    );
  });

  it('uses the initial assessment clinic as each patient home clinic', () => {
    expect(SEED_PATIENTS.find((patient) => patient.name === 'Jordan Kim')?.homeClinicId).toBe('c1');
    expect(SEED_PATIENTS.find((patient) => patient.name === 'Liam Walker')?.homeClinicId).toBe('c4');
    expect(SEED_PATIENTS.find((patient) => patient.name === 'Zara Ali')?.homeClinicId).toBe('c2');
    expect(SEED_PATIENTS.every((patient) => patient.consent)).toBe(true);
  });

  it('includes an external shared report for Liam Walker', () => {
    const liamReports = SEEDED_REPORTS.filter((report) => report.patientId === 'p9');

    expect(liamReports).toHaveLength(2);
    expect(
      liamReports.some(
        (report) =>
          report.authorClinicId !== 'c1' &&
          isReportSharedToNetwork(report, PATIENT_BY_ID, seedClinicById),
      ),
    ).toBe(true);
  });

  it('replaces stale seeded reports in persisted snapshots while keeping custom reports', () => {
    const customReport = makeReport({ id: 'custom-report', reportType: 'Custom note' });
    const syncedReports = syncSeedReports([
      makeReport({ id: 'r1', notes: 'stale seed note', reportType: 'Stale note' }),
      customReport,
    ]);

    expect(syncedReports).toHaveLength(21);
    expect(syncedReports.find((report) => report.id === 'r1')?.notes).toBe(SEEDED_REPORTS[0]?.notes);
    expect(syncedReports.find((report) => report.id === 'custom-report')).toEqual(customReport);
  });

  it('updates persisted clinic roster settings from the current seeds', () => {
    const syncedClinics = syncSeedClinics([
      { id: 'c3', name: 'Old City', username: 'old-city', optedIn: false, credits: 35, reportsShared: 99, reportsViewed: 2 },
    ]);
    const city = syncedClinics.find((clinic) => clinic.id === 'c3');

    expect(city?.name).toBe('City Sports Rehab');
    expect(city?.username).toBe('city');
    expect(city?.optedIn).toBe(true);
    expect(city?.credits).toBe(35);
    expect(city?.reportsViewed).toBe(2);
  });

  it('syncs clinic shared counts from the current report set', () => {
    const clinicsWithCounts = syncReportSharedCounts(SEED_CLINICS, SEEDED_REPORTS);

    expect(clinicsWithCounts.map((clinic) => clinic.reportsShared)).toEqual([4, 4, 4, 4, 4]);
  });
});
