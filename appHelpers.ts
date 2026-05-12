import type { AppSnapshot, ContinuityCapsule, Report } from './types';

const CAPSULE_LABELS: Record<keyof ContinuityCapsule, string> = {
  status: 'Status',
  interventions: 'Interventions',
  risks: 'Risks',
  nextStep: 'Next step',
};

const CAPSULE_FIELDS: Array<keyof ContinuityCapsule> = [
  'status',
  'interventions',
  'risks',
  'nextStep',
];

export function snapshotToString(snapshot: AppSnapshot): string {
  return JSON.stringify(snapshot);
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function unlockedKey(viewerClinicId: string, reportId: string): string {
  return `${viewerClinicId}:${reportId}`;
}

export function getSafePatientRef(patientId: string): string {
  return `Patient Record ${patientId.toUpperCase()}`;
}

export function getReportTypeLabel(report: Report): string {
  return report.reportType?.trim() || 'Clinical Note';
}

export function formatReportVisitDate(report: Report): string {
  if (report.visitDate) {
    const parsedDate = new Date(`${report.visitDate}T00:00:00`);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
  }

  return new Date(report.timestamp).toLocaleDateString();
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function getOptInRate<T extends { optedIn: boolean }>(clinics: readonly T[]): number {
  if (clinics.length === 0) {
    return 0;
  }

  return clinics.filter((clinic) => clinic.optedIn).length / clinics.length;
}

export function getCapsuleEntries(capsule: ContinuityCapsule): Array<[string, string]> {
  return CAPSULE_FIELDS.map((field) => [CAPSULE_LABELS[field], capsule[field]]);
}
