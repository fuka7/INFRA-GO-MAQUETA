// ═══════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE
// ═══════════════════════════════════════════════
// 
// REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES DE SUPABASE
// Obtén estos valores en: https://app.supabase.com → Tu Proyecto → Settings → API

const SUPABASE_URL = 'https://TU_PROJECT_ID.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Tu anon public key

// Inicializar cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
