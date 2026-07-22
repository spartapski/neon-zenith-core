import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import Lenis from "lenis";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MousePointer2 } from "lucide-react";
import exteriorImg from "@/assets/scene-exterior.jpg";
import doorsImg from "@/assets/scene-doors.jpg";
import interiorImg from "@/assets/scene-interior.jpg";

/**
 * Cinematic scroll-driven camera sequence:
 * Exterior (0-0.35) → Doors opening (0.25-0.6) → Interior reception (0.55-0.85)
 * → Presentation content fade-in (0.85-1).
 */
export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.6,
  });

  // Exterior building: walk toward it → scale up, fade out
  const exteriorScale = useTransform(progress, [0, 0.4], [1, 3.6]);
  const exteriorOpacity = useTransform(progress, [0, 0.3, 0.42], [1, 1, 0]);
  const exteriorBlur = useTransform(progress, [0.25, 0.42], [0, 8]);
  const exteriorFilter = useTransform(exteriorBlur, (b) => `blur(${b}px)`);

  // Doors: appear as we near entrance, then push past
  const doorsScale = useTransform(progress, [0.3, 0.7], [1.05, 3.2]);
  const doorsOpacity = useTransform(progress, [0.28, 0.42, 0.65, 0.72], [0, 1, 1, 0]);
  // Two door halves sliding open
  const leftDoorX = useTransform(progress, [0.45, 0.65], ["0%", "-55%"]);
  const rightDoorX = useTransform(progress, [0.45, 0.65], ["0%", "55%"]);
  const doorsGap = useTransform(progress, [0.45, 0.65], [0, 1]);

  // Interior reception: emerge from center, settle to natural framing
  const interiorScale = useTransform(progress, [0.55, 0.92], [1.5, 1]);
  const interiorOpacity = useTransform(progress, [0.55, 0.75], [0, 1]);

  // Hero text overlay fades out early
  const heroOpacity = useTransform(progress, [0, 0.12, 0.22], [1, 1, 0]);
  const heroY = useTransform(progress, [0, 0.22], [0, -60]);

  // Presentation content fades in at the end
  const presOpacity = useTransform(progress, [0.82, 0.95], [0, 1]);
  const presY = useTransform(progress, [0.82, 1], [40, 0]);

  // Ambient light pulse for exterior logo glow
  const glowOpacity = useTransform(progress, [0, 0.4], [1, 0]);

  // Scroll hint fades out immediately
  const hintOpacity = useTransform(progress, [0, 0.08], [1, 0]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "550vh" }}>
      {/* Progress rail */}
      <ScrollRail progress={progress} />

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05060A]">
        {/* Scene 1 — Exterior building */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: exteriorScale, opacity: exteriorOpacity, filter: exteriorFilter }}
        >
          <img
            src={exteriorImg}
            alt="Siège DODRICOM la nuit"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          {/* Ambient pulsing glow around logo */}
          <motion.div
            className="pointer-events-none absolute inset-0 animate-pulse-glow"
            style={{ opacity: glowOpacity }}
          >
            <div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--brand-violet)]/40 blur-3xl" />
          </motion.div>
          {/* Vignette + fog */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-[#05060A]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#05060A_95%)]" />
          <FloatingParticles />
        </motion.div>

        {/* Scene 2 — Doors */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: doorsScale, opacity: doorsOpacity }}
        >
          <img
            src={doorsImg}
            alt="Portes d'entrée en verre du siège DODRICOM"
            width={1920}
            height={1080}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {/* Door split reveal — two halves sliding apart, revealing interior underneath */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 origin-right"
            style={{ x: leftDoorX }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            <motion.div
              className="absolute right-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[color:var(--brand-violet)] to-transparent shadow-[0_0_20px_var(--brand-violet)]"
              style={{ opacity: doorsGap }}
            />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 origin-left"
            style={{ x: rightDoorX }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
            <motion.div
              className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-[color:var(--brand-blue)] to-transparent shadow-[0_0_20px_var(--brand-blue)]"
              style={{ opacity: doorsGap }}
            />
          </motion.div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#05060A_95%)]" />
        </motion.div>

        {/* Scene 3 — Interior reception */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ scale: interiorScale, opacity: interiorOpacity }}
        >
          <img
            src={interiorImg}
            alt="Hall de réception DODRICOM"
            width={1920}
            height={1080}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05060A]/40 via-transparent to-[#05060A]/80" />
        </motion.div>

        {/* Hero overlay (initial state) */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
                <Sparkles className="h-4 w-4" />
                Bienvenue chez DODRICOM
              </p>
              <h1 className="text-5xl font-black leading-[0.95] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] sm:text-7xl lg:text-[6.5rem]">
                L'innovation
                <br />
                qui transforme
                <br />
                <span className="gradient-text">votre entreprise</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg text-white/85">
                Franchissez les portes de DODRICOM. Domotique, Digital, Réseaux, IA,
                Communication et Événementiel — un écosystème premium au service de
                votre performance.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/services"
                  className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Découvrir <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact"
                  className="btn-ghost-glow inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-white/70"
          style={{ opacity: hintOpacity }}
        >
          <MousePointer2 className="h-4 w-4 animate-bounce" />
          <span className="text-[10px] font-medium uppercase tracking-[0.4em]">
            Scroll pour entrer
          </span>
        </motion.div>

        {/* Presentation content — appears once camera stops in reception */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ opacity: presOpacity, y: presY }}
        >
          <div className="pointer-events-auto mx-auto w-full max-w-5xl px-5 text-center lg:px-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] gradient-text">
              Qui sommes-nous
            </p>
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Un écosystème d'expertises,
              <br />
              une seule <span className="gradient-text">signature</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80">
              Vous êtes à l'intérieur. Ici, chaque discipline — de la domotique à l'IA —
              travaille comme une équipe. Notre mission : transformer vos ambitions en
              systèmes qui performent.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/a-propos"
                className="btn-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                Notre histoire <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="btn-ghost-glow inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Explorer nos services
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ScrollRail({ progress }: { progress: MotionValue<number> }) {
  const height = useTransform(progress, [0, 1], ["0%", "100%"]);
  return (
    <div className="pointer-events-none fixed right-4 top-1/2 z-40 hidden h-40 w-[2px] -translate-y-1/2 rounded-full bg-white/10 lg:block">
      <motion.div
        className="w-full rounded-full bg-[var(--gradient-primary)] shadow-[0_0_10px_rgba(139,61,255,0.8)]"
        style={{ height }}
      />
    </div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 37) % 100;
        const delay = (i % 6) * 0.4;
        const size = 2 + (i % 3);
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white/40 blur-[1px]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              animation: `float 6s ease-in-out ${delay}s infinite`,
              boxShadow: "0 0 8px rgba(180,124,255,0.6)",
            }}
          />
        );
      })}
    </div>
  );
}