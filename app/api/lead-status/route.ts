import { NextResponse } from "next/server";

// Denna route äger den delade kontaktstatusen (Ej kontaktad / Nej tack /
// Svarade inte / Möte bokat) i en Supabase-tabell, så att alla som öppnar
// /lead-manager — oavsett dator eller webbläsare — ser samma historik.
// Kräver miljövariablerna SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY, samt
// en tabell "lead_status" (lead_id text primary key, status text not null).
// Se README för SQL:en som skapar tabellen.

export const dynamic = "force-dynamic";

function credentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY saknas i miljövariablerna.");
  }
  return { url, key };
}

function headers(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// Supabase svarar med en förklarande JSON/text-body vid fel (t.ex. RLS-blockering
// eller fel nyckel). Vi tar med statuskod + body i det kastade felet så att den
// verkliga orsaken syns i loggen och i svaret, i stället för ett generiskt 500.
async function assertOk(res: Response) {
  if (res.ok) return;
  const detail = (await res.text().catch(() => "")).slice(0, 500);
  throw new Error(`Supabase-anrop misslyckades (${res.status}) ${detail}`.trim());
}

export async function GET() {
  try {
    const { url, key } = credentials();
    const res = await fetch(`${url}/rest/v1/lead_status?select=lead_id,status`, {
      headers: headers(key),
      cache: "no-store",
    });
    await assertOk(res);
    const rows = (await res.json()) as { lead_id: string; status: string }[];
    const statuses: Record<string, string> = {};
    for (const row of rows) {
      statuses[row.lead_id] = row.status;
    }
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Kunde inte hämta kontaktstatus:", error);
    const detail = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: "Kunde inte hämta kontaktstatus.", detail },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { leadId?: string; status?: string };
    if (!body.leadId || !body.status) {
      return NextResponse.json({ error: "leadId och status krävs." }, { status: 400 });
    }
    const { url, key } = credentials();
    const res = await fetch(`${url}/rest/v1/lead_status?on_conflict=lead_id`, {
      method: "POST",
      headers: {
        ...headers(key),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ lead_id: body.leadId, status: body.status }),
    });
    await assertOk(res);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kunde inte spara kontaktstatus:", error);
    const detail = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: "Kunde inte spara kontaktstatus.", detail },
      { status: 500 }
    );
  }
}
