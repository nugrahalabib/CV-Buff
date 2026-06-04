import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ResumeTemplateComponent from "@/components/templates";
import { initialResumeState, initialResumeStateEn } from "@/config/initialResumeData";
import type { ResumeTemplate } from "@/types/template";
import { normalizeFontFamily } from "@/utils/fonts";
import { Eye, Palette, Sparkles } from "lucide-react";

const A4_WIDTH_PX = 793.700787;
const PREVIEW_MODAL_SCALE = 0.529166667;

const PRESET_COLORS = [
  { name: "default", value: "" },
  { name: "blue", value: "#3b82f6" },
  { name: "green", value: "#10b981" },
  { name: "purple", value: "#8b5cf6" },
  { name: "orange", value: "#f97316" },
  { name: "red", value: "#ef4444" },
  { name: "slate", value: "#475569" },
  { name: "black", value: "#000000" },
];

const getTemplateKey = (templateId: string) =>
  templateId === "left-right" ? "leftRight" : templateId;

type TemplatePreviewBaseData =
  | typeof initialResumeState
  | typeof initialResumeStateEn;

const buildTemplatePreviewData = (
  baseData: TemplatePreviewBaseData,
  template: ResumeTemplate,
  selectedColor: string,
  mockId: string
) =>
({
  ...baseData,
  id: mockId,
  templateId: template.id,
  globalSettings: {
    ...baseData.globalSettings,
    themeColor: selectedColor || template.colorScheme.primary,
    sectionSpacing: template.spacing.sectionGap,
    paragraphSpacing: template.spacing.itemGap,
    pagePadding: template.spacing.contentPadding,
  },
  basic: {
    ...baseData.basic,
    layout: template.basic.layout,
  },
} as any);

interface TemplateCardItemProps {
  index: number;
  template: ResumeTemplate;
  templateName: string;
  templateDescription: string;
  baseData: TemplatePreviewBaseData;
  selectedColor: string;
  onPreview: () => void;
  onUseTemplate: () => void;
  previewLabel: string;
  useTemplateLabel: string;
}

