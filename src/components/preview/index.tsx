
import React, { useEffect, useMemo, useState, useRef } from "react";
import throttle from "lodash/throttle";
import { toast } from "sonner";
import { DEFAULT_TEMPLATES } from "@/config";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { useAutoOnePage } from "@/hooks/useAutoOnePage";
import { useTranslations } from "@/i18n/compat/client";
import { normalizeFontFamily } from "@/utils/fonts";
import ResumeTemplateComponent from "../templates";

interface PreviewPanelProps {
  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
  toggleSidePanel: () => void;
  toggleEditPanel: () => void;
  togglePreviewPanel: () => void;
}

const PageBreakLine = React.memo(
  ({
    pageNumber,
    contentPerPagePx,
    pagePadding,
  }: {
    pageNumber: number;
    contentPerPagePx: number;
    pagePadding: number;
  }) => {
    // In preview, #resume-preview has padding-top; content starts at pagePadding.
    // Each page holds contentPerPagePx of content (matches Puppeteer PDF margin).
    // End of page N = pagePadding + N * contentPerPagePx.
    const top = pagePadding + pageNumber * contentPerPagePx;

    return (
      <div
        className="absolute left-0 right-0 pointer-events-none page-break-line"
        style={{ top: `${top}px` }}
      >
        <div className="relative w-full">
          <div className="absolute w-full border-t-2 border-dashed border-red-400" />
          <div className="absolute right-0 -top-6 text-xs text-red-500">
            Akhir halaman {pageNumber}
          </div>
        </div>
      </div>
    );
  }
);

PageBreakLine.displayName = "PageBreakLine";

