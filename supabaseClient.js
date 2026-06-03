const SUPABASE_URL = "https://nchyjywjupsafqyiesrg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bMwb02DdNnFwRD2D85K7mw_5BHHNO3r";

const supabaseLib = window.supabase;

if (supabaseLib && typeof supabaseLib.createClient === "function") {
  window.supabaseClient = supabaseLib.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  window.supabase = window.supabaseClient;

  console.log("Supabase conectado correctamente");
} else {
  console.error("Supabase no cargó. Revise el CDN en el HTML.");
}
