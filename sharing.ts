import type { Clinic, Patient, Report, ReportTier } from './types';

export function toRecordById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export function getReportSharingBlockReason(
  author: Clinic | undefined,
  patient: Patient | undefined,
  tier: ReportTier,
): string | null {
  if (!author) {
    return 'Author Clinic Missing';
  }

  if (!author.optedIn) {
    return 'Clinic Opted Out';
  }

  if (!patient) {
    return 'Patient Record Missing';
  }

  if (!patient.consent) {
    return 'No Patient Consent';
  }

  if (tier === 'Private') {
    return 'Private Tier Selected';
  }

  return null;
}

export function isReportSharedToNetwork(
  report: Report,
  patientById: Record<string, Patient>,
  clinicById: Record<string, Clinic>,
): boolean {
  return getReportSharingBlockReason(
    clinicById[report.authorClinicId],
    patientById[report.patientId],
    report.tier,
  ) === null;
}
