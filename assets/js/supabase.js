import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://rxibpfrhouqhamjvwtuf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aWJwZnJob3VxaGFtanZ2dHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjQ0NTAsImV4cCI6MjA5MTQwMDQ1MH0.UX8RXihiVGjvbmKLybeiTg-TtdgssfsdIuV0_34jicQ'

export const supabaseClient = createClient(supabaseUrl, supabaseKey)