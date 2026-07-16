"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  ExternalLink,
  Flame,
  Heart,
  Phone,
  RotateCcw,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import rawLeads from "@/data/enriched_leads.json";

type Lead = {
  id: string;
  name: string;
  webbplats: string;
  phone: string;
  revenue: string;
  modern_score: number;
  summary: string;
  pain_point: string;
  sales_angle: string;
};

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 600;

const FILTERED_LEADS: Lead[] = (rawLeads as Omit<Lead, "id">[])
  .filter((lead) => lead.modern_score <= 5)
  .map((lead, index) => ({ ...lead, id: `${index}-${lead.name}` }));

function scoreColor(score: number) {
  if (score <= 2) return "text-red-400 border-red-400/30 bg-red-400/10";
  if (score <= 4) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
}

type SwipeCardHandle = {
  fly: (direction: "left" | "right") => void;
};

const SwipeCard = forwardRef<
  SwipeCardHandle,
  { lead: Lead; isTop: boolean; stackIndex: number; onExitComplete: (direction: "left" | "right") => void }
>(function SwipeCard({ lead, isTop, stackIndex, onExitComplete }, ref) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 320], [-20, 20]);
  const saveOpacity = useTransform(x, [30, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -30], [1, 0]);

  const fly = (direction: "left" | "right") => {
    animate(x, direction === "right" ? 900 : -900, {
      type: "spring",
      stiffness: 260,
      damping: 26,
      onComplete: () => onExitComplete(direction),
    });
  };

  useImperativeHandle(ref, () => ({ fly }));

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      fly("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      fly("left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 320, damping: 24 });
    }
  }

  return (
    <motion.div
      style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, zIndex: 30 - stackIndex }}
      className="absolute inset-0 origin-bottom"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={{ scale: 1 - stackIndex * 0.045, y: stackIndex * 14, opacity: 1 }}
      initial={{ scale: 1 - stackIndex * 0.045, y: stackIndex * 14 + 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
    >
      <div
        className={`relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-border-subtle bg-surface-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ${
          isTop ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {isTop && (
          <>
            <motion.div
              style={{ opacity: saveOpacity }}
              className="pointer-events-none absolute right-6 top-8 z-10 rotate-12 rounded-xl border-4 border-pink-door px-4 py-1.5 text-xl font-black tracking-wider text-pink-door"
            >
              RING UPP
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="pointer-events-none absolute left-6 top-8 z-10 -rotate-12 rounded-xl border-4 border-red-400 px-4 py-1.5 text-xl font-black tracking-wider text-red-400"
            >
              KASTA
            </motion.div>
          </>
        )}

        <div className="bg-gradient-to-br from-matcha-mid via-matcha-deep to-background px-7 pb-6 pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold leading-tight text-white">{lead.name}</h2>
              <p className="mt-1 text-sm text-white/50">Omsättning {lead.revenue}</p>
            </div>
            <div
              className={`flex shrink-0 flex-col items-center rounded-2xl border px-3 py-2 ${scoreColor(
                lead.modern_score
              )}`}
            >
              <span className="text-xl font-black leading-none">{lead.modern_score}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">/ 10</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{lead.summary}</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-7 py-6">
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
            <div className="mb-1.5 flex items-center gap-2 text-red-300">
              <TrendingDown size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Pain point</span>
            </div>
            <p className="text-sm leading-relaxed text-white/80">{lead.pain_point}</p>
          </div>

          <div className="rounded-2xl border border-pink-door/25 bg-pink-door/[0.07] p-4">
            <div className="mb-1.5 flex items-center gap-2 text-pink-door">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Säljvinkel</span>
            </div>
            <p className="text-sm leading-relaxed text-white/80">{lead.sales_angle}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle px-7 py-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <Phone size={14} />
            {lead.phone}
          </span>
          <a
            href={lead.webbplats}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-pink-door"
            onClick={(e) => e.stopPropagation()}
          >
            Hemsida
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </motion.div>
  );
});

export default function LeadsSwipePage() {
  const [deck, setDeck] = useState<Lead[]>(FILTERED_LEADS);
  const [callList, setCallList] = useState<Lead[]>([]);
  const topCardRef = useRef<SwipeCardHandle>(null);

  const total = FILTERED_LEADS.length;
  const reviewed = total - deck.length;
  const currentLead = deck[0];

  function handleExitComplete(direction: "left" | "right") {
    setDeck((prev) => {
      const [top, ...rest] = prev;
      if (direction === "right" && top) {
        setCallList((list) => [...list, top]);
      }
      return rest;
    });
  }

  function resetDeck() {
    setDeck(FILTERED_LEADS);
    setCallList([]);
  }

  if (total === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-28 text-center">
        <div className="rounded-full border border-border-subtle bg-surface p-5">
          <Sparkles className="text-pink-door" size={28} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Inga leads att bearbeta</h1>
        <p className="mt-2 max-w-sm text-white/60">
          Inga bolag i <code className="text-white/80">enriched_leads.json</code> hade ett modern_score
          på 5 eller lägre. Kör scrapern igen eller bredda urvalet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-12 pt-28">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Flame className="text-pink-door" size={20} />
            Prospektering
          </h1>
          <p className="text-sm text-white/50">Swipa dig igenom dagens leads</p>
        </div>
        <span className="rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs font-medium text-white/60">
          {Math.min(reviewed + 1, total)} / {total}
        </span>
      </header>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-pink-door-dark to-pink-door"
          animate={{ width: `${(reviewed / total) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>

      {currentLead ? (
        <>
          <div className="relative h-[520px] w-full">
            {deck
              .slice(0, 3)
              .map((lead, i) => (
                <SwipeCard
                  key={lead.id}
                  ref={i === 0 ? topCardRef : undefined}
                  lead={lead}
                  isTop={i === 0}
                  stackIndex={i}
                  onExitComplete={handleExitComplete}
                />
              ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => topCardRef.current?.fly("left")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-surface-2 text-red-400 shadow-lg transition-colors hover:bg-red-400/10"
              aria-label="Kasta lead"
            >
              <X size={26} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => topCardRef.current?.fly("right")}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-pink-door/40 bg-surface-2 text-pink-door shadow-lg transition-colors hover:bg-pink-door/10"
              aria-label="Spara till ringlistan"
            >
              <Heart size={24} fill="currentColor" />
            </motion.button>
          </div>
        </>
      ) : (
        <CallList leads={callList} onReset={resetDeck} />
      )}
    </div>
  );
}

function CallList({ leads, onReset }: { leads: Lead[]; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-pink-door/30 bg-pink-door/10">
          <Phone className="text-pink-door" size={22} />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">Ringlistan</h2>
        <p className="mt-1 text-sm text-white/50">
          {leads.length > 0
            ? `${leads.length} bolag redo att ringas upp`
            : "Inga bolag sparades den här omgången"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-border-subtle bg-surface-2 p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white">{lead.name}</h3>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${scoreColor(
                  lead.modern_score
                )}`}
              >
                {lead.modern_score}/10
              </span>
            </div>

            <p className="mt-2 text-sm italic leading-relaxed text-white/70">
              &ldquo;{lead.sales_angle}&rdquo;
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-sm">
              <a
                href={`tel:${lead.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 font-medium text-pink-door transition-colors hover:text-pink-door-dark"
              >
                <Phone size={14} />
                {lead.phone}
              </a>
              <a
                href={lead.webbplats}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
              >
                Hemsida
                <ExternalLink size={14} />
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="mt-8 flex items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface px-5 py-3 text-sm font-medium text-white/60 transition-colors hover:text-white"
      >
        <RotateCcw size={15} />
        Börja om
      </button>
    </motion.div>
  );
}
