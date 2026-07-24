import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Home,
  Leaf,
  Megaphone,
  Network,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import imgDomo from "@/assets/service-domotique.jpg";
import imgDigital from "@/assets/service-digital.jpg";
import imgReseaux from "@/assets/service-reseaux.jpg";
import imgIA from "@/assets/service-ia.jpg";
import imgComm from "@/assets/service-communication.jpg";
import imgEvents from "@/assets/service-events.jpg";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
  head: () => ({
    meta: [
      { title: "Nos services — DODRICOM" },
      { name: "description", content: "Domotique, Digital, Réseaux, IA, Communication et Événementiel : découvrez nos solutions premium." },
    ],
  }),
});

type Product = { name: string; desc: string; price: string };
type Pack = { name: string; price: string; oldPrice?: string; popular?: boolean; features: string[] };
type Category = {
  key: string;
  label: string;
  title: string;
  icon: typeof Home;
  image: string;
  intro: string;
  products: Product[];
  packs: Pack[];
};

const CATEGORIES: Category[] = [
  {
    key: "domotique", label: "Domotique", title: "DOMOTIQUE", icon: Home, image: imgDomo,
    intro: "Des solutions intelligentes pour un habitat connecté, confortable, sécurisé et économe en énergie.",
    products: [
      { name: "Ampoule connectée", desc: "Contrôle de l'éclairage à distance, couleurs personnalisables.", price: "299 DH" },
      { name: "Serrure intelligente", desc: "Ouverture par code, carte ou smartphone.", price: "1 290 DH" },
      { name: "Caméra IP", desc: "Surveillance HD, vision nocturne et notifications temps réel.", price: "890 DH" },
      { name: "Thermostat", desc: "Régule la température automatiquement pour plus de confort.", price: "1 590 DH" },
      { name: "Détecteur de fumée", desc: "Détection précoce avec alerte sur votre smartphone.", price: "490 DH" },
      { name: "Passerelle domotique", desc: "Centralisez et contrôlez tous vos appareils connectés.", price: "990 DH" },
    ],
    packs: [
      { name: "Pack Confort", price: "2 490 DH", oldPrice: "2 990 DH", features: ["Ampoule connectée", "Prise intelligente", "Détecteur de fumée"] },
      { name: "Pack Sécurité", price: "4 990 DH", oldPrice: "6 290 DH", popular: true, features: ["Caméra IP", "Serrure intelligente", "Détecteur de fumée", "Passerelle"] },
      { name: "Pack Premium", price: "8 990 DH", oldPrice: "11 490 DH", features: ["Tout du pack Sécurité", "Thermostat", "Ampoules (x3)", "Scénarios personnalisés"] },
    ],
  },
  {
    key: "digital", label: "Digital", title: "DIGITAL", icon: Cpu, image: imgDigital,
    intro: "Des solutions digitales sur mesure pour booster votre présence, automatiser vos processus et accélérer votre croissance.",
    products: [
      { name: "Site vitrine", desc: "Présentez votre activité avec un site professionnel.", price: "1 490 DH" },
      { name: "Site e-commerce", desc: "Vendez en ligne avec une boutique performante.", price: "2 990 DH" },
      { name: "Référencement SEO", desc: "Améliorez votre visibilité sur Google.", price: "1 990 DH" },
      { name: "Gestion réseaux sociaux", desc: "Développez votre présence sociale.", price: "990 DH /mois" },
      { name: "Email professionnel", desc: "Adresse email à votre nom de domaine.", price: "149 DH /an" },
      { name: "Maintenance & Support", desc: "Mises à jour et support technique complet.", price: "490 DH /mois" },
    ],
    packs: [
      { name: "Pack Hébergement", price: "1 290 DH /an", features: ["Hébergement SSD ultra-rapide", "Certificat SSL gratuit", "Sauvegardes quotidiennes", "Assistance 24/7"] },
      { name: "Pack Nom de domaine", price: "199 DH /an", features: ["Nom de domaine .ma / .com / .net", "Protection WHOIS", "Renouvellement facile", "DNS optimisés"] },
      { name: "Pack Création Site Web", price: "4 990 DH", popular: true, features: ["Site web sur mesure", "Design responsive", "Jusqu'à 5 pages", "SEO de base"] },
    ],
  },
  {
    key: "reseaux", label: "Réseaux", title: "RÉSEAUX", icon: Network, image: imgReseaux,
    intro: "Des infrastructures réseau performantes, sécurisées et évolutives pour connecter et protéger votre entreprise.",
    products: [
      { name: "Switch administrable", desc: "Connectivité gigabit fiable et sécurisée.", price: "990 DH" },
      { name: "Routeur professionnel", desc: "Haute performance, VPN et pare-feu intégré.", price: "1 590 DH" },
      { name: "Point d'accès Wi-Fi 6", desc: "Couverture optimale et connexion stable.", price: "1 290 DH" },
      { name: "Pare-feu (Firewall)", desc: "Sécurisez votre réseau contre les menaces.", price: "2 990 DH" },
      { name: "Baie de brassage", desc: "Organisation optimale de vos équipements.", price: "2 490 DH" },
      { name: "Câble réseau Cat6", desc: "Câblage haute qualité pour connexions stables.", price: "290 DH" },
    ],
    packs: [
      { name: "Pack PME", price: "4 990 DH", oldPrice: "6 490 DH", features: ["Routeur professionnel", "Switch 8 ports", "2 points d'accès Wi-Fi 6", "Câblage & installation"] },
      { name: "Pack Entreprise", price: "9 990 DH", oldPrice: "13 990 DH", features: ["Routeur professionnel", "Switch 24 ports", "3 points d'accès", "Pare-feu", "Baie 12U"] },
      { name: "Pack Avancé", price: "15 990 DH", oldPrice: "21 990 DH", popular: true, features: ["Routeur haute performance", "Switch 48 ports", "5 points d'accès", "Pare-feu", "Baie 18U"] },
    ],
  },
  {
    key: "ia", label: "IA", title: "IA", icon: BrainCircuit, image: imgIA,
    intro: "Des solutions d'intelligence artificielle sur mesure pour automatiser, analyser et optimiser vos processus métier.",
    products: [
      { name: "Assistant IA intelligent", desc: "Assistant virtuel capable d'automatiser vos tâches.", price: "2 490 DH" },
      { name: "Vision par ordinateur", desc: "Analyse d'images et vidéos en temps réel.", price: "3 990 DH" },
      { name: "Traitement du langage (NLP)", desc: "Analyse de texte et compréhension automatique.", price: "2 990 DH" },
      { name: "Analyse prédictive", desc: "Prédisez les tendances et prenez de meilleures décisions.", price: "4 990 DH" },
      { name: "Automatisation (RPA)", desc: "Automatisez vos processus métiers répétitifs.", price: "3 490 DH" },
      { name: "Modèles IA sur mesure", desc: "Développement de modèles personnalisés.", price: "Sur devis" },
    ],
    packs: [
      { name: "Pack Starter IA", price: "2 990 DH", oldPrice: "4 490 DH", features: ["Assistant IA basique", "Automatisation de tâches (RPA)", "Support email", "1 utilisateur"] },
      { name: "Pack Business IA", price: "6 990 DH", oldPrice: "9 990 DH", popular: true, features: ["Assistant IA avancé", "Analyse prédictive", "NLP", "Tableau de bord IA", "5 utilisateurs"] },
      { name: "Pack Enterprise IA", price: "14 990 DH", oldPrice: "19 990 DH", features: ["Modèles IA sur mesure", "Vision par ordinateur", "Automatisation avancée", "Utilisateurs illimités"] },
    ],
  },
  {
    key: "communication", label: "Communication", title: "COMMUNICATION", icon: Megaphone, image: imgComm,
    intro: "Des solutions créatives et percutantes pour valoriser votre image, transmettre vos messages et captiver votre audience.",
    products: [
      { name: "Création graphique", desc: "Supports visuels professionnels adaptés à votre identité.", price: "890 DH" },
      { name: "Identité visuelle", desc: "Logo, charte graphique, cartes de visite.", price: "1 490 DH" },
      { name: "Gestion réseaux sociaux", desc: "Animation, création de contenu et gestion.", price: "1 990 DH /mois" },
      { name: "Production audiovisuelle", desc: "Vidéos institutionnelles, publicitaires et reportages.", price: "3 990 DH" },
      { name: "Photographie", desc: "Séances photo professionnelles pour événements et produits.", price: "1 490 DH" },
      { name: "Sonorisation & événementiel", desc: "Prestation audio et éclairage complète.", price: "2 990 DH" },
    ],
    packs: [
      { name: "Pack Starter", price: "2 490 DH", oldPrice: "3 490 DH", features: ["Création de logo", "2 visuels réseaux sociaux", "Carte de visite", "1 publication sponsorisée"] },
      { name: "Pack Business", price: "5 990 DH", oldPrice: "8 490 DH", popular: true, features: ["Identité visuelle complète", "8 visuels", "Gestion RS (1 mois)", "1 vidéo promo (30s)"] },
      { name: "Pack Premium", price: "9 990 DH", oldPrice: "15 490 DH", features: ["Identité complète", "Gestion RS (3 mois)", "1 vidéo institutionnelle", "Shooting pro", "Couverture événementielle"] },
    ],
  },
  {
    key: "events", label: "Events", title: "EVENTS", icon: Calendar, image: imgEvents,
    intro: "Des expériences événementielles inoubliables, conçues de A à Z pour marquer les esprits et créer des moments uniques.",
    products: [
      { name: "Organisation d'événements", desc: "Gestion complète de votre événement professionnel ou privé.", price: "2 990 DH" },
      { name: "Scénographie & décoration", desc: "Concepts créatifs et décors sur mesure.", price: "1 990 DH" },
      { name: "Éclairage professionnel", desc: "Mise en lumière architecturale et ambiance.", price: "1 490 DH" },
      { name: "Sonorisation", desc: "Systèmes audio puissants adaptés à tous types d'événements.", price: "1 490 DH" },
      { name: "Captation & diffusion", desc: "Captation vidéo multi-caméras et streaming.", price: "1 990 DH" },
      { name: "Signalétique & branding", desc: "Identités visuelles et supports événementiels.", price: "890 DH" },
    ],
    packs: [
      { name: "Pack Essentiel", price: "4 990 DH", oldPrice: "6 490 DH", features: ["Organisation de l'événement", "Sonorisation de base", "Éclairage d'ambiance", "Assistance technique"] },
      { name: "Pack Premium", price: "9 990 DH", oldPrice: "13 490 DH", popular: true, features: ["Organisation complète", "Scénographie", "Sonorisation pro", "Éclairage pro", "Captation live"] },
      { name: "Pack Excellence", price: "19 990 DH", oldPrice: "24 990 DH", features: ["Organisation sur-mesure", "Scénographie haut de gamme", "Effets spéciaux", "Multi-caméras & streaming", "Logistique"] },
    ],
  },
];

