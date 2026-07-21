import { createFileRoute } from "@tanstack/react-router";
import { Target, Shield, Users, Headphones, Lightbulb, ShieldCheck, Handshake, BarChart3, Briefcase, Award } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import aboutReception from "@/assets/about-reception.jpg";

export const Route = createFileRoute("/a-propos")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "À propos — DODRICOM" },
      { name: "description", content: "Découvrez DODRICOM : mission, vision, valeurs et chiffres clés." },
    ],
  }),
});

const VALUES = [
  { icon: Lightbulb, title: "Innovation", desc: "Toujours à la pointe des nouvelles technologies." },
  { icon: ShieldCheck, title: "Fiabilité", desc: "Des solutions robustes et sécurisées." },
  { icon: Handshake, title: "Engagement", desc: "Un partenaire de confiance à chaque étape." },
  { icon: BarChart3, title: "Performance", desc: "Des résultats mesurables et durables." },
];

const STATS = [
  { icon: Users, value: "120+", label: "Clients satisfaits" },
  { icon: Briefcase, value: "250+", label: "Projets réalisés" },
  { icon: Award, value: "5+", label: "Années d'expérience" },
  { icon: Headphones, value: "24/7", label: "Support technique" },
];

function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="À propos de DODRICOM"
        title={
          <>
            Présentation <span className="gradient-text">Commerciale</span>
          </>
        }
        subtitle="DODRICOM est une entreprise innovante spécialisée dans la Domotique, le Digital, les Réseaux, l'Intelligence Artificielle, la Communication et l'Événementiel."
      />

      <section className="relative mx-auto max-w-7xl px-5 pb-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/10">
            <img
              src={aboutReception}
              alt="Réception DODRICOM"
              width={1600}
              height={1000}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <ul className="grid content-center gap-4">
            {[
              { icon: Target, text: "Des solutions sur mesure adaptées à vos besoins" },
              { icon: Shield, text: "Une approche centrée sur la qualité et la performance" },
              { icon: Users, text: "Un accompagnement de A à Z" },
              { icon: Headphones, text: "Une équipe d'experts passionnés à votre service" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="glass flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(139,61,255,0.4)]">
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <span className="text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="glass p-8">
            <h3 className="text-2xl font-black gradient-text">Notre mission</h3>
            <p className="mt-4 text-white/75">
              Accompagner nos clients avec des solutions intelligentes, fiables et évolutives
              pour relever les défis d'aujourd'hui et de demain.
            </p>
          </article>
          <article className="glass p-8">
            <h3 className="text-2xl font-black gradient-text">Notre vision</h3>
            <p className="mt-4 text-white/75">
              Devenir un acteur de référence grâce à l'innovation, la confiance et l'excellence
              opérationnelle.
            </p>
          </article>
          <article className="glass p-8">
            <h3 className="text-2xl font-black gradient-text">Notre promesse</h3>
            <p className="mt-4 text-white/75">
              Un partenaire technologique unique, transparent, réactif et engagé sur la
              performance mesurable de chaque projet.
            </p>
          </article>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
          DODRICOM en chiffres
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="glass flex flex-col items-center p-8 text-center">
              <Icon className="mb-4 h-8 w-8 text-[color:var(--brand-violet)]" />
              <div className="text-4xl font-black text-white">{value}</div>
              <div className="mt-2 text-sm text-white/70">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">Nos valeurs</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass card-hover p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(139,61,255,0.4)]">
                <Icon className="h-5 w-5 text-white" />
              </span>
              <h4 className="mt-5 text-lg font-bold text-white">{title}</h4>
              <p className="mt-2 text-sm text-white/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}