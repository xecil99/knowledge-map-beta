// supabaseClient.js
export function createSupabaseClient() {
  const url = "PASTE_PROJECT_URL_HERE";
  const anonKey = "PASTE_ANON_PUBLIC_KEY_HERE";

  return window.supabase.createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
