import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nydlzkfjbjtppuwamoal.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UUxKlOhltTeVZYQU0dQNtA_TiA5qYvn";

// Client-side Supabase client (uses anon key)
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _supabase;
}
