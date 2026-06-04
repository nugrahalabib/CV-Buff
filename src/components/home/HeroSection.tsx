import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Play, Clock, Download, Lock } from "lucide-react";
import AnimatedFeature from "./client/AnimatedFeature";
import GoDashboard from "./GoDashboard";
import HeroMockup from "./client/HeroMockup";

export default function HeroSection() {
  const t = useTranslations("home");

  const trust = [
    { icon: Clock, label: t("hero.trust1") },
    { icon: Download, label: t("hero.trust2") },
    { icon: Lock, label: t("hero.trust3") },
  ];

  return (
    <section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-background pb-24 pt-32">
      {/* Industrial grid — presisi data, memudar ke tepi */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(var(--grid-rgb,120 120 120)/0.12) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--grid-rgb,120 120 120)/0.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 35%, black 40%, transparent 100%)",
        }}
      />

      {/* Ambient glow — kedalaman 3D di belakang panel */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />
        <div className="absolute left-[12%] top-[30%] h-72 w-72 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-[12%] top-[40%] h-80 w-80 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-5xl px-6 text-center">
        <AnimatedFeature>
          {/* Badge kapsul — bingkai gradient metalik/neon tipis */}
          <div className="mb-9 inline-flex rounded-full bg-gradient-to-r from-primary/50 via-blue-500/40 to-primary/50 p-[1px] shadow-[0_0_24px_-6px] shadow-primary/40">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-1.5 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold tracking-wide text-foreground/90">
                {t("hero.badge")}
              </span>
              <span className="hidden h-3.5 w-px bg-border sm:block" />
              <span className="hidden bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-[13px] font-semibold text-transparent sm:inline">
                {t("hero.badgePowered")}
              </span>
            </div>
          </div>

          <h1 className="mx-auto mb-6 max-w-4xl font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {t("hero.title")}
            <span className="mt-3 block bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-2xl font-semibold text-transparent sm:text-3xl md:text-4xl">
              {t("hero.titleAccent")}
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GoDashboard>
              <Button
                size="lg"
                className="group h-14 rounded-xl px-10 text-base font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98] sm:px-12"
              >
                {t("hero.cta")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </GoDashboard>

            <GoDashboard type="templates">
              <Button
                variant="outline"
                size="lg"
                className="h-14 rounded-xl border-border/70 bg-background/60 px-8 text-base font-medium backdrop-blur-sm transition-all hover:bg-secondary/80 active:scale-[0.98]"
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                {t("hero.secondary")}
              </Button>
            </GoDashboard>
          </div>

          {/* Microcopy trust — friction-killer di bawah CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trust.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </AnimatedFeature>

        <div className="mt-16 sm:mt-20">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
