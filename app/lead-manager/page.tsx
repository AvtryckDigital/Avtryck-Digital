"use client";

import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ExternalLink,
  FileWarning,
  Globe,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  UploadCloud,
  User,
  Users,
} from "lucide-react";

type RawLead = Record<string, unknown>;

type ContactStatus = "none" | "no" | "no_answer" | "meeting";

type DisplayLead = {
  // Stabil bolagsidentitet (org.nr eller namn) — status knyts hit, inte till radens position.
  id: string;
  // Gamla positionsbaserade nyckeln (lead-<index>). Behålls bara för att kunna
  // migrera markeringar som sparats i det gamla formatet till den stabila nyckeln.
  legacyId: string;
  legalName: string;
  industry?: string;
  county?: string;
  revenue?: string;
  profit?: string;
  employees?: string;
  phone?: string;
  homePage?: string;
  allabolagUrl?: string;
  ceo?: string;
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  none: "Ej kontaktad",
  no: "Nej tack",
  no_answer: "Svarade inte",
  meeting: "Möte bokat",
};

const STATUS_STYLES: Record<ContactStatus, string> = {
  none: "border-border-subtle bg-surface text-white/50",
  no: "border-red-400/30 bg-red-400/10 text-red-300",
  no_answer: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  meeting: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const VALID_STATUSES: ContactStatus[] = ["none", "no", "no_answer", "meeting"];

// Apify-exporten kan variera i fältnamn, och vissa attribut ligger nästlade
// (t.ex. Location.county). Vi provar flera kandidater per attribut — lägg till
// fler "Parent.child"-sökvägar här om ni hittar andra nästlade fält.
const FIELD_CANDIDATES = {
  legalName: ["legal_name", "legalName", "name", "company_name", "namn"],
  industry: ["current_industry", "industry", "bransch"],
  county: ["county", "Location.county", "location.county", "Location.region", "lan", "län"],
  revenue: ["revenue", "omsattning", "turnover"],
  profit: ["profit", "vinst"],
  employees: ["employes", "employees", "employee_count", "anstallda"],
  phone: ["phone", "telefon", "Contact.phone"],
  homePage: ["home_page", "homepage", "website", "domain", "webbplats"],
  allabolagUrl: ["allabolag_url", "allabolag", "profile_url", "url"],
  ceo: ["ceo", "ceo_name", "vd", "managing_director"],
  orgNumber: ["org_nummer", "org_number", "organisationsnummer"],
} as const;

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc === null || typeof acc !== "object") return undefined;
    const record = acc as RawLead;
    if (part in record) return record[part];
    const matchedKey = Object.keys(record).find((k) => k.toLowerCase() === part.toLowerCase());
    return matchedKey ? record[matchedKey] : undefined;
  }, obj);
}

