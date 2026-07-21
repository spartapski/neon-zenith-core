import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, Search, ArrowRight } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import imgDomo from "@/assets/service-domotique.jpg";
import imgDigital from "@/assets/service-digital.jpg";
import imgReseaux from "@/assets/service-reseaux.jpg";
import imgIA from "@/assets/service-ia.jpg";
import imgComm from "@/assets/service-communication.jpg";
import imgEvents from "@/assets/service-events.jpg";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Blog — DODRICOM" },
      { name: "description", content: "Actualités, tendances et conseils sur la technologie, la domotique, l'IA et le digital." },
    ],
  }),
});

const POSTS = [
  { title: "L'IA générative dans l'entreprise : par où commencer", cat: "IA", img: imgIA, author: "Yassine El Amrani", date: "12 Juil. 2026", read: "6 min" },
  { title: "Domotique : sécuriser sa maison en 2026", cat: "Domotique", img: imgDomo, author: "Sara Bennis", date: "05 Juil. 2026", read: "5 min" },
  { title: "SEO local : les 7 leviers qui marchent vraiment", cat: "Digital", img: imgDigital, author: "Karim Ziani", date: "28 Juin 2026", read: "8 min" },
  { title: "Wi-Fi 6 vs Wi-Fi 7 : quel choix pour votre PME ?", cat: "Réseaux", img: imgReseaux, author: "Nadia Fassi", date: "20 Juin 2026", read: "7 min" },
  { title: "Réussir sa charte graphique en 5 étapes", cat: "Communication", img: imgComm, author: "Rania Idrissi", date: "12 Juin 2026", read: "4 min" },
  { title: "Organiser un événement corporate mémorable", cat: "Events", img: imgEvents, author: "Amine Chraibi", date: "01 Juin 2026", read: "6 min" },
];

function BlogPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Blog"
        title={<>Actualités & <span className="gradient-text">insights</span></>}
        subtitle="Décryptages, retours d'expérience et bonnes pratiques par l'équipe DODRICOM."
      />

      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="glass flex items-center gap-3 px-5 py-3">
          <Search className="h-4 w-4 text-white/60" />
          <input
            type="search"
            placeholder="Rechercher un article…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <article key={p.title} className="glass card-hover group overflow-hidden p-0">
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute left-4 top-4 rounded-full bg-[var(--gradient-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {p.cat}
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.read}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold leading-snug text-white">{p.title}</h3>
                <p className="mt-2 text-xs text-white/60">Par {p.author}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  Lire l'article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                n === 1
                  ? "bg-[var(--gradient-primary)] text-white shadow-[0_0_20px_rgba(139,61,255,0.5)]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}