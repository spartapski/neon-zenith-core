import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import imgDomo from "@/assets/service-domotique.jpg";
import imgDigital from "@/assets/service-digital.jpg";
import imgReseaux from "@/assets/service-reseaux.jpg";
import imgIA from "@/assets/service-ia.jpg";
import imgComm from "@/assets/service-communication.jpg";
import imgEvents from "@/assets/service-events.jpg";

export const Route = createFileRoute("/realisations")({
  component: RealisationsPage,
  head: () => ({
    meta: [
      { title: "Réalisations — DODRICOM" },
      { name: "description", content: "Découvrez une sélection de projets réalisés par DODRICOM." },
    ],
  }),
});

const FILTERS = ["Tous", "Domotique", "Digital", "Réseaux", "IA", "Communication", "Events"] as const;

const PROJECTS = [
  { title: "Villa intelligente", cat: "Domotique", img: imgDomo, desc: "Installation complète d'un système domotique centralisé, éclairage, sécurité et confort." },
  { title: "Plateforme e-commerce", cat: "Digital", img: imgDigital, desc: "Développement d'une plateforme e-commerce performante et intuitive." },
  { title: "Infrastructure réseau", cat: "Réseaux", img: imgReseaux, desc: "Conception et déploiement d'une infrastructure réseau sécurisée et haute disponibilité." },
  { title: "Solution IA Predictive", cat: "IA", img: imgIA, desc: "Système d'IA prédictive pour optimiser les décisions et anticiper les tendances." },
  { title: "Studio audiovisuel", cat: "Communication", img: imgComm, desc: "Studio audiovisuel professionnel pour la production de contenus haute qualité." },
  { title: "Soirée entreprise", cat: "Events", img: imgEvents, desc: "Organisation clé en main : scénographie, sonorisation, éclairage et gestion." },
  { title: "Application mobile", cat: "Digital", img: imgDigital, desc: "Application mobile intuitive et performante pour un client entreprise." },
  { title: "Identité visuelle", cat: "Communication", img: imgComm, desc: "Création d'une identité visuelle complète pour renforcer l'image de marque." },
];

function RealisationsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const filtered = filter === "Tous" ? PROJECTS : PROJECTS.filter((p) => p.cat === filter);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Nos réalisations"
        title={<>RÉALISATIONS <span className="gradient-text">Premium</span></>}
        subtitle="Découvrez une sélection de projets sur mesure, innovants et efficaces réalisés pour nos clients."
      />

      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="glass-strong flex flex-wrap items-center gap-2 p-3">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? "bg-[var(--gradient-primary)] text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <article key={p.title} className="glass card-hover group relative overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]">
                  {p.cat}
                </span>
                <div className="absolute inset-0 bg-[color:var(--brand-violet)]/0 transition-colors duration-500 group-hover:bg-[color:var(--brand-violet)]/20" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/70">{p.desc}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  Voir le projet <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="glass flex flex-col items-start justify-between gap-6 p-8 lg:flex-row lg:items-center">
          <div>
            <h3 className="text-2xl font-black text-white sm:text-3xl">Vous avez un projet ?</h3>
            <p className="mt-2 text-white/70">Discutons ensemble de vos besoins et trouvons la meilleure solution.</p>
          </div>
          <Link to="/contact" className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">
            Demander un devis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}