import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bepavczocyvaegkfxtvd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcGF2Y3pvY3l2YWVna2Z4dHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMTg1NTcsImV4cCI6MjEwMDY5NDU1N30.-i3uVvZyjtKfcyzRCiTX4E3UbCkaDin94T_BQeXeBro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
