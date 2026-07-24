import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Briefcase,
  Calendar,
  ChevronDown,
  Cpu,
  Headphones,
  Home,
  Mail,
  MapPin,
  Megaphone,
  Network,
  Phone,
  Play,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import heroBuilding from "@/assets/hero-building.jpg";
import aboutReception from "@/assets/about-reception.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "DODRICOM — Entrez dans le siège de l'innovation" },
      {
        name: "description",
        content:
          "Vivez une expérience cinématique : entrez dans le siège DODRICOM et découvrez nos solutions premium en Domotique, Digital, Réseaux, IA, Communication et Événementiel.",
      },
      { property: "og:title", content: "DODRICOM — Entrez dans le siège de l'innovation" },
      { property: "og:description", content: "Expérience cinématique DODRICOM : domotique, digital, réseaux, IA, communication et événementiel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const SERVICES = [
  { key: "domotique", label: "Domotique", icon: Home, desc: "Habitats connectés, confortables et sécurisés." },
  { key: "digital", label: "Digital", icon: Cpu, desc: "Sites web, e-commerce et outils sur mesure." },
  { key: "reseaux", label: "Réseaux", icon: Network, desc: "Infrastructures performantes et sécurisées." },
  { key: "ia", label: "IA", icon: BrainCircuit, desc: "Automatisation et intelligence artificielle." },
  { key: "communication", label: "Communication", icon: Megaphone, desc: "Branding, contenu et audiovisuel." },
  { key: "events", label: "Events", icon: Calendar, desc: "Événements clés en main, sans compromis." },
];

const STATS = [
  { icon: Users, value: "120+", label: "Clients satisfaits" },
  { icon: Briefcase, value: "250+", label: "Projets réalisés" },
  { icon: Award, value: "5+", label: "Années d'expérience" },
  { icon: Headphones, value: "24/7", label: "Support technique" },
];

function HomePage() {
  return (
    <SiteLayout>
      {/* HERO — DODRICOM headquarters at night */}
      <section className="relative -mt-[78px] min-h-screen overflow-hidden lg:-mt-[90px]">
        <img
          src={heroBuilding}
          alt="Siège DODRICOM illuminé la nuit"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        {/* Left → right dark veil for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-[#05060A]/40" />

        {/* Floating contact rail (right side) */}
        <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {[
            { icon: Phone, label: "Appeler" },
            { icon: Mail, label: "Email" },
            { icon: MapPin, label: "Adresse" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:text-white hover:shadow-[0_0_25px_rgba(139,61,255,0.5)]"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 pb-40 pt-32 lg:px-8 lg:pb-48">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] gradient-text"
          >
            L'innovation au service de
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            VOTRE
            <br />
            PERFORMANCE
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-xl text-lg text-white/75"
          >
            Des solutions intelligentes en Domotique, Digital, Réseaux, IA,
            Communication et Événementiel pour accompagner votre croissance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/services"
              className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Découvrir nos services <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-full text-sm font-semibold text-white/90 transition hover:text-white"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-xl">
                <Play className="h-4 w-4 fill-white" />
              </span>
              Voir notre vidéo
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <Icon className="mb-2 h-6 w-6 text-[color:var(--brand-violet)]" />
                <dt className="text-3xl font-black text-white">{value}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-white/55">
                  {label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-white/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em]">
            Scroll pour découvrir
          </p>
          <ChevronDown className="mx-auto mt-2 h-5 w-5 animate-bounce" />
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
              Nos services
            </p>
            <h2 className="max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Un écosystème complet pour <span className="gradient-text">accélérer</span> votre entreprise.
            </h2>
          </div>
          <Link
            to="/services"
            className="btn-ghost-glow inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            Voir tous les services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, label, icon: Icon, desc }) => (
            <Link
              to="/services"
              key={key}
              className="glass card-hover group relative overflow-hidden p-7"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--brand-violet)]/20 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
              <div className="relative">
                <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_30px_rgba(139,61,255,0.4)]">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm text-white/70">{desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  Explorer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="glass grid gap-10 overflow-hidden p-6 lg:grid-cols-2 lg:p-4">
          <div className="relative min-h-[380px] overflow-hidden rounded-3xl">
            <img
              src={aboutReception}
              alt="Réception moderne DODRICOM"
              width={1600}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--brand-violet)]/30 via-transparent to-[color:var(--brand-blue)]/20" />
          </div>
          <div className="flex flex-col justify-center p-6 lg:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
              À propos de DODRICOM
            </p>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              Une équipe passionnée. Des solutions <span className="gradient-text">sur mesure</span>.
            </h2>
            <p className="mt-5 text-white/70">
              DODRICOM est une entreprise innovante spécialisée dans la Domotique, le Digital,
              les Réseaux, l'Intelligence Artificielle, la Communication et l'Événementiel.
              Nous accompagnons nos clients de A à Z avec des solutions robustes et évolutives.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {[
                "Des solutions sur mesure adaptées à vos besoins",
                "Une approche centrée sur la qualité et la performance",
                "Un accompagnement de A à Z",
                "Une équipe d'experts passionnés à votre service",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.8)]" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/a-propos"
                className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                En savoir plus <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-10 lg:p-16">
          <div className="absolute inset-0 [background:var(--gradient-brand)] opacity-90" />
          <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                Prêt à passer à la vitesse supérieure ?
              </h2>
              <p className="mt-3 max-w-xl text-white/85">
                Discutons de votre projet. Nous vous répondons sous 24 h avec un devis clair et détaillé.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-4 text-sm font-semibold text-white shadow-2xl transition hover:bg-black/85"
            >
              Demander un devis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}