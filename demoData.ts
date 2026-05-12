import { SEED_CLINICS, SEED_PATIENTS } from './constants';
import { isReportSharedToNetwork, toRecordById } from './sharing';
import type { Clinic, Report } from './types';

export const DEMO_PASSWORDS: Record<string, string> = {
  harbour: 'harbour123',
  peak: 'peak123',
  city: 'city123',
  north: 'north123',
  bayside: 'bayside123',
};

export const SEEDED_REPORTS: Report[] = (() => {
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

export const PATIENTS = SEED_PATIENTS;
export const PATIENT_BY_ID = toRecordById(PATIENTS);
export const SEED_CLINIC_BY_ID = toRecordById(SEED_CLINICS);
export const ANONYMIZED_LABEL_BY_CLINIC_ID = SEED_CLINICS.reduce<Record<string, string>>((acc, clinic, index) => {
  acc[clinic.id] = `Contributor #${index + 1}`;
  return acc;
}, {});

export function buildInitialClinics(): Clinic[] {
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
