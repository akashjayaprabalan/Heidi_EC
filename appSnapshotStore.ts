import { AppSnapshot } from './types';
import { SUPABASE_SNAPSHOT_ID, isSupabaseConfigured, supabase } from './supabaseClient';

const SNAPSHOT_TABLE = 'app_snapshots';

type SnapshotRow = {
  id: string;
  data: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAppSnapshot(value: unknown): value is AppSnapshot {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.clinics) &&
    Array.isArray(value.reports) &&
    Array.isArray(value.ledger) &&
    Array.isArray(value.unlockedReports)
  );
}

export function canUseSupabaseSnapshotStore(): boolean {
  return isSupabaseConfigured && Boolean(supabase);
}

export async function loadAppSnapshot(): Promise<AppSnapshot | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select('id,data')
    .eq('id', SUPABASE_SNAPSHOT_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const row = (data as SnapshotRow | null) ?? null;

  if (!row) {
    return null;
  }

  if (!isAppSnapshot(row.data)) {
    throw new Error('Supabase snapshot row is not a valid app snapshot');
  }

  return row.data;
}

export async function saveAppSnapshot(snapshot: AppSnapshot): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from(SNAPSHOT_TABLE).upsert(
    {
      id: SUPABASE_SNAPSHOT_ID,
      data: snapshot as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
}
