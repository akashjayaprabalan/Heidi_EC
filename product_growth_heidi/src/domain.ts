import { SEED_REPORT_ROWS } from './seedData';

export type ReportTier = 'Private' | 'Capsule' | 'Summary' | 'Full';

export interface ContinuityCapsule {
  status: string;
  interventions: string;
  risks: string;
  nextStep: string;
}

export interface Clinic {
  id: string;
  name: string;
  username: string;
  optedIn: boolean;
  credits: number;
  reportsShared: number;
  reportsViewed: number;
}

export interface Patient {
  id: string;
  name: string;
  homeClinicId: string;
  consent: boolean;
}

export interface Report {
  id: string;
  patientId: string;
  authorClinicId: string;
  tier: ReportTier;
  notes: string;
  capsule?: ContinuityCapsule;
  summary?: string;
  reportType?: string;
  visitDate?: string;
  timestamp: number;
}

export interface UnlockedReport {
  viewerClinicId: string;
  reportId: string;
}

export enum LedgerEventType {
  LOGIN = 'LOGIN',
  OPT = 'OPT',
  SHARE = 'SHARE',
  VIEW = 'VIEW',
  TRANSFER = 'TRANSFER',
  BLOCKED = 'BLOCKED',
  CONSENT = 'CONSENT'
}

export interface LedgerEntry {
  id: string;
  timestamp: number;
  type: LedgerEventType;
  message: string;
}

export interface AppSnapshot {
  clinics: Clinic[];
  reports: Report[];
  ledger: LedgerEntry[];
  unlockedReports: UnlockedReport[];
}

export type ActiveTab = 'walkthrough' | 'settings' | 'create' | 'view' | 'leaderboard' | 'ledger';

export type IconName = 'compass' | 'settings' | 'plus' | 'search' | 'trending-up' | 'file-text' | 'lock';

export type CreateReportInput = {
  patientId: string;
  tier: ReportTier;
  notes: string;
  capsule: ContinuityCapsule;
  reportType: string;
  visitDate: string;
};

export type CreateReportResult = {
  ok: boolean;
  reportId?: string;
  message: string;
};

export type ViewReportResult = {
  ok: boolean;
  message: string;
};

export type SharedReportPayload = {
  reportId: string;
  patientId: string;
  authorClinicId: string;
  tier: Report['tier'];
  capsule: ContinuityCapsule;
  reportType: string;
  visitDate?: string;
  fullTreatmentDetail?: string;
};

export type UnlockSettlement = {
  clinics: Clinic[];
  charged: boolean;
};

export type LeaderboardRow = {
  clinic: Clinic;
  creditsEarned: number;
  creditsUsed: number;
  remainingCredits: number;
  accessRunway: number;
  contributionScore: number;
};

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

export const INITIAL_CREDITS = 50;
export const VIEW_COST = 10;

export const SEED_CLINICS: Clinic[] = [
  { id: 'c1', name: 'Harbour Physio', username: 'harbour', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c2', name: 'Peak Performance', username: 'peak', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c3', name: 'City Sports Rehab', username: 'city', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c4', name: 'Northside Physio', username: 'north', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
  { id: 'c5', name: 'Bayside Movement', username: 'bayside', optedIn: true, credits: INITIAL_CREDITS, reportsShared: 0, reportsViewed: 0 },
];

export const SEED_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Sam Lee', homeClinicId: 'c1', consent: true },
  { id: 'p2', name: 'Maya Patel', homeClinicId: 'c1', consent: true },
  { id: 'p3', name: 'Jordan Kim', homeClinicId: 'c1', consent: true },
  { id: 'p4', name: 'Ava Chen', homeClinicId: 'c1', consent: true },
  { id: 'p5', name: 'Noah Singh', homeClinicId: 'c3', consent: true },
  { id: 'p6', name: 'Priya Rao', homeClinicId: 'c3', consent: true },
  { id: 'p7', name: 'Ethan Park', homeClinicId: 'c3', consent: true },
  { id: 'p8', name: 'Sofia Gomez', homeClinicId: 'c4', consent: true },
  { id: 'p9', name: 'Liam Walker', homeClinicId: 'c4', consent: true },
  { id: 'p10', name: 'Zara Ali', homeClinicId: 'c2', consent: true },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  harbour: 'harbour123',
  peak: 'peak123',
  city: 'city123',
  north: 'north123',
  bayside: 'bayside123',
};

