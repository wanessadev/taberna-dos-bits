const SUPABASE_URL = "https://nchyjywjupsafqyiesrg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bMwb02DdNnFwRD2D85K7mw_5BHHNO3r";

// Salva o cliente no window com nome distinto, sem sobrescrever o SDK
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
