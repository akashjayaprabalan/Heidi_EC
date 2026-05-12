import { FormEvent, useMemo, useState } from 'react';
import type { CreateReportInput, CreateReportResult } from './appTypes';
import {
  formatReportVisitDate,
  getCapsuleEntries,
  getReportTypeLabel,
} from './appHelpers';
import { getReportCapsule, getReportTierLabel } from './incentives';
import { getReportSharingBlockReason } from './sharing';
import type { Clinic, Patient, Report } from './types';

type CreateReportTabProps = {
  currentUser: Clinic;
  patients: Patient[];
  patientById: Record<string, Patient>;
  reports: Report[];
  onCreateReport: (input: CreateReportInput) => CreateReportResult;
};

export function CreateReportTab({ currentUser, patients, patientById, reports, onCreateReport }: CreateReportTabProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('Progress Note');
  const [notes, setNotes] = useState('');
  const [capsuleStatus, setCapsuleStatus] = useState('');
  const [capsuleInterventions, setCapsuleInterventions] = useState('');
  const [capsuleRisks, setCapsuleRisks] = useState('');
  const [capsuleNextStep, setCapsuleNextStep] = useState('');
  const [shareFullDetail, setShareFullDetail] = useState(false);
  const [selectedLocalReportId, setSelectedLocalReportId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<CreateReportResult | null>(null);

  const myReports = useMemo(
    () => reports.filter((report) => report.authorClinicId === currentUser.id),
    [reports, currentUser.id],
  );
  const selectedLocalReport = useMemo(
    () => myReports.find((report) => report.id === selectedLocalReportId) ?? null,
    [myReports, selectedLocalReportId],
  );

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !selectedPatientId ||
      !notes.trim() ||
      !capsuleStatus.trim() ||
      !capsuleInterventions.trim() ||
      !capsuleRisks.trim() ||
      !capsuleNextStep.trim()
    ) {
      setFormStatus({ ok: false, message: 'Complete every report and capsule field before saving.' });
      return;
    }

    const result = onCreateReport({
      patientId: selectedPatientId,
      tier: shareFullDetail ? 'Full' : 'Capsule',
      notes: notes.trim(),
      capsule: {
        status: capsuleStatus.trim(),
        interventions: capsuleInterventions.trim(),
        risks: capsuleRisks.trim(),
        nextStep: capsuleNextStep.trim(),
      },
      reportType: reportType.trim(),
      visitDate,
    });

    setFormStatus(result);

    if (!result.ok) {
      return;
    }

    setNotes('');
    setCapsuleStatus('');
    setCapsuleInterventions('');
    setCapsuleRisks('');
    setCapsuleNextStep('');
    setShareFullDetail(false);

    if (result.reportId) {
      setSelectedLocalReportId(result.reportId);
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
      <div>
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Record Visit</h2>
        <form onSubmit={handleSave} className="bg-white rounded-2xl border p-6 lg:p-8 shadow-sm space-y-5">
          {formStatus && (
            <div className={`rounded-xl border p-4 text-sm font-semibold ${
              formStatus.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              {formStatus.message}
            </div>
          )}

          <div>
            <label className="block text-base font-semibold mb-2">Patient</label>
            <select
              className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              required
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} {patient.homeClinicId === currentUser.id ? '(Owned)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Sharing Tier</label>
            <label className="flex items-start gap-3 p-4 border rounded-xl bg-blue-50 border-blue-100 cursor-pointer">
              <input
                type="checkbox"
                checked={shareFullDetail}
                onChange={(event) => setShareFullDetail(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm lg:text-base font-bold text-slate-800">
                  {shareFullDetail ? 'Share full detail after unlock' : 'Default: share Continuity Capsule only'}
                </span>
                <span className="block mt-1 text-xs lg:text-sm text-slate-500">
                  Full clinical notes stay local unless this is explicitly enabled.
                </span>
              </span>
            </label>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Report Details</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Report Type</label>
                <input
                  type="text"
                  className="w-full border rounded-xl p-3 lg:p-4 bg-slate-50 text-base"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  placeholder="e.g. Progress Note"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Full Report</label>
            <textarea
              className="w-full border rounded-xl p-3 lg:p-4 h-40 bg-slate-50 text-base"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Full clinical report details..."
              required
            />
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Continuity Capsule</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleStatus}
                onChange={(e) => setCapsuleStatus(e.target.value)}
                placeholder="Current status"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleInterventions}
                onChange={(e) => setCapsuleInterventions(e.target.value)}
                placeholder="What has been tried"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleRisks}
                onChange={(e) => setCapsuleRisks(e.target.value)}
                placeholder="Risks / watch-outs"
                required
              />
              <textarea
                className="w-full border rounded-xl p-3 lg:p-4 h-28 bg-slate-50 text-base"
                value={capsuleNextStep}
                onChange={(e) => setCapsuleNextStep(e.target.value)}
                placeholder="Recommended next step"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold text-base py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Save Report
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-slate-800">Clinic History</h2>
        <div className="space-y-5">
          <h3 className="text-sm lg:text-base font-bold uppercase text-slate-400 tracking-wider">My Local Reports</h3>
          {myReports.length === 0 ? (
            <p className="text-slate-500 italic text-base">No reports saved yet.</p>
          ) : (
            myReports.map((report) => {
              const patient = patientById[report.patientId];
              const sharingBlockReason = getReportSharingBlockReason(currentUser, patient, report.tier);
              const isShared = sharingBlockReason === null;
              const isSelected = selectedLocalReportId === report.id;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedLocalReportId(report.id)}
                  className={`w-full text-left bg-white border rounded-xl p-5 lg:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm transition-colors ${
                    isSelected ? 'border-blue-300 ring-2 ring-blue-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-lg text-slate-800">{patient?.name}</div>
                    <div className="text-sm text-slate-500">
                      {formatReportVisitDate(report)} &bull; {getReportTypeLabel(report)}
                    </div>
                    <div className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      report.tier === 'Private' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getReportTierLabel(report)}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase ${
                      isShared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`} title={sharingBlockReason ?? 'Shared with the Collective'}>
                      {isShared ? 'Shared' : 'Private'}
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-md font-bold uppercase bg-slate-100 text-slate-500">
                      {isSelected ? 'Viewing' : 'Click to View'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
          {selectedLocalReport && (
            <div className="bg-white border rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">
                    {patientById[selectedLocalReport.patientId]?.name ?? 'Patient'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {formatReportVisitDate(selectedLocalReport)} &bull; {getReportTypeLabel(selectedLocalReport)}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Saved {new Date(selectedLocalReport.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Continuity Capsule Shared To Network</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCapsuleEntries(getReportCapsule(selectedLocalReport)).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-slate-700 leading-relaxed">
                        <div className="text-[11px] font-black uppercase tracking-wide text-blue-500 mb-1">{label}</div>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Full Local Report</div>
                  <div className="rounded-xl border bg-slate-50 p-4 text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedLocalReport.notes}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
