"use client";

import { m } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GraduationCap, Linkedin, Mail, Phone } from "lucide-react";

type Person = {
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  photo: string;
  email: string;
  phone: string;
  education: { degree: string; school: string; year: string }[];
  experience: { title: string; place: string; period: string; description: string }[];
};

const team: Person[] = [
  {
    name: "Alfred Arvidsson",
    role: "Medgrundare",
    bio: "Mitt fokus ligger på kodning och avancerad problemlösning. Med arbetslivserfarenhet av att stärka tillförlitligheten i AI-modeller utvecklar jag lösningar som är både robusta och hållbara över tid.",
    linkedin: "https://linkedin.com/in/arvidssonalfred",
    photo: "/images/alfred_crop.JPG",
    email: "alfred@avtryckdigital.se",
    phone: "070 338 85 30",
    education: [
      {
        degree: "B.Sc Information systems",
        school: "Uppsala universitet",
        year: "2024 – nu",
      },
    ],
    experience: [
      {
        title: "DataAnnotation",
        place: "Distans",
        period: "2025 – nu",
        description: "Bygger mer tillförlitliga AI-modeller genom testning och utvärdering.",
      },
    ],
  },
  {
    name: "Linus Kammonen",
    role: "Medgrundare",
    bio: "Jag gillar att förenkla det komplexa. Genom att kombinera AI, modern teknik och beprövade metoder skapar jag lösningar som är smarta, effektiva och enkla att använda.",
    linkedin: "https://linkedin.com/in/linus-kammonen-42101314b",
    photo: "/images/linus_crop.JPG",
    email: "linus@avtryckdigital.se",
    phone: "070 992 79 65",
    education: [
      {
        degree: "B.Sc Information systems",
        school: "Mid-Sweden University",
        year: "2025 – nu",
      },
    ],
    experience: [
      {
        title: "",
        place: "",
        period: "",
        description: "",
      },
    ],
  },
];

function PersonCard({ person, index }: { person: Person; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
      className="glass rounded-2xl overflow-hidden border border-white/8"
    >
      {/* Header */}
      <div className="p-7 border-b border-white/6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/[0.05] border border-white/10 flex-shrink-0">
            <Image
              src={person.photo}
              alt={person.name}
              width={192}
              height={192}
              quality={100}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {person.name}
            </h2>
            <span className="text-xs text-white/65">{person.role}</span>
            <div className="flex flex-col gap-1 mt-1">
              <a
                href={`mailto:${person.email}`}
                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors duration-200"
              >
                <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={1.8} />
                {person.email}
              </a>
              <a
                href={`tel:${person.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors duration-200"
              >
                <Phone className="w-3 h-3 flex-shrink-0" strokeWidth={1.8} />
                {person.phone}
              </a>
            </div>
          </div>
        </div>

        <a
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${person.name} på LinkedIn`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-xs text-white/75 hover:text-white/70 hover:border-white/20 transition-all duration-200 cursor-pointer flex-shrink-0"
        >
          <Linkedin className="w-3.5 h-3.5" strokeWidth={1.8} />
          LinkedIn
        </a>
      </div>

      <div className="p-7 flex flex-col gap-7">
        {/* Left */}
        <div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-7">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-3.5 h-3.5 text-white/55" strokeWidth={1.8} />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-white/55">
                Utbildning
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {person.education.map((ed, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white/70">{ed.degree}</p>
                    <p className="text-xs text-white/65 mt-0.5">{ed.school}</p>
                  </div>
                  <span className="text-[11px] text-white/55 flex-shrink-0 mt-0.5">
                    {ed.year}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </m.div>
  );
}

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 overflow-hidden">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[400px] -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(242,167,181,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-4">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-14"
        >
          <span className="text-[11px] font-medium tracking-widest uppercase text-white/55 mb-3 block">
            Vilka vi är
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gradient leading-tight mb-4">
            Två studenter som bygger
            <br />
            <span className="text-gradient-pink">riktiga saker för riktiga företag.</span>
          </h1>
          <p className="text-sm text-white/75 max-w-md leading-relaxed">
            Avtryck Digital föddes ur en vilja att utmana det traditionella.
I ett samhälle där tekniken utvecklas snabbare än utbildningen såg vi en möjlighet att arbeta friare, närmare det som faktiskt är aktuellt.
Det gör att vi kan bygga moderna, hållbara lösningar som ger våra kunder ett verkligt försprång online.
          </p>
        </m.div>

        <div className="grid md:grid-cols-2 gap-5 mb-14">
          {team.map((person, i) => (
            <PersonCard key={person.name} person={person} index={i} />
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Vill du jobba med oss?
          </h3>
          <p className="text-sm text-white/75 mb-7 max-w-xs mx-auto leading-relaxed">
            Boka in ett kostnadsfritt möte idag.
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-door text-[#0A0A0A] text-sm font-semibold hover:bg-pink-door-dark transition-colors duration-200 cursor-pointer"
          >
            Kom igång
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </m.div>
      </div>
    </div>
  );
}
