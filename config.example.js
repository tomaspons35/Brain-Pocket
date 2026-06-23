// Copy this file to "config.js" and fill in your own Supabase values.
//
// IMPORTANT: Use the ANON / PUBLIC key (Supabase -> Project Settings -> API
// -> "Project API keys" -> "anon public"). It is SAFE to expose in the browser
// and to commit, because Row Level Security (RLS) enforces per-user access in
// the database itself.
//
// NEVER use the "service_role" key here. It bypasses RLS and grants full admin
// access. If it ever ends up in client code or this repo, rotate it immediately.
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-public-key";
