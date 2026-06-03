
import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit2, Menu, PanelLeft, Minimize2 } from "lucide-react";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { EditPanel } from "@/components/editor/EditPanel";
import PreviewPanel from "@/components/preview";
import PreviewDock from "@/components/preview/PreviewDock";
import { MobileWorkbench } from "@/components/mobile/MobileWorkbench";
import { PanelResizeHandle } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LAYOUT_CONFIG = {
  DEFAULT: [20, 32, 48],
  SIDE_COLLAPSED: [50, 50],
  EDIT_FOCUSED: [20, 80],
  PREVIEW_FOCUSED: [20, 80],
};

const DragHandle = ({ show = true }) => {
  if (!show) return null;

  return (
    <PanelResizeHandle className="relative flex w-px items-center justify-center outline-none group cursor-col-resize">
      {/* Vertical divider - bottom layer */}
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 z-0 w-[1px] -translate-x-1/2 bg-border",
          "transition-colors duration-200",
          "group-hover:bg-primary/40 group-active:bg-primary/60 data-[resize-handle-state=drag]:bg-primary/60"
        )}
      />
      {/* Expanded drag hot-area */}
      <div className="absolute inset-y-0 left-1/2 z-10 w-5 -translate-x-1/2 bg-transparent" />
      {/* Capsule indicator (w-2: 8px) for visibility */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 z-20 h-7 w-2 -translate-x-1/2 -translate-y-1/2",
          "rounded-full border border-border/80 bg-white dark:bg-neutral-900 shadow-sm", // Force solid background
          "transition-all duration-200",
          "group-hover:border-primary/50 group-hover:scale-110",
          "group-active:border-primary group-active:scale-105"
        )}
      />
    </PanelResizeHandle>
  );
};

