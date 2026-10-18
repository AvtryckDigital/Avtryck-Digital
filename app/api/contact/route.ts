import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    } | null;
    const { name, email, phone, message } = body ?? {};

    if (!name || !email || !phone || !message) {
      return NextResponse.json(
        { error: "Alla fält (namn, e-post, telefon, meddelande) krävs." },
        { status: 400 }
      );
    }

    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedMessage = String(message).trim();

    const { env } = await getCloudflareContext({ async: true });

    // 1. Spara alltid i Cloudflare D1 som permanent backup
    const db = env?.DB ?? env?.avtryck_db;
    if (db) {
      try {
        await db
          .prepare(
            `INSERT INTO contact_submissions (name, email, phone, message, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`
          )
          .bind(trimmedName, trimmedEmail, trimmedPhone, trimmedMessage)
          .run();
      } catch (dbErr) {
        console.error("Kunde inte spara kontaktförfrågan i D1:", dbErr);
      }
    }

    // 2. Skicka e-postnotis via Resend
    const resendApiKey =
      env?.RESEND_API_KEY ||
      (env as Record<string, unknown>)?.RESEND_API ||
      (env as Record<string, unknown>)?.resend_api ||
      process.env.RESEND_API_KEY ||
      process.env.RESEND_API;
    const toEmailRaw = env?.CONTACT_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "alfredarvidsson1@outlook.com";
    const fromEmail = env?.CONTACT_FROM_EMAIL || process.env.CONTACT_FROM_EMAIL || "Avtryck Digital <onboarding@resend.dev>";

    if (resendApiKey) {
      const recipients = toEmailRaw
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: recipients,
            reply_to: trimmedEmail,
            subject: `Ny kontaktförfrågan från ${trimmedName} — Avtryck Digital`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #0A0A0A; border-bottom: 2px solid #F2A7B5; padding-bottom: 8px;">
                  Ny förfrågan från hemsidan (Avtryck Digital)
                </h2>
                <div style="background: #f9f9fb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                  <p style="margin: 8px 0;"><strong>Namn:</strong> ${trimmedName}</p>
                  <p style="margin: 8px 0;"><strong>E-post:</strong> <a href="mailto:${trimmedEmail}" style="color: #2563eb;">${trimmedEmail}</a></p>
                  <p style="margin: 8px 0;"><strong>Telefon:</strong> <a href="tel:${trimmedPhone}" style="color: #2563eb;">${trimmedPhone}</a></p>
                </div>
                <div style="margin-bottom: 24px;">
                  <h3 style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 8px;">Meddelande:</h3>
                  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #F2A7B5; padding: 16px; border-radius: 6px; line-height: 1.6; white-space: pre-wrap;">${trimmedMessage}</div>
                </div>
                <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">
                  Tips: Du kan svara direkt på detta mejl för att nå ${trimmedName} (${trimmedEmail}).
                </p>
              </div>
            `,
          }),
        });

        if (!resendRes.ok) {
          const errDetail = await resendRes.text().catch(() => "");
          console.warn("Resend API fel:", resendRes.status, errDetail);
        }
      } catch (mailErr) {
        console.error("Fel vid anrop till Resend:", mailErr);
      }
    } else {
      console.warn("RESEND_API_KEY saknas — förfrågan sparades i D1 men mejl kunde inte skickas.");
    }

    return NextResponse.json({ ok: true, message: "Meddelande mottaget!" });
  } catch (error) {
    console.error("Fel vid hantering av kontaktformulär:", error);
    const detail = error instanceof Error ? error.message : "Okänt fel";
    return NextResponse.json(
      { error: "Kunde inte skicka meddelandet.", detail },
      { status: 500 }
    );
  }
}