const TemplateCardItem = ({
  index,
  template,
  templateName,
  templateDescription,
  baseData,
  selectedColor,
  onPreview,
  onUseTemplate,
  previewLabel,
  useTemplateLabel,
}: TemplateCardItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.24);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setScale(width / A4_WIDTH_PX);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const previewData = buildTemplatePreviewData(
    baseData,
    template,
    selectedColor,
    `template-preview-${template.id}`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4) }}
      whileHover={{ y: -4 }}
      className="group/card flex flex-col"
    >
      <Card
        className={cn(
          "relative flex flex-col overflow-hidden rounded-2xl border bg-card",
          "border-black/5 ring-1 ring-black/[0.03] dark:border-white/10 dark:ring-white/[0.02]",
          "shadow-sm transition-all duration-300",
          "group-hover/card:border-primary/30 group-hover/card:shadow-xl group-hover/card:shadow-primary/5",
          "focus-within:border-primary/30 focus-within:shadow-xl focus-within:shadow-primary/5"
        )}
      >
        {/* PREVIEW — the hero */}
        <div
          className="relative aspect-[210/297] cursor-pointer overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/60 dark:from-gray-900 dark:to-gray-950"
          onClick={onPreview}
          role="button"
          tabIndex={0}
          aria-label={`${previewLabel}: ${templateName}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPreview();
            }
          }}
        >
          {/* subtle inset inner frame */}
          <div className="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.04]" />

          <div
            className="absolute inset-0 flex items-start justify-center overflow-hidden pt-3 pointer-events-none transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
            ref={containerRef}
          >
            <div className="relative h-full w-full origin-top bg-white">
              <div
                className="absolute left-0 top-0 bg-white"
                style={{
                  width: "210mm",
                  height: "297mm",
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  padding: `${template.spacing.contentPadding}px`,
                  fontFamily: normalizeFontFamily(
                    previewData.globalSettings?.fontFamily
                  ),
                }}
              >
                <ResumeTemplateComponent data={previewData} template={template} />
              </div>
            </div>
          </div>

          {/* Soft glass hover overlay with the two safe, obvious choices */}
          <div
            className={cn(
              "absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 p-5",
              "bg-white/55 backdrop-blur-[3px] dark:bg-gray-950/55",
              "opacity-0 transition-opacity duration-300",
              "group-hover/card:opacity-100 focus-within:opacity-100"
            )}
          >
            <motion.div
              initial={false}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-full max-w-[200px]"
            >
              <Button
                className="w-full rounded-xl shadow-lg shadow-primary/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseTemplate();
                }}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                {useTemplateLabel}
              </Button>
            </motion.div>

            <motion.div
              initial={false}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-full max-w-[200px]"
            >
              <Button
                variant="outline"
                className="w-full rounded-xl border-black/10 bg-white/70 backdrop-blur-sm hover:bg-white dark:border-white/15 dark:bg-gray-900/60 dark:hover:bg-gray-900"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {previewLabel}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Clean info row — name + description, clearly separated from the preview */}
        <CardContent className="flex flex-col gap-1 border-t border-black/[0.04] bg-card px-4 py-3.5 dark:border-white/[0.06]">
          <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            {templateName}
          </span>
          <span className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {templateDescription}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const TemplatesPage = () => {
  const t = useTranslations("dashboard.templates");
  const locale = useLocale();
  const router = useRouter();
  const createResume = useResumeStore((state) => state.createResume);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  // Default to "" so each template renders in ITS OWN designed color (no auto-cycle, no flicker).
  const [selectedColor, setSelectedColor] = useState<string>("");

  const handleColorSelect = (value: string) => {
    setSelectedColor(value);
  };

  const baseData = locale === "en" ? initialResumeStateEn : initialResumeState;
  const activePreviewTemplate =
    DEFAULT_TEMPLATES.find((template) => template.id === previewTemplate) ??
    null;

  const swatchLabel = (name: string) =>
    name === "default" ? t("colorOriginal") : t(`color.${name}`);

  const handleCreateResume = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) return;

    const resumeId = createResume(templateId);
    const { resumes, updateResume } = useResumeStore.getState();
    const resume = resumes[resumeId];

    if (resume) {
      updateResume(resumeId, {
        globalSettings: {
          ...resume.globalSettings,
          themeColor: selectedColor || template.colorScheme.primary,
          sectionSpacing: template.spacing.sectionGap,
          paragraphSpacing: template.spacing.itemGap,
          pagePadding: template.spacing.contentPadding,
        },
        basic: {
          ...resume.basic,
          layout: template.basic.layout,
        },
      });
    }

    router.push(`/app/workbench/${resumeId}`);
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8">
          {/* Guiding, reassuring header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                {t("title")}
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>

            {/* Sleek single-line color picker */}
            <TooltipProvider delayDuration={150}>
              <div
                className={cn(
                  "flex items-center gap-2.5 self-start rounded-full border px-3.5 py-2 lg:self-auto",
                  "border-black/5 bg-card/70 ring-1 ring-black/[0.03] backdrop-blur-sm",
                  "dark:border-white/10 dark:bg-card/40 dark:ring-white/[0.02]"
                )}
              >
                <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <Palette className="h-3.5 w-3.5" />
                  {t("colorLabel")}
                </span>
                <span className="h-5 w-px shrink-0 bg-border/70" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((color) => {
                    const isActive = selectedColor === color.value;
                    return (
                      <Tooltip key={color.name}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleColorSelect(color.value)}
                            aria-label={swatchLabel(color.name)}
                            aria-pressed={isActive}
                            className={cn(
                              "h-7 w-7 shrink-0 rounded-full transition-transform duration-200 hover:scale-110",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                              isActive
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
                                : "ring-1 ring-inset ring-black/10 dark:ring-white/20"
                            )}
                            style={
                              color.value
                                ? { backgroundColor: color.value }
                                : {
                                    background:
                                      "conic-gradient(from 140deg, #3b82f6, #10b981, #8b5cf6, #f97316, #ef4444, #475569, #3b82f6)",
                                  }
                            }
                          />
                        </TooltipTrigger>
                        <TooltipContent>{swatchLabel(color.name)}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </TooltipProvider>
          </motion.div>

          {/* Gallery */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {DEFAULT_TEMPLATES.map((template, index) => {
              const templateKey = getTemplateKey(template.id);
              return (
                <TemplateCardItem
                  key={template.id}
                  index={index}
                  template={template}
                  templateName={t(`${templateKey}.name`)}
                  templateDescription={t(`${templateKey}.description`)}
                  baseData={baseData}
                  selectedColor={selectedColor}
                  onPreview={() => setPreviewTemplate(template.id)}
                  onUseTemplate={() => handleCreateResume(template.id)}
                  previewLabel={t("preview")}
                  useTemplateLabel={t("useTemplate")}
                />
              );
            })}
          </div>

          {/* On-brand preview modal */}
          <Dialog
            open={!!previewTemplate}
            onOpenChange={(open) => {
              if (!open) setPreviewTemplate(null);
            }}
          >
            <AnimatePresence>
              {activePreviewTemplate && (
                <DialogContent className="max-w-[680px] overflow-hidden rounded-2xl border border-black/5 bg-card p-0 shadow-2xl shadow-primary/5 ring-1 ring-black/[0.03] dark:border-white/10 dark:ring-white/[0.02]">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-3 border-b border-black/[0.04] px-5 py-4 dark:border-white/[0.06]">
                      <div className="flex flex-col gap-0.5">
                        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                          {t(
                            `${getTemplateKey(activePreviewTemplate.id)}.name`
                          )}
                        </DialogTitle>
                        <p className="text-[12px] text-muted-foreground">
                          {t(
                            `${getTemplateKey(
                              activePreviewTemplate.id
                            )}.description`
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pointer-events-none flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100/70 py-8 dark:from-gray-900 dark:to-gray-950">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${activePreviewTemplate.id}-${selectedColor}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="relative overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/5"
                          style={{ width: "420px", height: "594px" }}
                        >
                          <div
                            className="absolute left-0 top-0 bg-white"
                            style={{
                              width: "210mm",
                              height: "297mm",
                              transform: `scale(${PREVIEW_MODAL_SCALE})`,
                              transformOrigin: "top left",
                              padding: `${activePreviewTemplate.spacing.contentPadding}px`,
                              fontFamily: normalizeFontFamily(
                                buildTemplatePreviewData(
                                  baseData,
                                  activePreviewTemplate,
                                  selectedColor,
                                  "template-preview-modal"
                                ).globalSettings?.fontFamily
                              ),
                            }}
                          >
                            <ResumeTemplateComponent
                              data={buildTemplatePreviewData(
                                baseData,
                                activePreviewTemplate,
                                selectedColor,
                                "preview-mock-id-large"
                              )}
                              template={activePreviewTemplate}
                            />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 border-t border-black/[0.04] px-5 py-4 dark:border-white/[0.06]">
                      <p className="hidden flex-1 text-[12px] text-muted-foreground sm:block">
                        {t("reassure")}
                      </p>
                      <Button
                        className="w-full rounded-xl shadow-lg shadow-primary/20 sm:w-auto sm:min-w-[200px]"
                        onClick={() => {
                          const templateId = activePreviewTemplate.id;
                          setPreviewTemplate(null);
                          handleCreateResume(templateId);
                        }}
                      >
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        {t("useTemplate")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              )}
            </AnimatePresence>
          </Dialog>
        </div>
      </div>
    </ScrollArea>
  );
};

export const runtime = "edge";

export default TemplatesPage;