function pickRaw(lead: RawLead, keys: readonly string[]): unknown {
  for (const path of keys) {
    const value = getNestedValue(lead, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function toNumberText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw).toLocaleString("sv-SE");
  return raw;
}

// allabolag.se-länken är källan till datan, inte bolagets egen hemsida — de
// ska aldrig visas som samma fält. Vi litar först på namngivna kandidater,
// men rättar till det om den "hemsida" vi hittade i själva verket pekar till
// allabolag.se, och letar annars generellt bland alla URL-liknande fält.
function extractUrls(raw: RawLead): { homePage?: string; allabolagUrl?: string } {
  let homePage = toText(pickRaw(raw, FIELD_CANDIDATES.homePage));
  let allabolagUrl = toText(pickRaw(raw, FIELD_CANDIDATES.allabolagUrl));

  if (homePage && /allabolag\.se/i.test(homePage)) {
    allabolagUrl = allabolagUrl ?? homePage;
    homePage = undefined;
  }
  if (allabolagUrl && !/allabolag\.se/i.test(allabolagUrl)) {
    homePage = homePage ?? allabolagUrl;
    allabolagUrl = undefined;
  }

  if (!homePage || !allabolagUrl) {
    for (const value of Object.values(raw)) {
      if (typeof value !== "string" || !/^https?:\/\//i.test(value)) continue;
      const isAllabolag = /allabolag\.se/i.test(value);
      if (isAllabolag && !allabolagUrl) allabolagUrl = value;
      if (!isAllabolag && !homePage) homePage = value;
    }
  }

  return { homePage, allabolagUrl };
}

// Kontaktstatus måste knytas till bolagets identitet — inte till radens position i
// filen. Annars ärver ett nytt bolag på samma rad en gammal markering när man laddar
// upp en ny lista. Vi använder org.nr när det finns (siffror, formatoberoende), annars
// ett normaliserat företagsnamn. Positionsnyckel används bara som absolut sista utväg
// för rader helt utan namn och org.nr.
function stableLeadKey(raw: RawLead): string | null {
  const orgDigits = toText(pickRaw(raw, FIELD_CANDIDATES.orgNumber))?.replace(/\D/g, "");
  if (orgDigits && orgDigits.length >= 6) return `org:${orgDigits}`;
  const name = toText(pickRaw(raw, FIELD_CANDIDATES.legalName));
  if (name) return `name:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
  return null;
}

function normalizeLead(raw: RawLead, index: number): DisplayLead {
  const { homePage, allabolagUrl } = extractUrls(raw);
  return {
    id: stableLeadKey(raw) ?? `row-${index}`,
    legacyId: `lead-${index}`,
    legalName: toText(pickRaw(raw, FIELD_CANDIDATES.legalName)) ?? "Okänt bolag",
    industry: toText(pickRaw(raw, FIELD_CANDIDATES.industry)),
    county: toText(pickRaw(raw, FIELD_CANDIDATES.county)),
    revenue: toNumberText(pickRaw(raw, FIELD_CANDIDATES.revenue)),
    profit: toNumberText(pickRaw(raw, FIELD_CANDIDATES.profit)),
    employees: toNumberText(pickRaw(raw, FIELD_CANDIDATES.employees)),
    phone: toText(pickRaw(raw, FIELD_CANDIDATES.phone)),
    homePage,
    allabolagUrl,
    ceo: toText(pickRaw(raw, FIELD_CANDIDATES.ceo)),
  };
}

export default function LeadManagerPage() {
  const [leads, setLeads] = useState<DisplayLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<Record<string, ContactStatus>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDismissed, setMigrationDismissed] = useState(false);

  // Kontaktstatus lagras delat på servern (via /api/lead-status) så att alla
  // som öppnar verktyget — oavsett dator eller webbläsare — ser samma
  // kontakthistorik. Läses in en gång vid start.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/lead-status")
      .then((res) => res.json())
      .then((data: { statuses?: Record<string, string> }) => {
        if (cancelled || !data.statuses) return;
        const cleaned: Record<string, ContactStatus> = {};
        for (const [id, value] of Object.entries(data.statuses)) {
          if (VALID_STATUSES.includes(value as ContactStatus)) {
            cleaned[id] = value as ContactStatus;
          }
        }
        setStatuses(cleaned);
      })
      .catch(() => {
        // Servern kunde inte nås — kolumnen startar tom, men går fortfarande
        // att sätta lokalt under sessionen (försöker spara igen vid nästa ändring).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateStatus(id: string, status: ContactStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    setSaveError(null);
    fetch("/api/lead-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, status }),
    })
      .then(async (res) => {
        if (!res.ok) {
          // Ta med serverns förklaring (t.ex. Supabase 401 = fel nyckel/RLS) så
          // att orsaken syns direkt i felrutan i stället för ett generiskt fel.
          const data = (await res.json().catch(() => null)) as { detail?: string } | null;
          throw new Error(data?.detail || `save failed (${res.status})`);
        }
      })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : "";
        setSaveError(
          `Kunde inte spara status till servern. Kontrollera anslutningen och försök igen.${
            detail ? ` (${detail})` : ""
          }`
        );
      });
  }

  const processFile = useCallback((file: File) => {
    setError(null);
    if (file.type && file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Filen måste vara en .json-fil.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const list = Array.isArray(parsed) ? parsed : (parsed as RawLead)?.leads;
        if (!Array.isArray(list)) {
          setError("Filen innehöll ingen lista med bolag.");
          return;
        }
        setLeads(list.map((raw, index) => normalizeLead(raw as RawLead, index)));
        setMigrationDismissed(false); // varje ny fil får en egen chans att erbjuda migrering
      } catch {
        setError("Kunde inte tolka filen som JSON.");
      }
    };
    reader.onerror = () => setError("Kunde inte läsa filen.");
    reader.readAsText(file);
  }, []);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const hasCeoColumn = useMemo(() => leads?.some((lead) => lead.ceo) ?? false, [leads]);
  const hasAllabolagColumn = useMemo(
    () => leads?.some((lead) => lead.allabolagUrl) ?? false,
    [leads]
  );

  const withoutWebsite = useMemo(
    () => leads?.filter((lead) => !lead.homePage).length ?? 0,
    [leads]
  );

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) =>
      [lead.legalName, lead.industry, lead.county].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [leads, query]);

  // Markeringar som ligger kvar i det gamla positionsformatet (lead-<index>) för
  // bolag i den här listan som ännu inte har en markering på sin stabila nyckel.
  // Erbjuds för engångsmigrering via bannern nedan.
  const legacyMarks = useMemo(() => {
    if (!leads) return [];
    return leads
      .filter((lead) => statuses[lead.legacyId] !== undefined && statuses[lead.id] === undefined)
      .map((lead) => ({ lead, status: statuses[lead.legacyId] }));
  }, [leads, statuses]);

  // Flyttar positionssparade markeringar till bolagens stabila nyckel. Görs bara på
  // användarens uttryckliga begäran, eftersom positionsnyckeln inte kan mappas till
  // rätt bolag om den aktuella listan inte är samma som markeringarna gjordes på.
  async function migrateLegacyMarks() {
    const marks = legacyMarks;
    if (marks.length === 0) return;
    setIsMigrating(true);
    setSaveError(null);
    // Optimistiskt lokalt först — då försvinner bannern direkt (bolagen får en
    // markering på sin stabila nyckel och räknas inte längre som "legacy").
    setStatuses((prev) => {
      const next = { ...prev };
      for (const { lead, status } of marks) next[lead.id] = status;
      return next;
    });
    try {
      await Promise.all(
        marks.map(({ lead, status }) =>
          fetch("/api/lead-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: lead.id, status }),
          }).then((res) => {
            if (!res.ok) throw new Error(`save failed (${res.status})`);
          })
        )
      );
      // Städa bort de gamla positionsraderna så bannern inte dyker upp igen på en
      // annan lista. Best effort — markeringarna är redan sparade på de stabila
      // nycklarna, så ett misslyckat städ-anrop är inte kritiskt.
      const legacyIds = marks.map(({ lead }) => lead.legacyId);
      try {
        await fetch("/api/lead-status", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadIds: legacyIds }),
        });
      } catch {
        /* ignoreras — död data som ändå inte påverkar de migrerade markeringarna */
      }
      setStatuses((prev) => {
        const next = { ...prev };
        for (const id of legacyIds) delete next[id];
        return next;
      });
    } catch {
      setSaveError(
        "Kunde inte spara alla migrerade markeringar till servern. Kontrollera anslutningen och försök igen."
      );
    } finally {
      setIsMigrating(false);
    }
  }

  function reset() {
    setLeads(null);
    setQuery("");
    setError(null);
  }

  if (!leads) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-6 pt-28 text-center">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center gap-4 rounded-[28px] border-2 border-dashed px-8 py-16 transition-colors ${
            isDragging ? "border-pink-door bg-pink-door/5" : "border-border-subtle bg-surface-2"
          }`}
        >
          <div className="rounded-full border border-border-subtle bg-surface p-4">
            <UploadCloud className={isDragging ? "text-pink-door" : "text-white/50"} size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Släpp din leads.json här</h1>
            <p className="mt-1 text-sm text-white/50">eller klicka nedan för att välja fil</p>
          </div>
          <label className="mt-2 cursor-pointer rounded-full bg-pink-door px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-pink-door-dark">
            Välj fil
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            <FileWarning size={16} />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-[1600px] px-5 pb-16 pt-28"
    >
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead-hanterare</h1>
          <p className="text-sm text-white/50">
            {leads.length} bolag inlästa · {withoutWebsite} saknar hemsida
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={16}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök bolag, bransch eller ort..."
              className="w-64 rounded-full border border-border-subtle bg-surface-2 py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-pink-door/50 focus:outline-none"
            />
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <RotateCcw size={14} />
            Ny fil
          </button>
        </div>
      </header>

      {saveError && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <FileWarning size={16} />
          {saveError}
        </div>
      )}

      {legacyMarks.length > 0 && !migrationDismissed && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
          <FileWarning size={16} className="shrink-0" />
          <span className="min-w-[16rem] flex-1">
            {legacyMarks.length} markering{legacyMarks.length === 1 ? "" : "ar"} är sparade i
            gammalt format (på listposition). Migrera dem till bolagen i den här listan — gör
            bara det om det är samma lista som markeringarna ursprungligen gjordes på.
          </span>
          <button
            onClick={migrateLegacyMarks}
            disabled={isMigrating}
            className="rounded-full bg-yellow-400/90 px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-yellow-400 disabled:opacity-60"
          >
            {isMigrating ? "Migrerar…" : `Migrera ${legacyMarks.length}`}
          </button>
          <button
            onClick={() => setMigrationDismissed(true)}
            className="rounded-full border border-yellow-400/30 px-4 py-1.5 text-xs font-medium text-yellow-200/80 transition-colors hover:text-yellow-100"
          >
            Ignorera
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-xs uppercase tracking-wide text-white/40">
                <th className="px-3 py-3.5 font-medium">Bolag</th>
                <th className="px-3 py-3.5 font-medium">Bransch</th>
                <th className="px-3 py-3.5 font-medium">Ort/Län</th>
                <th className="px-3 py-3.5 font-medium">Omsättning</th>
                <th className="px-3 py-3.5 font-medium">Vinst</th>
                <th className="px-3 py-3.5 font-medium">Anställda</th>
                <th className="px-3 py-3.5 font-medium">Telefon</th>
                <th className="px-3 py-3.5 font-medium">Hemsida</th>
                {hasAllabolagColumn && <th className="px-3 py-3.5 font-medium">Allabolag</th>}
                {hasCeoColumn && <th className="px-3 py-3.5 font-medium">VD</th>}
                <th className="px-3 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredLeads.map((lead) => {
                  const status = statuses[lead.id] ?? "none";
                  const rowClass =
                    status === "meeting"
                      ? "bg-emerald-400/[0.05]"
                      : status === "no" || status === "no_answer"
                        ? "opacity-50"
                        : !lead.homePage
                          ? "bg-pink-door/[0.04]"
                          : "";
                  return (
                    <motion.tr
                      key={lead.legacyId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`border-b border-border-subtle/60 last:border-0 hover:bg-white/[0.02] ${rowClass}`}
                    >
                      <td className="px-3 py-3.5 font-medium text-white">{lead.legalName}</td>
                      <td className="px-3 py-3.5 text-white/70">{lead.industry ?? "—"}</td>
                      <td className="px-3 py-3.5 text-white/70">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-white/30" />
                          {lead.county ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-white/70">{lead.revenue ?? "—"}</td>
                      <td className="px-3 py-3.5 text-white/70">{lead.profit ?? "—"}</td>
                      <td className="px-3 py-3.5 text-white/70">
                        <span className="flex items-center gap-1.5">
                          <Users size={13} className="text-white/30" />
                          {lead.employees ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-white/70">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/\s/g, "")}`}
                            className="flex items-center gap-1.5 hover:text-pink-door"
                          >
                            <Phone size={13} className="text-white/30" />
                            {lead.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        {lead.homePage ? (
                          <a
                            href={lead.homePage.startsWith("http") ? lead.homePage : `https://${lead.homePage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-white/70 hover:text-pink-door"
                          >
                            <Globe size={13} className="text-white/30" />
                            Besök
                          </a>
                        ) : (
                          <span className="inline-block whitespace-nowrap rounded-full border border-pink-door/30 bg-pink-door/10 px-2.5 py-1 text-xs font-medium text-pink-door">
                            Ingen hemsida
                          </span>
                        )}
                      </td>
                      {hasAllabolagColumn && (
                        <td className="px-3 py-3.5">
                          {lead.allabolagUrl ? (
                            <a
                              href={lead.allabolagUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-white/50 hover:text-white"
                            >
                              <ExternalLink size={13} className="text-white/30" />
                              Profil
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      {hasCeoColumn && (
                        <td className="px-3 py-3.5 text-white/70">
                          {lead.ceo ? (
                            <span className="flex items-center gap-1.5">
                              <User size={13} className="text-white/30" />
                              {lead.ceo}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      <td className="px-3 py-3.5">
                        <select
                          value={status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as ContactStatus)}
                          className={`rounded-full border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-pink-door/50 ${STATUS_STYLES[status]}`}
                        >
                          {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((value) => (
                            <option key={value} value={value} className="bg-surface-2 text-white">
                              {STATUS_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center text-white/40">
            <Building2 size={22} />
            <p>Inga bolag matchade sökningen.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
