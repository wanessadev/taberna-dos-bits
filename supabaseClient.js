const SUPABASE_URL = "https://nchyjywjupsafqyiesrg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bMwb02DdNnFwRD2D85K7mw_5BHHNO3r";

if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else if (!window.supabase) {
  console.error("Supabase library not found. The CDN script may have failed to load.");
}
