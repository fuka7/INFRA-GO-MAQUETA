import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://rxibpfrhouqhamjvwtuf.supabase.co'
const supabaseKey = 'sb_publishable_jrLmUGTf6k4Rd0MXrdMdKw_z8Fp_WU5'

export const supabaseClient = createClient(supabaseUrl, supabaseKey)