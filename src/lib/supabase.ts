import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://cdffbcgeyzwpdupbrewe.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VdceueM1PF_P02IwsKuyMw_5z2lImCx';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

