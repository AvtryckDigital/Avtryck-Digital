# Avtryck Digital

Hemsida byggd med Next.js 15 (App Router), hostad på **Cloudflare Workers** via **OpenNext** (`@opennextjs/cloudflare`) och **Cloudflare D1** (SQLite).

---

## 🛠 Utveckling & Byggkommandon

- **Lokal utveckling (Next.js)**:
  ```bash
  npm run dev
  ```
- **Lokal D1-databas migration**:
  ```bash
  npm run d1:migrate:local
  ```
- **Bygg för Cloudflare Worker**:
  ```bash
  npm run build:worker
  ```
- **Lokal preview av Cloudflare Worker (med lokal D1)**:
  ```bash
  npm run preview
  ```

---

## ☁️ Cloudflare D1 & Driftsättning

### 1. Skapa Cloudflare D1-databasen
Kör i terminalen (eller skapa i Cloudflare Dashboard):
```bash
npx wrangler d1 create avtryck-db
```

Kopiera `database_id` från utskriften och uppdatera i [`wrangler.jsonc`](wrangler.jsonc):
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "avtryck-db",
    "database_id": "<ditt-database-id-här>"
  }
]
```

### 2. Kör databasmigreringen på Cloudflare
Kör SQL-schemat mot din skarpa D1-databas:
```bash
npm run d1:migrate:remote
```

### 3. Deploya till Cloudflare Workers
```bash
npm run deploy
```

---

## 📦 Importera data från Supabase (Lead Status)

När du exporterat tabellen `lead_status` från Supabase (som CSV eller JSON):

1. **Testa lokalt först (valfritt)**:
   ```bash
   node scripts/import-leads.js din_export.json
   # eller
   node scripts/import-leads.js din_export.csv
   ```
2. **Importera till skarp Cloudflare D1-databas**:
   ```bash
   node scripts/import-leads.js din_export.json --remote
   # eller
   node scripts/import-leads.js din_export.csv --remote
   ```

---

## 📨 Kontaktformulär (`/contact`) & Resend E-post

Kontaktformuläret skickar automatiskt ett e-postmeddelande via **Resend** och sparar samtidigt en permanent backup av förfrågan i Cloudflare D1-tabellen `contact_submissions`.

### 1. Lägg till din Resend API-nyckel på Cloudflare
Kör i terminalen:
```bash
npx wrangler secret put RESEND_API_KEY
```
Klistra in din API-nyckel från [resend.com](https://resend.com) (`re_...`).

För lokal testning (`wrangler dev`), skapa en `.dev.vars`-fil:
```env
RESEND_API_KEY=re_din_nyckel
```

### 2. Ändra mottagare / avsändare
I [`wrangler.jsonc`](wrangler.jsonc) under `vars`:
- `CONTACT_TO_EMAIL`: Mottagare (separera med kommatecken om du vill att flera ska få mejlet).
- `CONTACT_FROM_EMAIL`: Avsändare (använd `onboarding@resend.dev` under test, eller din verifierade domän i Resend).

### 3. Inspektera sparade meddelanden i D1
```bash
# Lokalt:
npx wrangler d1 execute avtryck-db --local --command "SELECT * FROM contact_submissions;"

# Skarpt:
npx wrangler d1 execute avtryck-db --remote --command "SELECT * FROM contact_submissions;"
```
