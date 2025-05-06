import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Debugging output
console.log('[Supabase] Initializing with:', {
  url: supabaseUrl,
  key: supabaseKey?.slice(0, 5) + '...' // Shows first 5 chars of key
});

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});