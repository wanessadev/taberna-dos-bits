// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// Troque os valores abaixo pelos dados do seu projeto.
// Supabase > Project Settings > API
// =====================================================

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_PROJETO";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
