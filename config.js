const SUPABASE_URL = "https://wgnxojhqagwomytyzens.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gKg_uMQ1ma3JGlJLw_i-mA_rMCDSGCd";

if (SUPABASE_URL === "VOTRE_SUPABASE_URL") {
  console.error("Veuillez configurer SUPABASE_URL et SUPABASE_ANON_KEY dans config.js");
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
