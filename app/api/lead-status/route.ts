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

export async function GET() {
  try {
    const { url, key } = credentials();
    const res = await fetch(`${url}/rest/v1/lead_status?select=lead_id,status`, {
      headers: headers(key),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Supabase-anrop misslyckades (${res.status})`);
    }
    const rows = (await res.json()) as { lead_id: string; status: string }[];
    const statuses: Record<string, string> = {};
    for (const row of rows) {
      statuses[row.lead_id] = row.status;
    }
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Kunde inte hämta kontaktstatus:", error);
    return NextResponse.json({ error: "Kunde inte hämta kontaktstatus." }, { status: 500 });
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
      headers: { ...headers(key), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ lead_id: body.leadId, status: body.status }),
    });
    if (!res.ok) {
      throw new Error(`Supabase-anrop misslyckades (${res.status})`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kunde inte spara kontaktstatus:", error);
    return NextResponse.json({ error: "Kunde inte spara kontaktstatus." }, { status: 500 });
  }
}