const PreviewPanel = React.forwardRef<HTMLDivElement, PreviewPanelProps>(
  (
    {
      sidePanelCollapsed,
      editPanelCollapsed,
      previewPanelCollapsed,
      toggleSidePanel,
      toggleEditPanel,
      togglePreviewPanel,
    },
    ref
  ) => {
    const { activeResume, setActiveSection } = useResumeStore();
    const selectedFontFamily = normalizeFontFamily(
      activeResume?.globalSettings?.fontFamily
    );
    const t = useTranslations("previewDock");
    const template = useMemo(() => {
      return (
        DEFAULT_TEMPLATES.find((t) => t.id === activeResume?.templateId) ||
        DEFAULT_TEMPLATES[0]
      );
    }, [activeResume?.templateId]);

    const startRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const internalResumeContentRef = useRef<HTMLDivElement>(null);
    const resumeContentRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalResumeContentRef;
    const [contentHeight, setContentHeight] = useState(0);

    const updateContentHeight = () => {
      if (resumeContentRef.current) {
        const height = resumeContentRef.current.clientHeight;
        if (height > 0) {
          if (height !== contentHeight) {
            setContentHeight(height);
          }
        }
      }
    };

    useEffect(() => {
      const debouncedUpdate = throttle(() => {
        requestAnimationFrame(() => {
          updateContentHeight();
        });
      }, 100);

      const observer = new MutationObserver(debouncedUpdate);

      if (resumeContentRef.current) {
        observer.observe(resumeContentRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });

        updateContentHeight();
      }

      const resizeObserver = new ResizeObserver(debouncedUpdate);

      if (resumeContentRef.current) {
        resizeObserver.observe(resumeContentRef.current);
      }

      return () => {
        observer.disconnect();
        resizeObserver.disconnect();
      };
    }, []);

    useEffect(() => {
      if (activeResume) {
        const timer = setTimeout(updateContentHeight, 300);
        return () => clearTimeout(timer);
      }
    }, [activeResume]);

    const pagePadding = activeResume?.globalSettings?.pagePadding || 0;
    const autoOnePageEnabled = activeResume?.globalSettings?.autoOnePage || false;

    const { scaleFactor, isScaled, cannotFit } = useAutoOnePage({
      contentHeight,
      pagePadding,
      enabled: autoOnePageEnabled,
    });

    useEffect(() => {
      if (cannotFit) {
        toast.warning(t("autoOnePage.cannotFit"), {
          duration: 4000,
        });
      }
    }, [cannotFit, t]);

    const { contentPerPagePx, pageBreakCount } = useMemo(() => {
      const MM_TO_PX = 3.78;
      const A4_HEIGHT_PX = 297 * MM_TO_PX;

      // Matches Puppeteer PDF export: margin = pagePadding px (top + bottom)
      // Per-page content height = A4 total - top margin - bottom margin
      const baseContentPerPage = A4_HEIGHT_PX - 2 * pagePadding;

      // Hide page-break lines only when one-page mode is active and fits perfectly
      // When cannotFit, keep the lines because content still overflows
      if ((isScaled && !cannotFit) || contentHeight <= 0) {
        return { contentPerPagePx: baseContentPerPage, pageBreakCount: 0 };
      }

      // When scaled, each page (in local coords) holds more content
      // Visually, effectiveContentPerPage * scaleFactor = baseContentPerPage
      const effectiveContentPerPage = isScaled
        ? baseContentPerPage / scaleFactor
        : baseContentPerPage;

      // contentHeight includes #resume-preview padding (top+bottom)
      // Actual content height = contentHeight - 2 * pagePadding
      const actualContentHeight = contentHeight - 2 * pagePadding;
      const pageCount = Math.max(1, Math.ceil(actualContentHeight / effectiveContentPerPage));
      const pageBreakCount = Math.max(0, pageCount - 1);

      return { contentPerPagePx: effectiveContentPerPage, pageBreakCount };
    }, [contentHeight, pagePadding, isScaled, cannotFit, scaleFactor]);

    if (!activeResume) return null;

    const handlePreviewClickCapture = (
      event: React.MouseEvent<HTMLDivElement>
    ) => {
      const target = event.target as HTMLElement | null;
      const sectionElement = target?.closest<HTMLElement>(
        "[data-resume-section-id]"
      );
      const sectionId = sectionElement?.dataset.resumeSectionId;

      if (!sectionId || sectionId === activeResume.activeSection) {
        return;
      }

      setActiveSection(sectionId);
    };

    return (
      <div
        ref={previewRef}
        className="relative w-full h-full  bg-gray-100"
        style={{
          fontFamily: selectedFontFamily,
        }}
      >
        <div className="py-4 ml-4 px-4 min-h-screen flex justify-center scale-[58%] origin-top md:scale-90 md:origin-top-left">
          <div
            ref={startRef}
            className={cn(
              "w-[210mm] min-w-[210mm] min-h-[297mm]",
              "bg-white",
              "shadow-lg",
              "relative mx-auto"
            )}
          >
            <div
              ref={resumeContentRef}
              id="resume-preview"
              onClickCapture={handlePreviewClickCapture}
              style={{
                fontFamily: selectedFontFamily,
                padding: `${activeResume.globalSettings?.pagePadding}px`,
                ...(isScaled
                  ? {
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: "top left",
                    width: `${100 / scaleFactor}%`,
                  }
                  : {}),
              }}
              className="relative"
            >
              <style jsx global>{`
              .grammar-error {
                cursor: help;
                border-bottom: 2px dashed;
                transition: background-color 0.2s ease;
              }

              .grammar-error.spelling {
                border-color: #ef4444;
              }

              .grammar-error.grammar {
                border-color: #f59e0b;
              }

              .grammar-error:hover {
                background-color: rgba(239, 68, 68, 0.1);
              }

              /* Use attribute selector to match all active-* classes */
              .grammar-error[class*="active-"] {
                animation: highlight 2s ease-in-out;
              }

              @keyframes highlight {
                0% {
                  background-color: transparent;
                }
                20% {
                  background-color: rgba(239, 68, 68, 0.2);
                }
                80% {
                  background-color: rgba(239, 68, 68, 0.2);
                }
                100% {
                  background-color: transparent;
                }
              }
            `}</style>
              <ResumeTemplateComponent data={activeResume} template={template} />
              {contentHeight > 0 && (
                <>
                  <div key={`page-breaks-container-${contentHeight}`}>
                    {Array.from(
                      { length: Math.min(pageBreakCount, 20) },
                      (_, i) => {
                        const pageNumber = i + 1;

                        const pageLinePosition =
                          pagePadding + pageNumber * contentPerPagePx;

                        if (pageLinePosition <= contentHeight) {
                          return (
                            <PageBreakLine
                              key={`page-break-${pageNumber}`}
                              pageNumber={pageNumber}
                              contentPerPagePx={contentPerPagePx}
                              pagePadding={pagePadding}
                            />
                          );
                        }
                        return null;
                      }
                    ).filter(Boolean)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
