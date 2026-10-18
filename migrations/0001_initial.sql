-- Migrations for Avtryck Cloudflare D1 Database

-- 1. Lead status table (migreras från Supabase)
CREATE TABLE IF NOT EXISTS lead_status (
  lead_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Kontaktformulärsinlämningar (ersätter Netlify Forms)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
