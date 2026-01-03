// supabaseClient.js
export function createSupabaseClient() {
  const url = "https://zweebefyolhubnspihzk.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3ZWViZWZ5b2xodWJuc3BpaHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjAxMDIsImV4cCI6MjA4MjY5NjEwMn0.wXH218qQye5ZPncCQ03tZlijEQwKJNNYSvCvaFPt0EA";
  return window.supabase.createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