const SOURCE_CLINIC_ID_BY_NAME: Record<string, string> = {
  'Harbour Physio (Me)': 'c1',
  'Peak Performance': 'c2',
  'City Sports Rehab': 'c3',
  'Northside Physio': 'c4',
  'Bayside Movement': 'c5',
};

const PATIENT_ID_BY_NAME = SEED_PATIENTS.reduce<Record<string, string>>((acc, patient) => {
  acc[patient.name] = patient.id;
  return acc;
}, {});

const REPORT_SECTION_LABELS = 'Presenting complaint|Subjective|Objective|Assessment|Treatment provided|Plan';

function getSourceClinicId(clinicName: string): string {
  const clinicId = SOURCE_CLINIC_ID_BY_NAME[clinicName];
  if (!clinicId) {
    throw new Error(`Unknown seed clinic: ${clinicName}`);
  }

  return clinicId;
}

function getPatientId(patientName: string): string {
  const patientId = PATIENT_ID_BY_NAME[patientName];
  if (!patientId) {
    throw new Error(`Unknown seed patient: ${patientName}`);
  }

  return patientId;
}

function extractReportSection(reportBody: string, section: string): string {
  const match = reportBody.match(new RegExp(`${section}:\\s*([\\s\\S]*?)(?=\\n(?:${REPORT_SECTION_LABELS}):|$)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function buildSeedCapsule(reportBody: string, summary: string): ContinuityCapsule {
  return {
    status: summary,
    interventions: extractReportSection(reportBody, 'Treatment provided') || 'See full report for treatment details.',
    risks: extractReportSection(reportBody, 'Assessment') || 'No network-visible clinical watch-outs recorded.',
    nextStep: extractReportSection(reportBody, 'Plan') || 'Continue care using the shared report context.',
  };
}

function getVisitTimestamp(visitDate: string): number {
  const timestamp = new Date(`${visitDate}T12:00:00`).getTime();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

export const SEEDED_REPORTS: Report[] = SEED_REPORT_ROWS.map((row) => ({
  id: `r${row.reportNumber}`,
  patientId: getPatientId(row.patient),
  authorClinicId: getSourceClinicId(row.clinic),
  tier: 'Full',
  notes: row.reportBody,
  capsule: buildSeedCapsule(row.reportBody, row.summary),
  summary: row.summary,
  reportType: row.reportType,
  visitDate: row.date,
  timestamp: getVisitTimestamp(row.date),
}));

export const PATIENTS = SEED_PATIENTS;
export const PATIENT_BY_ID = toRecordById(PATIENTS);
export const SEED_CLINIC_BY_ID = toRecordById(SEED_CLINICS);
export const ANONYMIZED_LABEL_BY_CLINIC_ID = SEED_CLINICS.reduce<Record<string, string>>((acc, clinic, index) => {
  acc[clinic.id] = `Contributor #${index + 1}`;
  return acc;
}, {});

export function toRecordById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

export function buildInitialClinics(): Clinic[] {
  return syncReportSharedCounts(SEED_CLINICS, SEEDED_REPORTS);
}

export function syncReportSharedCounts(clinics: readonly Clinic[], reports: readonly Report[]): Clinic[] {
  const clinicById = toRecordById(clinics);
  const sharedCounts = reports.reduce<Record<string, number>>((acc, report) => {
    if (isReportSharedToNetwork(report, PATIENT_BY_ID, clinicById)) {
      acc[report.authorClinicId] = (acc[report.authorClinicId] ?? 0) + 1;
    }

    return acc;
  }, {});

  return clinics.map((clinic) => ({
    ...clinic,
    reportsShared: sharedCounts[clinic.id] ?? 0,
  }));
}

export function syncSeedClinics(clinics: readonly Clinic[]): Clinic[] {
  const clinicById = toRecordById(clinics);

  return SEED_CLINICS.map((seedClinic) => {
    const existingClinic = clinicById[seedClinic.id];

    return {
      ...seedClinic,
      credits: existingClinic?.credits ?? seedClinic.credits,
      reportsViewed: existingClinic?.reportsViewed ?? seedClinic.reportsViewed,
    };
  });
}

export function syncSeedReports(reports: readonly Report[]): Report[] {
  const seedReportIds = new Set(SEEDED_REPORTS.map((report) => report.id));
  const customReports = reports.filter((report) => !seedReportIds.has(report.id));

  return [...SEEDED_REPORTS, ...customReports];
}

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

export function getPatientHistoryReports(
  reports: readonly Report[],
  patientId: string,
  patientById: Record<string, Patient>,
  clinicById: Record<string, Clinic>,
): Report[] {
  return reports
    .filter(
      (report) =>
        report.patientId === patientId &&
        isReportSharedToNetwork(report, patientById, clinicById),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getReportCapsule(report: Report): ContinuityCapsule {
  if (report.capsule) {
    return report.capsule;
  }

  const fallback = report.summary?.trim() || report.notes.trim();

  return {
    status: fallback || 'Clinical status captured locally.',
    interventions: 'See continuity summary.',
    risks: 'No network-visible red flags recorded.',
    nextStep: 'Continue care using the capsule and request clarification if needed.',
  };
}

export function getReportTierLabel(report: Report): string {
  if (report.tier === 'Full') {
    return 'Full Detail';
  }

  if (report.tier === 'Private') {
    return 'Private';
  }

  return 'Continuity Capsule';
}

export function getSharedReportPayload(report: Report): SharedReportPayload {
  const payload: SharedReportPayload = {
    reportId: report.id,
    patientId: report.patientId,
    authorClinicId: report.authorClinicId,
    tier: report.tier,
    capsule: getReportCapsule(report),
    reportType: report.reportType?.trim() || 'Clinical Note',
  };

  if (report.visitDate) {
    payload.visitDate = report.visitDate;
  }

  if (report.tier === 'Full') {
    payload.fullTreatmentDetail = report.notes;
  }

  return payload;
}

export function getUnlockBlockReason(
  viewer: Clinic | undefined,
  report: Report,
  patientById: Record<string, Patient>,
  clinicById: Record<string, Clinic>,
): string | null {
  if (!viewer) {
    return 'Viewer Clinic Missing';
  }

  if (!viewer.optedIn) {
    return 'Opt in to unlock network history';
  }

  if (viewer.credits < VIEW_COST) {
    return `Need ${VIEW_COST} credits to unlock`;
  }

  if (report.authorClinicId === viewer.id) {
    return 'Own clinic report';
  }

  if (!isReportSharedToNetwork(report, patientById, clinicById)) {
    return 'Author opted out, patient consent missing, or report is private';
  }

  return null;
}

export function settleReportUnlock(
  clinics: readonly Clinic[],
  viewerClinicId: string,
  authorClinicId: string,
  alreadyUnlocked: boolean,
): UnlockSettlement {
  if (alreadyUnlocked || viewerClinicId === authorClinicId) {
    return {
      clinics: [...clinics],
      charged: false,
    };
  }

  const viewer = clinics.find((clinic) => clinic.id === viewerClinicId);
  const author = clinics.find((clinic) => clinic.id === authorClinicId);

  if (!viewer || !author || !viewer.optedIn || !author.optedIn || viewer.credits < VIEW_COST) {
    return {
      clinics: [...clinics],
      charged: false,
    };
  }

  return {
    charged: true,
    clinics: clinics.map((clinic) => {
      if (clinic.id === viewerClinicId) {
        return {
          ...clinic,
          credits: clinic.credits - VIEW_COST,
          reportsViewed: (clinic.reportsViewed || 0) + 1,
        };
      }

      if (clinic.id === authorClinicId) {
        return {
          ...clinic,
          credits: clinic.credits + VIEW_COST,
        };
      }

      return clinic;
    }),
  };
}

export function getAccessRunway(credits: number): number {
  return Math.floor(Math.max(0, credits) / VIEW_COST);
}

export function getCreditsEarned(clinic: Clinic): number {
  const creditsUsed = Math.max(0, (clinic.reportsViewed || 0) * VIEW_COST);
  return Math.max(0, clinic.credits - INITIAL_CREDITS + creditsUsed);
}

export function getContributionScore(clinic: Clinic): number {
  const optInBonus = clinic.optedIn ? 20 : 0;
  return optInBonus + getCreditsEarned(clinic) + Math.max(0, clinic.reportsShared || 0) * 8;
}

export function buildLeaderboardRows(clinics: readonly Clinic[]): LeaderboardRow[] {
  return clinics
    .map((clinic) => {
      const creditsUsed = Math.max(0, (clinic.reportsViewed || 0) * VIEW_COST);
      const creditsEarned = getCreditsEarned(clinic);

      return {
        clinic,
        creditsEarned,
        creditsUsed,
        remainingCredits: clinic.credits,
        accessRunway: getAccessRunway(clinic.credits),
        contributionScore: getContributionScore(clinic),
      };
    })
    .sort(
      (a, b) =>
        b.contributionScore - a.contributionScore ||
        b.creditsEarned - a.creditsEarned ||
        b.remainingCredits - a.remainingCredits ||
        a.clinic.name.localeCompare(b.clinic.name),
    );
}
