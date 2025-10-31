import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pstoxizwwgbpwrcdknto.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzdG94aXp3d2dicHdyY2RrbnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjM2NDIsImV4cCI6MjA3NzQzOTY0Mn0.r9quzinVCyRvEv4PCZzELA4_xawt47H4Wa6ACbi0j4M";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
