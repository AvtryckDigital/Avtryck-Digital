# avtryck

## Lead-manager: delad kontaktstatus (Supabase)

`/lead-manager` sparar kontaktstatus (Ej kontaktad / Nej tack / Svarade inte /
Möte bokat) delat mellan alla som öppnar sidan, via `/api/lead-status`
(`app/api/lead-status/route.ts`). Statusen lagras i en Supabase-tabell.

### 1. Skapa projekt och tabell

1. Skapa ett nytt projekt på https://supabase.com/dashboard (gratisnivån räcker).
2. Öppna **SQL Editor** i projektet och kör:

   ```sql
   create table lead_status (
     lead_id text primary key,
     status text not null,
     updated_at timestamptz not null default now()
   );
   ```

3. Gå till **Project Settings → API** och kopiera:
   - **Project URL** → blir `SUPABASE_URL`
   - **service_role secret** (inte `anon`-nyckeln, den ger inte skrivrättigheter
     förbi Row Level Security) → blir `SUPABASE_SERVICE_ROLE_KEY`

### 2. Sätt miljövariabler i Netlify

Site configuration → Environment variables → Add a variable:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Trigga sedan en ny deploy (Trigger deploy → Clear cache and deploy site).

**Viktigt:** `SUPABASE_SERVICE_ROLE_KEY` ger full skriv-/läsrättighet förbi RLS
och används bara server-side i `route.ts` — den ska aldrig exponeras till
klienten eller läggas i en `NEXT_PUBLIC_*`-variabel.
