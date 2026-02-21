
export type ReportTier = 'Private' | 'Summary' | 'Full';

export interface Clinic {
  id: string;
  name: string;
  username: string;
  password?: string;
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
