import type { ContinuityCapsule, ReportTier } from './types';

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
