import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Facebook, Instagram, Linkedin, Youtube, ArrowRight, Check } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import heroContact from "@/assets/hero-contact.jpg";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — DODRICOM" },
      { name: "description", content: "Contactez DODRICOM pour un devis, une démo ou une simple question. Réponse sous 24h." },
    ],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contact"
        title={<>Parlons de votre <span className="gradient-text">projet</span>.</>}
        subtitle="Notre équipe vous répond sous 24 h avec un devis clair et détaillé."
        bgImage={heroContact}
        bgAlt="Hub de communication DODRICOM néon"
      />

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="glass p-8">
              <h3 className="text-xl font-bold text-white">Nos coordonnées</h3>
              <ul className="mt-6 space-y-5 text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-[color:var(--brand-violet)]" />
                  <div>
                    <div className="font-semibold text-white">Adresse</div>
                    <div className="text-white/70">Boulevard Zerktouni, Casablanca, Maroc</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-[color:var(--brand-violet)]" />
                  <div>
                    <div className="font-semibold text-white">Téléphone</div>
                    <div className="text-white/70">+212 5 22 00 00 00</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-[color:var(--brand-violet)]" />
                  <div>
                    <div className="font-semibold text-white">Email</div>
                    <div className="text-white/70">contact@dodricom.com</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-[color:var(--brand-violet)]" />
                  <div>
                    <div className="font-semibold text-white">Horaires</div>
                    <div className="text-white/70">Lun. – Ven. · 9h – 19h</div>
                  </div>
                </li>
              </ul>

              <div className="mt-8">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">Suivez-nous</div>
                <div className="flex gap-3">
                  {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                    <a key={i} href="#" aria-label="Social" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-[color:var(--brand-violet)] hover:text-white hover:shadow-[0_0_20px_rgba(139,61,255,0.5)]">
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass mt-6 overflow-hidden p-0">
              <iframe
                title="Carte DODRICOM"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-7.65%2C33.55%2C-7.58%2C33.60&layer=mapnik"
                className="h-64 w-full opacity-90"
                loading="lazy"
              />
            </div>
          </aside>

          <div className="lg:col-span-8">
            <form
              className="glass p-8 lg:p-10"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom complet" name="name" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Téléphone" name="phone" type="tel" />
                <Field label="Sujet" name="subject" required />
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">Message</span>
                <textarea
                  name="message"
                  rows={6}
                  required
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-violet)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-violet)]/30"
                  placeholder="Décrivez brièvement votre projet…"
                />
              </label>

              <label className="mt-5 flex items-start gap-3 text-sm text-white/70">
                <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[color:var(--brand-violet)] focus:ring-[color:var(--brand-violet)]" />
                J'accepte que mes données soient utilisées pour être recontacté conformément au RGPD.
              </label>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button type="submit" className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">
                  Envoyer le message <ArrowRight className="h-4 w-4" />
                </button>
                {sent && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
                    <Check className="h-4 w-4" /> Merci ! Nous vous répondons sous 24 h.
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[color:var(--brand-violet)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-violet)]/30"
      />
    </label>
  );
}