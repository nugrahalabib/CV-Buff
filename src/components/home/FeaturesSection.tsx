import { useTranslations } from "@/i18n/compat/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedFeature from "./client/AnimatedFeature";
import FeatureAiMockup from "./client/FeatureAiMockup";
import FeatureStorageMockup from "./client/FeatureStorageMockup";

const features = [
  {
    icon: Zap,
    badge: "features.ai.badge",
    badgeColor: "bg-primary/10 text-primary ring-1 ring-primary/15",
    title: "features.ai.title",
    description: "features.ai.description",
    items: [
      { title: "features.ai.item1", description: "features.ai.item1_description" },
      { title: "features.ai.item2", description: "features.ai.item2_description" },
    ],
  },
  {
    icon: ShieldCheck,
    badge: "features.storage.badge",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/15",
    title: "features.storage.title",
    description: "features.storage.description",
    items: [
      { title: "features.storage.item1", description: "features.storage.item1_description" },
      { title: "features.storage.item2", description: "features.storage.item2_description" },
    ],
  },
] as const;

const SLIDE_DURATION = 6000;

export default function FeaturesSection() {
  const t = useTranslations("home");
  const [activeFeatures, setActiveFeatures] = useState<number[]>(
    features.map(() => 0)
  );
  const [progresses, setProgresses] = useState<number[]>(features.map(() => 0));
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>(
    features.map(() => null)
  );

  const startProgressTimer = useCallback((categoryIndex: number) => {
    if (intervalRefs.current[categoryIndex]) {
      clearInterval(intervalRefs.current[categoryIndex] as NodeJS.Timeout);
    }
    const updateInterval = 50;
    const progressIncrement = (updateInterval / SLIDE_DURATION) * 100;

    intervalRefs.current[categoryIndex] = setInterval(() => {
      setProgresses((prev) => {
        const next = [...prev];
        if (next[categoryIndex] < 100) next[categoryIndex] += progressIncrement;
        return next;
      });
    }, updateInterval);
  }, []);

  // Auto-switch saat progress mencapai 100%
  useEffect(() => {
    progresses.forEach((progress, index) => {
      if (progress >= 100) {
        setProgresses((prev) => {
          const next = [...prev];
          next[index] = 0;
          return next;
        });
        setActiveFeatures((prevActive) => {
          const next = [...prevActive];
          const max = features[index].items.length - 1;
          next[index] = next[index] < max ? next[index] + 1 : 0;
          return next;
        });
      }
    });
  }, [progresses]);

  useEffect(() => {
    features.forEach((_, index) => startProgressTimer(index));
    return () => {
      intervalRefs.current.forEach((ref) => {
        if (ref) clearInterval(ref);
      });
    };
  }, [startProgressTimer]);

  const handleSlideChange = (categoryIndex: number, featureIndex: number) => {
    setActiveFeatures((prev) => {
      const next = [...prev];
      next[categoryIndex] = featureIndex;
      return next;
    });
    setProgresses((prev) => {
      const next = [...prev];
      next[categoryIndex] = 0;
      return next;
    });
    startProgressTimer(categoryIndex);
  };

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-40">
      {/* Ambient glow halus — selaras DNA hero */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-24 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[130px]" />
      </div>

      <div className="container mx-auto max-w-6xl px-6">
        <AnimatedFeature>
          <div className="mx-auto mb-20 max-w-3xl text-center md:mb-28">
            <h2 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
              {t("features.title")}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground/80 md:text-xl">
              {t("features.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        <div className="space-y-32 md:space-y-40">
          {features.map((category, catIndex) => (
            <div
              key={catIndex}
              className={cn(
                "flex flex-col items-center gap-12 lg:gap-20",
                catIndex % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              )}
            >
              {/* Text Side */}
              <div className="w-full space-y-9 lg:w-5/12">
                <AnimatedFeature delay={0.1}>
                  <div className="space-y-6">
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold",
                        category.badgeColor
                      )}
                    >
                      <category.icon className="h-4 w-4" />
                      {t(category.badge)}
                    </div>
                    <h3 className="font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                      {t(category.title)}
                    </h3>
                    <p className="text-lg font-light leading-relaxed text-muted-foreground/90">
                      {t(category.description)}
                    </p>
                  </div>
                </AnimatedFeature>

                <div className="space-y-2.5">
                  {category.items.map((item, itemIndex) => {
                    const isActive = activeFeatures[catIndex] === itemIndex;
                    return (
                      <button
                        key={itemIndex}
                        onClick={() => handleSlideChange(catIndex, itemIndex)}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-xl px-5 py-4 text-left transition-all duration-300",
                          isActive
                            ? "bg-primary/[0.06] dark:bg-primary/[0.1]"
                            : "hover:bg-secondary/50 hover:shadow-[0_6px_28px_-14px] hover:shadow-primary/40"
                        )}
                      >
                        {/* Indikator aktif: bar vertikal kiri + progress */}
                        {isActive && (
                          <span className="absolute left-0 top-0 h-full w-1 overflow-hidden rounded-r bg-primary/15">
                            <span
                              className="block w-full rounded-r bg-gradient-to-b from-primary to-blue-500 transition-[height] duration-75 ease-linear"
                              style={{ height: `${progresses[catIndex]}%` }}
                            />
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4
                              className={cn(
                                "font-semibold transition-colors",
                                isActive
                                  ? "text-foreground"
                                  : "text-foreground/55 group-hover:text-foreground/80"
                              )}
                            >
                              {t(item.title)}
                            </h4>
                            <p className="line-clamp-1 text-sm text-muted-foreground/80">
                              {t(item.description)}
                            </p>
                          </div>
                          <ChevronRight
                            className={cn(
                              "mt-0.5 h-5 w-5 shrink-0 transition-all",
                              isActive
                                ? "translate-x-0.5 text-primary"
                                : "text-muted-foreground/30 group-hover:text-muted-foreground/60"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mockup Side */}
              <div className="w-full lg:w-7/12">
                <AnimatedFeature delay={0.2}>
                  {catIndex === 0 ? (
                    <FeatureAiMockup active={activeFeatures[catIndex]} />
                  ) : (
                    <FeatureStorageMockup active={activeFeatures[catIndex]} />
                  )}
                </AnimatedFeature>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
