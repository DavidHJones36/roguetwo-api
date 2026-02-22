import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PB_KEY = process.env.SUPABASE_PB_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PB_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

/** Anon client – used only for verifying JWT tokens via auth.getUser(token) */
export const supabaseAuth: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PB_KEY,
);

/** Service-role client – bypasses RLS, used for all database operations */
export const db: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);