const LayoutControls = memo(
  ({
    sidePanelCollapsed,
    editPanelCollapsed,
    previewPanelCollapsed,
    toggleSidePanel,
    toggleEditPanel,
    togglePreviewPanel,
  }: {
    sidePanelCollapsed: boolean;
    editPanelCollapsed: boolean;
    previewPanelCollapsed: boolean;
    toggleSidePanel: () => void;
    toggleEditPanel: () => void;
    togglePreviewPanel: () => void;
  }) => (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "bg-background/80 border border-border",
        "backdrop-blur-sm shadow-lg"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sidePanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleSidePanel}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {sidePanelCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={cn("h-5 w-px mx-1", "bg-border")} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleEditPanel}
            >
              {editPanelCollapsed ? (
                <Edit2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {editPanelCollapsed ? "Buka panel editor" : "Tutup panel editor"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={previewPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={togglePreviewPanel}
            >
              {previewPanelCollapsed ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {previewPanelCollapsed ? "Buka panel preview" : "Tutup panel preview"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
);

LayoutControls.displayName = "LayoutControls";

export const runtime = "edge";

export default function Home() {
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [editPanelCollapsed, setEditPanelCollapsed] = useState(false);
  const [previewPanelCollapsed, setPreviewPanelCollapsed] = useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>(LAYOUT_CONFIG.DEFAULT);

  // Create a ref for the resume content that PreviewDock can access
  // Currently we can't get the inner ref easily across component boundaries
  // But we need to pass a mock or implement forwardRef in PreviewPanel later
  // For now we pass null to satisfy the prop requirement
  const resumeContentRef = React.useRef<HTMLDivElement>(null);

  const toggleSidePanel = () => {
    setSidePanelCollapsed(!sidePanelCollapsed);
  };

  const toggleEditPanel = () => {
    setEditPanelCollapsed(!editPanelCollapsed);
  };

  const togglePreviewPanel = () => {
    setPreviewPanelCollapsed(!previewPanelCollapsed);
  };

  const updateLayout = (sizes: number[]) => {
    setPanelSizes(sizes);
  };

  useEffect(() => {
    // If preview panel is collapsed, no need to auto-collapse sidebar
    if (previewPanelCollapsed) return;

    // Initial screen width check
    if (window.innerWidth < 1440) {
      setSidePanelCollapsed(true);
    }

    // Listen to resize
    const handleResize = () => {
      // On resize, skip if preview panel is collapsed
      if (previewPanelCollapsed) return;

      if (window.innerWidth < 1440) {
        setSidePanelCollapsed(true);
      } else {
        setSidePanelCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [previewPanelCollapsed]);

  useEffect(() => {
    document.body.classList.add("workbench-body-lock");
    return () => {
      document.body.classList.remove("workbench-body-lock");
    };
  }, []);

  useEffect(() => {
    let newSizes = [];

    // Sidebar size
    newSizes.push(sidePanelCollapsed ? 0 : 20);

    // Editor area size
    if (editPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (sidePanelCollapsed) {
        newSizes.push(36);
      } else {
        if (previewPanelCollapsed) {
          newSizes.push(80);
        } else {
          newSizes.push(32);
        }
      }
    }

    // Preview area size
    if (previewPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (editPanelCollapsed && sidePanelCollapsed) {
        newSizes.push(100);
      } else {
        if (editPanelCollapsed) {
          newSizes.push(80);
        } else {
          // If sidebar collapsed but editor expanded, preview=64, editor=36
          if (sidePanelCollapsed) {
            newSizes.push(64);
          } else {
            newSizes.push(48);
          }
        }
      }
    }

    // Ensure total is 100
    const total = newSizes.reduce((a, b) => a + b, 0);
    if (total < 100) {
      const lastNonZeroIndex = newSizes
        .map((size, index) => ({ size, index }))
        .filter(({ size }) => size > 0)
        .pop()?.index;

      if (lastNonZeroIndex !== undefined) {
        newSizes[lastNonZeroIndex] += 100 - total;
      }
    }
    updateLayout([...newSizes]);
  }, [sidePanelCollapsed, editPanelCollapsed, previewPanelCollapsed]);

  return (
    <main
      className={cn(
        "w-full min-h-screen  overflow-hidden",
        "w-full min-h-screen overflow-hidden",
        "bg-background text-foreground"
      )}
    >
      <EditorHeader />
      {/* Desktop layout */}
      <div className="hidden md:block h-[calc(100vh-64px)] relative flex w-full">
        <div className={cn(
          "h-full transition-all duration-300",
          previewPanelCollapsed ? "w-[calc(100%-4rem)]" : "w-full"
        )}>
          <ResizablePanelGroup
            key={panelSizes?.join("-")}
            direction="horizontal"
            className={cn(
              "h-full",
              "h-full",
              "border border-border bg-background"
            )}
          >
            {/* Sidebar panel */}
            {!sidePanelCollapsed && (
              <>
                <ResizablePanel
                  id="side-panel"
                  order={1}
                  defaultSize={panelSizes?.[0]}
                  className="bg-background"
                >
                  <div className="h-full overflow-y-auto">
                    <SidePanel />
                  </div>
                </ResizablePanel>
                <DragHandle />
              </>
            )}

            {/* Editor panel */}
            {!editPanelCollapsed && (
              <>
                <ResizablePanel
                  id="edit-panel"
                  order={2}
                  defaultSize={panelSizes?.[1]}
                  className="bg-background"
                >
                  <div className="h-full">
                    <EditPanel />
                  </div>
                </ResizablePanel>
                <DragHandle />
              </>
            )}
            {/* Preview panel - hidden via CSS instead of conditional render so #resume-preview stays in DOM during export */}
            <ResizablePanel
              id="preview-panel"
              order={3}
              collapsible={false}
              defaultSize={panelSizes?.[2]}
              className={cn("bg-gray-100", previewPanelCollapsed && "hidden")}
            >
              <div
                className="h-full overflow-y-auto"
                data-preview-scroll-container="true"
              >
                <PreviewPanel
                  sidePanelCollapsed={sidePanelCollapsed}
                  editPanelCollapsed={editPanelCollapsed}
                  previewPanelCollapsed={previewPanelCollapsed}
                  toggleSidePanel={toggleSidePanel}
                  toggleEditPanel={toggleEditPanel}
                  togglePreviewPanel={togglePreviewPanel}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <PreviewDock
          sidePanelCollapsed={sidePanelCollapsed}
          editPanelCollapsed={editPanelCollapsed}
          previewPanelCollapsed={previewPanelCollapsed}
          toggleSidePanel={toggleSidePanel}
          toggleEditPanel={toggleEditPanel}
          togglePreviewPanel={togglePreviewPanel}
          resumeContentRef={resumeContentRef}
        />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden h-[calc(100vh-64px)]">
        <MobileWorkbench />
      </div>
    </main>
  );
}
