import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <main className="pt-[78px] lg:pt-[90px]">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  bgImage,
  bgAlt,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  children?: ReactNode;
  bgImage?: string;
  bgAlt?: string;
}) {
  return (
    <section className="relative overflow-hidden">
      {bgImage ? (
        <>
          <img
            src={bgImage}
            alt={bgAlt ?? ""}
            aria-hidden={bgAlt ? undefined : true}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/85 to-[#05060A]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:var(--gradient-radial)]" />
      )}
      <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] gradient-text">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}