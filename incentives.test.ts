import { describe, expect, it } from 'vitest';
import { INITIAL_CREDITS, VIEW_COST } from './constants';
import {
  getSharedReportPayload,
  getUnlockBlockReason,
  settleReportUnlock,
} from './incentives';
import { isReportSharedToNetwork, toRecordById } from './sharing';
import type { Clinic, Patient, Report } from './types';

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
