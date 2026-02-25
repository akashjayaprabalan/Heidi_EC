import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const SUPABASE_SNAPSHOT_ID = import.meta.env.VITE_SUPABASE_SNAPSHOT_ID?.trim() || 'kinetic-demo';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false },
    })
  : null;
