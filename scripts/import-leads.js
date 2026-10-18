/**
 * Hjälpskript för att importera exporterad lead_status-data från Supabase till Cloudflare D1.
 *
 * Användning:
 *   1. Exportera din tabell "lead_status" från Supabase som CSV eller JSON (t.ex. supabase_leads.json eller supabase_leads.csv).
 *   2. Kör:
 *      node scripts/import-leads.js path/to/file.json [--remote]
 *      eller
 *      node scripts/import-leads.js path/to/file.csv [--remote]
 *
 *   Utan flaggan --remote körs importen mot den lokala D1-databasen via Wrangler.
 *   Med --remote körs importen mot din skarpa Cloudflare D1-databas.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const filePath = args.find((a) => !a.startsWith("--"));
const isRemote = args.includes("--remote");

if (!filePath) {
  console.error("Ange sökvägen till filen som ska importeras (JSON eller CSV).");
  console.error("Exempel: node scripts/import-leads.js supabase_leads.json [--remote]");
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), filePath);
if (!fs.existsSync(fullPath)) {
  console.error(`Kunde inte hitta filen: ${fullPath}`);
  process.exit(1);
}

const content = fs.readFileSync(fullPath, "utf-8");
let rows = [];

if (filePath.endsWith(".json")) {
  try {
    const parsed = JSON.parse(content);
    rows = Array.isArray(parsed) ? parsed : (parsed.data || parsed.rows || []);
  } catch (err) {
    console.error("Kunde inte tolka JSON-filen:", err);
    process.exit(1);
  }
} else if (filePath.endsWith(".csv")) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length > 0) {
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const leadIdIndex = headers.indexOf("lead_id");
    const statusIndex = headers.indexOf("status");
    if (leadIdIndex === -1 || statusIndex === -1) {
      console.error("CSV-filen måste innehålla kolumnerna 'lead_id' och 'status'. Hittade:", headers);
      process.exit(1);
    }
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts[leadIdIndex] && parts[statusIndex]) {
        rows.push({ lead_id: parts[leadIdIndex], status: parts[statusIndex] });
      }
    }
  }
} else {
  console.error("Filformatet stöds inte. Använd .json eller .csv.");
  process.exit(1);
}

console.log(`Hittade ${rows.length} rader att importera.`);
if (rows.length === 0) {
  process.exit(0);
}

// Skapa temporär SQL-fil
const tempSqlPath = path.resolve(process.cwd(), "temp_import.sql");
const sqlStatements = [
  "BEGIN TRANSACTION;",
  ...rows.map((row) => {
    const leadId = (row.lead_id || "").replace(/'/g, "''");
    const status = (row.status || "").replace(/'/g, "''");
    return `INSERT INTO lead_status (lead_id, status, updated_at) VALUES ('${leadId}', '${status}', datetime('now')) ON CONFLICT(lead_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at;`;
  }),
  "COMMIT;",
];

fs.writeFileSync(tempSqlPath, sqlStatements.join("\n"), "utf-8");

try {
  const targetFlag = isRemote ? "--remote" : "--local";
  console.log(`Kör import mot D1 (${targetFlag})...`);
  execSync(`npx wrangler d1 execute avtryck-db ${targetFlag} --file=${tempSqlPath}`, {
    stdio: "inherit",
  });
  console.log("Import slutförd!");
} catch (err) {
  console.error("Fel vid körning av D1 execute:", err.message);
} finally {
  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }
}
