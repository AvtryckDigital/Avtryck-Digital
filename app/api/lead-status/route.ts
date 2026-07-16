import { NextResponse } from "next/server";

// Denna route äger den delade kontaktstatusen (Ej kontaktad / Nej tack /
// Svarade inte / Möte bokat) i en Upstash Redis-hash, så att alla som öppnar
// /lead-manager — oavsett dator eller webbläsare — ser samma historik.
// Kräver miljövariablerna UPSTASH_REDIS_REST_URL och UPSTASH_REDIS_REST_TOKEN
// (se avtryck/README eller chattsvaret för hur du skapar en gratis databas).

export const dynamic = "force-dynamic";

const REDIS_HASH_KEY = "avtryck:lead-contact-status";

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN saknas i miljövariablerna."
    );
  }
  return { url, token };
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  const { url, token } = credentials();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Redis-anrop misslyckades (${res.status})`);
  }
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

export async function GET() {
  try {
    const flat = (await redisCommand(["HGETALL", REDIS_HASH_KEY])) as string[] | null;
    const statuses: Record<string, string> = {};
    if (Array.isArray(flat)) {
      for (let i = 0; i < flat.length - 1; i += 2) {
        statuses[flat[i]] = flat[i + 1];
      }
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
    await redisCommand(["HSET", REDIS_HASH_KEY, body.leadId, body.status]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kunde inte spara kontaktstatus:", error);
    return NextResponse.json({ error: "Kunde inte spara kontaktstatus." }, { status: 500 });
  }
}
