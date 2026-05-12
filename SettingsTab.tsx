import type { Clinic } from './types';

type SettingsTabProps = {
  currentUser: Clinic;
  onToggleOptIn: () => void;
};

export function SettingsTab({ currentUser, onToggleOptIn }: SettingsTabProps) {
  return (
    <div className="p-6 md:p-8 lg:p-10 w-full min-h-[calc(100vh-88px)] flex flex-col">
      <h2 className="text-3xl lg:text-4xl font-bold mb-8">Clinic Settings</h2>

      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border shadow-sm p-5 md:p-6 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h3 className="font-semibold text-xl md:text-2xl lg:text-3xl leading-tight">Participation Status</h3>
            <p className="mt-2 text-base md:text-lg text-slate-500 leading-tight">Opt in to unlock history, earn from useful capsules, and stay visible in the market.</p>
          </div>

          <div className="space-y-5 lg:space-y-6 text-base md:text-lg lg:text-xl text-slate-600 leading-snug">
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">1</div>
              <p>View costs <strong>10 credits</strong>, which are transferred directly to the report&apos;s author clinic.</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">2</div>
              <p>Opted-out clinics cannot unlock history, cannot earn credits, and their shared inventory disappears from search.</p>
            </div>
            <div className="flex gap-3 lg:gap-4 items-start">
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-base lg:text-lg font-bold">3</div>
              <p>Judgement-safe: The default shared object is a <strong>Continuity Capsule</strong>; full notes stay local unless explicitly shared.</p>
            </div>
          </div>
        </div>

        {!currentUser.optedIn && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            <strong>Market Off:</strong> While opted out, you cannot view network reports, earn from competitor unlocks, or keep your reports visible in the Collective.
          </div>
        )}

        <div className="mt-auto pt-8 flex justify-center">
          <button
            onClick={onToggleOptIn}
            className={`px-10 lg:px-14 py-4 lg:py-5 rounded-full font-bold text-xl lg:text-2xl tracking-wide transition-all ${
              currentUser.optedIn
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {currentUser.optedIn ? 'OPTED IN' : 'OPTED OUT'}
          </button>
        </div>
      </div>
    </div>
  );
}
