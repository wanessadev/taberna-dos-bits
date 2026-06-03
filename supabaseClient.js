const SUPABASE_URL = "https://nchyjywjupsafqyiesrg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bMwb02DdNnFwRD2D85K7mw_5BHHNO3r";

if (window.supabase && typeof window.supabase.createClient === "function") {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  console.log("Supabase conectado correctamente");
} else {
  console.error("Supabase no cargó. Revise el script CDN en el HTML.");
}