const BENEFITS = [
  { icon: Rocket, title: "Installation rapide", desc: "En moins de 24 h." },
  { icon: Zap, title: "Performance", desc: "Solutions rapides et optimisées." },
  { icon: Shield, title: "Sécurité", desc: "Protection et sauvegardes incluses." },
  { icon: Leaf, title: "Économies", desc: "Jusqu'à 30 % d'économies." },
];

function ServicesPage() {
  const [active, setActive] = useState(CATEGORIES[0].key);
  const category = CATEGORIES.find((c) => c.key === active)!;
  const Icon = category.icon;
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <SiteLayout>
      {/* HERO WITH TABS — image right, title & tabs left */}
      <section key={category.key} className="relative -mt-[78px] overflow-hidden pb-14 lg:-mt-[90px]">
        <img
          src={category.image}
          alt={category.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-[#05060A]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 pt-32 lg:px-8 lg:pt-40">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
            {/* Left column: eyebrow + title + intro */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
                Nos services
              </p>
              <h1 className="text-5xl font-black leading-none text-white sm:text-6xl">
                {category.title}
              </h1>
              <p className="mt-5 max-w-sm text-sm text-white/75">{category.intro}</p>
            </div>

            {/* Category tabs bar */}
            <div className="glass-strong flex items-center justify-between gap-1 rounded-3xl p-2">
              {CATEGORIES.map((c) => {
                const CIcon = c.icon;
                const isActive = c.key === active;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActive(c.key)}
                    className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-[10px] font-bold uppercase tracking-wider transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white/85"
                    }`}
                  >
                    <CIcon
                      className={`h-6 w-6 ${
                        isActive
                          ? "text-[color:var(--brand-violet)] drop-shadow-[0_0_10px_rgba(139,61,255,0.9)]"
                          : ""
                      }`}
                    />
                    <span>{c.label}</span>
                    {isActive && (
                      <span className="mt-1 h-0.5 w-6 rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.9)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS — horizontal scroller */}
      <section className="relative mx-auto max-w-7xl px-5 pb-10 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
            Les produits
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Précédent"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Suivant"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 backdrop-blur-xl transition hover:border-[color:var(--brand-violet)]/60 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={scroller}
          className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {category.products.map((p) => (
            <div
              key={p.name}
              className="glass card-hover w-[260px] shrink-0 snap-start p-6"
            >
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--brand-violet)]/40 bg-[color:var(--brand-violet)]/10">
                <Icon className="h-6 w-6 text-[color:var(--brand-violet)]" />
              </div>
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/65">{p.desc}</p>
              <p className="mt-5 text-xl font-black gradient-text">{p.price}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 rounded-full bg-[var(--gradient-primary)]" />
          </div>
          <span className="ml-4">{category.products.length} / {category.products.length}</span>
        </div>
      </section>

      {/* PACKS + BENEFITS side-by-side (3 packs + benefits sidebar) */}
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
          Nos packs {category.label.toLowerCase()}
        </p>
        <div className="grid gap-5 lg:grid-cols-4">
          {category.packs.map((pack) => (
            <div
              key={pack.name}
              className={`glass relative p-6 ${
                pack.popular
                  ? "border-[color:var(--brand-violet)]/60 shadow-[0_0_40px_rgba(139,61,255,0.35)]"
                  : ""
              }`}
            >
              {pack.popular && (
                <span className="absolute right-4 top-4 rounded-full bg-[var(--gradient-primary)] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Populaire
                </span>
              )}
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[var(--gradient-primary)] shadow-[0_0_20px_rgba(139,61,255,0.4)]">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {pack.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black gradient-text">{pack.price}</span>
                {pack.oldPrice && (
                  <span className="text-xs text-white/40 line-through">
                    {pack.oldPrice}
                  </span>
                )}
              </div>
              <ul className="mt-5 space-y-2 text-xs text-white/80">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-violet)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="btn-gradient mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold"
              >
                Choisir ce pack <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}

          {/* Benefits sidebar (4th column) */}
          <div className="glass p-6">
            <ul className="space-y-5">
              {BENEFITS.map(({ icon: BIcon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[color:var(--brand-violet)]/40 bg-[color:var(--brand-violet)]/10">
                    <BIcon className="h-4 w-4 text-[color:var(--brand-violet)]" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white">{title}</h4>
                    <p className="text-xs text-white/60">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center text-white/40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em]">
            Scroller pour découvrir
          </p>
          <ChevronDown className="mt-2 h-5 w-5 animate-bounce" />
        </div>
      </section>
    </SiteLayout>
  );
}