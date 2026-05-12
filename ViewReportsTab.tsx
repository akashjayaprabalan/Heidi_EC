import { useMemo, useState } from 'react';
import type { ViewReportResult } from './appTypes';
import {
  formatReportVisitDate,
  getCapsuleEntries,
  getReportTypeLabel,
  unlockedKey,
} from './appHelpers';
import { VIEW_COST } from './constants';
import { ANONYMIZED_LABEL_BY_CLINIC_ID } from './demoData';
import { Icon } from './Icon';
import {
  getReportTierLabel,
  getSharedReportPayload,
  getUnlockBlockReason,
} from './incentives';
import { isReportSharedToNetwork } from './sharing';
import type { Clinic, Patient, Report } from './types';

type ViewReportsTabProps = {
  currentUser: Clinic;
  reports: Report[];
  patients: Patient[];
  patientById: Record<string, Patient>;
  clinicById: Record<string, Clinic>;
  unlockedSet: Set<string>;
  onViewReport: (report: Report) => ViewReportResult;
};

export function ViewReportsTab({ currentUser, reports, patients, patientById, clinicById, unlockedSet, onViewReport }: ViewReportsTabProps) {
  const [searchPatientId, setSearchPatientId] = useState('');
  const [viewStatusByReportId, setViewStatusByReportId] = useState<Record<string, ViewReportResult>>({});

  const availableReports = useMemo(() => {
    if (!searchPatientId) {
      return [];
    }

    return reports.filter(
      (report) =>
        report.patientId === searchPatientId &&
        report.authorClinicId !== currentUser.id &&
        isReportSharedToNetwork(report, patientById, clinicById),
    );
  }, [searchPatientId, reports, patientById, clinicById, currentUser.id]);

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Request Patient History</h2>
      {!currentUser.optedIn && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-5 text-red-700 text-sm font-semibold">
          Opted-out clinics can search the market, but cannot unlock history or earn from their own reports until they opt in.
        </div>
      )}
      <div className="bg-white rounded-2xl border p-6 lg:p-8 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-end">
        <div className="flex-1">
          <label className="block text-base font-semibold mb-2">Search Patient</label>
          <select
            className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
          >
            <option value="">Select Patient to See Availability</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-slate-50 px-5 py-3 border rounded-xl text-base text-slate-500 whitespace-nowrap">
          {availableReports.length} External Reports Available
        </div>
      </div>

      <div className="space-y-8">
        {searchPatientId && availableReports.length === 0 && (
          <div className="text-center py-16 bg-white border rounded-2xl border-dashed">
            <p className="text-slate-400 text-lg">No external shared reports found for this patient.</p>
          </div>
        )}

        {availableReports.map((report) => {
          const isUnlocked = unlockedSet.has(unlockedKey(currentUser.id, report.id));
          const unlockBlockReason = getUnlockBlockReason(currentUser, report, patientById, clinicById);
          const sharedPayload = getSharedReportPayload(report);
          const viewStatus = viewStatusByReportId[report.id];

          return (
            <div key={report.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-5 lg:p-6 bg-slate-50 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base lg:text-lg text-slate-700">{ANONYMIZED_LABEL_BY_CLINIC_ID[report.authorClinicId] ?? 'Contributor'}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-sm text-slate-400">{formatReportVisitDate(report)}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-sm text-slate-400">{getReportTypeLabel(report)}</span>
                </div>
                <span className={`text-xs md:text-sm px-3 py-1.5 rounded-md font-bold uppercase ${
                  report.tier === 'Full' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {getReportTierLabel(report)} Available
                </span>
              </div>
              <div className="p-6 lg:p-8">
                {viewStatus && (
                  <div className={`mb-5 rounded-xl border p-4 text-sm font-semibold ${
                    viewStatus.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {viewStatus.message}
                  </div>
                )}

                {!isUnlocked ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Icon name="lock" />
                      <span className="text-base font-medium">Continuity Capsule Locked</span>
                    </div>
                    <button
                      disabled={unlockBlockReason !== null}
                      onClick={() => {
                        const result = onViewReport(report);
                        setViewStatusByReportId((prev) => ({ ...prev, [report.id]: result }));
                      }}
                      className={`px-10 py-4 rounded-xl text-base font-bold transition-all shadow-md ${
                        unlockBlockReason === null
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Unlock Report (Cost {VIEW_COST} Credits)
                    </button>
                    {unlockBlockReason && (
                      <p className="text-sm text-red-500 font-semibold text-center">{unlockBlockReason}</p>
                    )}
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">Full local notes hidden unless the author explicitly shared full detail</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Continuity Capsule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getCapsuleEntries(sharedPayload.capsule).map(([label, value]) => (
                          <div key={label} className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-slate-700 text-base leading-relaxed">
                            <div className="text-[11px] font-black uppercase tracking-wide text-blue-500 mb-1">{label}</div>
                            {value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {sharedPayload.fullTreatmentDetail && (
                      <div>
                        <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-widest">Explicitly Shared Full Treatment Detail</h4>
                        <div className="p-5 rounded-xl border bg-slate-50 text-slate-800 text-base leading-relaxed">
                          {sharedPayload.fullTreatmentDetail}
                        </div>
                      </div>
                    )}

                    {!sharedPayload.fullTreatmentDetail && (
                      <div className="p-5 rounded-xl border border-amber-100 bg-amber-50 text-amber-800 text-sm font-semibold">
                        Full clinical notes and private reasoning stayed inside the author clinic. Only the structured capsule entered the market.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Visit Date</div>
                        <div className="text-sm font-semibold text-slate-700">{formatReportVisitDate(report)}</div>
                      </div>
                      <div className="rounded-xl border bg-white p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Report Type</div>
                        <div className="text-sm font-semibold text-slate-700">{getReportTypeLabel(report)}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400 uppercase font-bold tracking-wide">
                      <span>Unlocked Content</span>
                      <span className="text-blue-500 italic">Judgement-safe: structured capsule, origin hidden.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
