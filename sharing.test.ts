import { describe, expect, it } from 'vitest';
import { getReportSharingBlockReason, isReportSharedToNetwork, toRecordById } from './sharing';
import type { Clinic, Patient, Report } from './types';

const clinics: Clinic[] = [
  { id: 'c1', name: 'Harbour Physio', username: 'harbour', optedIn: true, credits: 50, reportsShared: 0, reportsViewed: 0 },
  { id: 'c2', name: 'City Sports Rehab', username: 'city', optedIn: false, credits: 50, reportsShared: 0, reportsViewed: 0 },
];

const patients: Patient[] = [
  { id: 'p1', name: 'Sam Lee', homeClinicId: 'c1', consent: true },
  { id: 'p2', name: 'Noah Singh', homeClinicId: 'c2', consent: false },
];

const clinicById = toRecordById(clinics);
const patientById = toRecordById(patients);

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'r1',
    patientId: 'p1',
    authorClinicId: 'c1',
    tier: 'Summary',
    notes: 'Progress note',
    timestamp: 1,
    ...overrides,
  };
}

describe('sharing rules', () => {
  it('allows opted-in clinics to share consented non-private reports', () => {
    expect(isReportSharedToNetwork(makeReport(), patientById, clinicById)).toBe(true);
  });

  it('blocks reports from opted-out author clinics', () => {
    expect(isReportSharedToNetwork(makeReport({ authorClinicId: 'c2' }), patientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c2, patientById.p1, 'Summary')).toBe('Clinic Opted Out');
  });

  it('blocks reports for patients who have not consented', () => {
    expect(isReportSharedToNetwork(makeReport({ patientId: 'p2' }), patientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c1, patientById.p2, 'Summary')).toBe('No Patient Consent');
  });

  it('blocks private reports even when the author and patient are eligible', () => {
    expect(isReportSharedToNetwork(makeReport({ tier: 'Private' }), patientById, clinicById)).toBe(false);
    expect(getReportSharingBlockReason(clinicById.c1, patientById.p1, 'Private')).toBe('Private Tier Selected');
  });
});
