import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://rxibpfrhouqhamjvwtuf.supabase.co'
const supabaseKey = 'sb_publishable_XXXX'

export const supabase = createClient(supabaseUrl, supabaseKey)