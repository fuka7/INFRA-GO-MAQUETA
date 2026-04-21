/* ═══════════════════════════════════════════════
   config.js — InfraGo
   Configuración global: Supabase client
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://rxibpfrhouqhamjvvtuf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aWJwZnJob3VxaGFtanZ2dHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjQ0NTAsImV4cCI6MjA5MTQwMDQ1MH0.UX8RXihiVGjvbmKLybeiTg-TtdgssfsdIuV0_34jicQ';

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
window.dispatchEvent(new Event('supabase:ready'));