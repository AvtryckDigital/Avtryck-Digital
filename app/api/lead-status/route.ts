import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Denna route äger den delade kontaktstatusen i en Cloudflare D1-databas,
// så att alla som öppnar /lead-manager ser samma historik.
export const dynamic = "force-dynamic";

async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  const db = env?.DB ?? env?.avtryck_db;
  if (!db) {
    throw new Error("D1-databasen ('DB' eller 'avtryck_db') är inte bunden i miljövariablerna.");
  }
  return db;
}

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT lead_id, status FROM lead_status")
      .all<{ lead_id: string; status: string }>();

    const statuses: Record<string, string> = {};
    for (const row of results) {
      statuses[row.lead_id] = row.status;
    }
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Kunde inte hämta kontaktstatus från D1:", error);
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

    const db = await getDb();
    await db
      .prepare(
        `INSERT INTO lead_status (lead_id, status, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(lead_id) DO UPDATE SET
           status = excluded.status,
           updated_at = excluded.updated_at`
      )
      .bind(body.leadId, body.status)
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kunde inte spara kontaktstatus i D1:", error);
    const detail = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: "Kunde inte spara kontaktstatus.", detail },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { leadIds?: string[] };
    const ids = (body.leadIds ?? []).filter((id) => typeof id === "string" && id.length > 0);
    if (ids.length === 0) {
      return NextResponse.json({ error: "leadIds krävs." }, { status: 400 });
    }

    const db = await getDb();
    // Skapa parametriserade frågetecken: ?, ?, ?
    const placeholders = ids.map(() => "?").join(",");
    await db
      .prepare(`DELETE FROM lead_status WHERE lead_id IN (${placeholders})`)
      .bind(...ids)
      .run();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Kunde inte ta bort gamla markeringar från D1:", error);
    const detail = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: "Kunde inte ta bort gamla markeringar.", detail },
      { status: 500 }
    );
  }
}
