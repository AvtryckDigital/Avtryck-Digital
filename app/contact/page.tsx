"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Hur snabbt kan ni börja?",
    a: "Vanligtvis inom några dagar efter vårt första samtal.",
  },
  {
    q: "Vad kostar en hemsida?",
    a: "Det beror på vad du behöver. Vi ger dig en tydlig offert efter ett kort samtal — inga dolda avgifter.",
  },
  {
    q: "Behöver jag kunna något tekniskt?",
    a: "Inte alls. Vi sköter allt och förklarar saker på vanlig svenska.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-left gap-4 cursor-pointer"
      >
        <span className="text-sm font-medium text-white/90">{q}</span>
        <ChevronDown
          className="w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs text-white/60 leading-relaxed pb-3.5">{a}</p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

function validate(fields: { name: string; email: string; phone: string; message: string }): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "Namn är obligatoriskt.";
  }

  if (!fields.email.trim()) {
    errors.email = "E-post är obligatorisk.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Ange en giltig e-postadress.";
  }

  if (!fields.phone.trim()) {
    errors.phone = "Telefonnummer är obligatoriskt.";
  } else if (!/^[\d\s\-+()]{7,15}$/.test(fields.phone.trim())) {
    errors.phone = "Ange ett giltigt telefonnummer.";
  }

  if (!fields.message.trim()) {
    errors.message = "Meddelande är obligatoriskt.";
  }

  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <m.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-[11px] text-[#F2A7B5] mt-1"
        >
          {msg}
        </m.p>
      )}
    </AnimatePresence>
  );
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fields, setFields] = useState({ name: "", email: "", phone: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const updated = { ...fields, [id]: value };
    setFields(updated);
    if (touched[id]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id } = e.target;
    setTouched((prev) => ({ ...prev, [id]: true }));
    setErrors(validate(fields));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, message: true });
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
    } catch {
      setErrors({ message: "Något gick fel. Försök igen." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `px-4 py-2.5 rounded-xl bg-white/[0.06] border text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors duration-200 ${
      touched[field] && errors[field]
        ? "border-[#F2A7B5]/60 focus:border-[#F2A7B5]"
        : "border-white/15 focus:border-white/30"
    }`;

  return (
    <div className="pt-28 pb-24 overflow-hidden">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-12 text-center"
        >
          <span className="text-[11px] font-medium tracking-widest uppercase text-white/50 mb-3 block">
            Kontakt
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gradient leading-tight mb-3">
            Låt oss hjälpa dig
          </h1>
          <p className="text-sm text-white/75 leading-relaxed">
            Fyll i formuläret så återkommer vi till dig inom en arbetsdag för att boka in ett
            kostnadsfritt möte. Vi ser fram emot att jobba med er!
          </p>
        </m.div>

        {/* FAQ */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="glass rounded-2xl px-5 py-4 border border-white/15 mb-6"
        >
          <span className="text-[11px] font-semibold tracking-wider uppercase text-white/50 block mb-1">
            Vanliga frågor
          </span>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </m.div>

        {/* Form */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          {submitted ? (
            <div className="glass rounded-2xl p-10 text-center border border-white/15 flex flex-col items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#F2A7B5]" strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Meddelande mottaget!</h2>
                <p className="text-sm text-white/60 max-w-xs leading-relaxed">
                  Vi läser det idag och svarar inom en arbetsdag. Hörs snart.
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="glass rounded-2xl p-7 flex flex-col gap-5 border border-white/15"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs text-white/70 font-medium">Ditt namn</label>
                  <input
                    id="name"
                    type="text"
                    value={fields.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Sara"
                    className={inputClass("name")}
                  />
                  <FieldError msg={touched.name ? errors.name : undefined} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs text-white/70 font-medium">E-post</label>
                  <input
                    id="email"
                    type="email"
                    value={fields.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="sara@dittforetag.se"
                    className={inputClass("email")}
                  />
                  <FieldError msg={touched.email ? errors.email : undefined} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs text-white/70 font-medium">
                  Telefonnummer
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="070 000 00 00"
                  className={inputClass("phone")}
                />
                <FieldError msg={touched.phone ? errors.phone : undefined} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-xs text-white/70 font-medium">Berätta lite mer</label>
                <textarea
                  id="message"
                  value={fields.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={4}
                  placeholder="Ditt meddelande..."
                  className={`px-4 py-3 rounded-xl bg-white/[0.06] border text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors duration-200 resize-none leading-relaxed ${
                    touched.message && errors.message
                      ? "border-[#F2A7B5]/60 focus:border-[#F2A7B5]"
                      : "border-white/15 focus:border-white/30"
                  }`}
                />
                <FieldError msg={touched.message ? errors.message : undefined} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-pink-door text-[#0A0A0A] text-sm font-semibold hover:bg-pink-door-dark transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Skickar...
                  </>
                ) : (
                  <>
                    Bli kontaktad!
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>
          )}
        </m.div>
      </div>
    </div>
  );
}
