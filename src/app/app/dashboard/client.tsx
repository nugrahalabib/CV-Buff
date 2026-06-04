import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  IconResumes,
  IconTemplates,
  IconAI,
} from "@/components/shared/icons/SidebarIcons";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePathname, useRouter } from "@/lib/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Logo from "@/components/shared/Logo";
import { useLocale, useTranslations } from "@/i18n/compat/client";

interface MenuItem {
  title: string;
  url?: string;
  href?: string;
  icon: any;
  items?: { title: string; href: string }[];
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("dashboard");

  const sidebarItems: MenuItem[] = [
    {
      title: t("sidebar.resumes"),
      url: "/app/dashboard/resumes",
      icon: IconResumes,
    },
    {
      title: t("sidebar.templates"),
      url: "/app/dashboard/templates",
      icon: IconTemplates,
    },
    {
      title: t("sidebar.ai"),
      url: "/app/dashboard/ai",
      icon: IconAI,
    },
  ];

  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  // collapsible kept exactly as before (icon-rail collapse behaviour preserved)
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">(
    "icon"
  );

  const handleItemClick = (item: MenuItem) => {
    if (item.items) {
      // grouped items navigate via their own sub-links below
    } else {
      router.push(item.url || item.href || "/");
    }
  };

  const isItemActive = (item: MenuItem) => {
    if (item.items) {
      return item.items.some((subItem) => pathname === subItem.href);
    }
    return item.url === pathname || item.href === pathname;
  };

  // Breadcrumb section derives from the SAME nav labels, so it can never drift.
  const activeItem = sidebarItems.find((item) => isItemActive(item));
  const sectionLabel = activeItem?.title;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar
          collapsible={collapsible}
          className="border-r border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/60"
        >
          {/* ── Brand lockup ───────────────────────────────────────── */}
          <SidebarHeader className="h-16 justify-center border-b border-black/5 px-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className="group flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-accent/60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/[0.03] transition-transform group-hover:scale-[1.03] dark:border-white/10 dark:bg-neutral-900/80 dark:ring-white/[0.03]">
                <Logo
                  className="transition-opacity group-hover:opacity-90"
                  size={28}
                />
              </span>
              {open && (
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-base font-bold tracking-tight text-transparent">
                    {t("sidebar.appName")}
                  </span>
                  <span className="truncate text-[11px] font-medium text-muted-foreground">
                    Editor CV
                  </span>
                </span>
              )}
            </button>
          </SidebarHeader>

          {/* ── Navigation ─────────────────────────────────────────── */}
          <SidebarContent className="px-3 py-4">
            <SidebarGroup className="p-0">
              {open && (
                <SidebarGroupLabel className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  Menu
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {sidebarItems.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <TooltipProvider delayDuration={0} key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                className={`group relative h-11 w-full rounded-xl px-2 transition-all duration-200 ease-out [&>svg]:size-auto ${
                                  active
                                    ? "bg-primary/[0.08] font-semibold text-primary hover:bg-primary/[0.12] hover:text-primary"
                                    : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                                }`}
                              >
                                <div
                                  className="flex cursor-pointer items-center gap-3"
                                  onClick={() => handleItemClick(item)}
                                >
                                  {/* animated active accent bar */}
                                  {active && (
                                    <motion.span
                                      layoutId="navIndicator"
                                      className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 32,
                                      }}
                                    />
                                  )}
                                  {/* unifying icon tile — calms the vibrant SVGs */}
                                  <span
                                    className={`grid size-9 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
                                      active
                                        ? "border-primary/15 bg-primary/[0.06] ring-1 ring-primary/10"
                                        : "border-black/5 bg-muted/40 ring-1 ring-black/[0.02] group-hover:bg-background dark:border-white/10 dark:bg-white/[0.04] dark:ring-white/[0.03]"
                                    }`}
                                  >
                                    <item.icon size={22} active={active} />
                                  </span>
                                  {open && (
                                    <span className="flex-1 truncate text-sm">
                                      {item.title}
                                    </span>
                                  )}
                                </div>
                              </SidebarMenuButton>

                              {item.items && open && (
                                <div className="ml-9 mt-1 space-y-1 border-l border-border/60 pl-2">
                                  {item.items.map((subItem) => (
                                    <div
                                      key={subItem.href}
                                      className={`cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                                        pathname === subItem.href
                                          ? "bg-primary/10 font-medium text-primary"
                                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                      }`}
                                      onClick={() => router.push(subItem.href)}
                                    >
                                      {subItem.title}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </SidebarMenuItem>
                          </TooltipTrigger>
                          {!open && (
                            <TooltipContent side="right" className="font-medium">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* ── User block ─────────────────────────────────────────── */}
          <SidebarFooter className="border-t border-black/5 p-3 dark:border-white/10">
            <UserMenu collapsed={!open} />
          </SidebarFooter>
        </Sidebar>

        {/* ── Main column ──────────────────────────────────────────── */}
        <main className="flex h-screen min-w-0 flex-1 flex-col">
          {/* refined sticky topbar: trigger tile + breadcrumb (no page-title dup) */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-black/5 bg-background/80 px-4 backdrop-blur-xl dark:border-white/10">
            <div className="grid size-9 place-items-center rounded-lg border border-black/5 bg-card/60 ring-1 ring-black/[0.02] dark:border-white/10 dark:ring-white/[0.03]">
              <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground" />
            </div>

            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5 text-sm"
            >
              <span className="hidden font-medium text-muted-foreground sm:inline">
                {t("sidebar.appName")}
              </span>
              {sectionLabel && (
                <>
                  <ChevronRight
                    className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline"
                    aria-hidden="true"
                  />
                  <span className="truncate font-semibold text-foreground">
                    {sectionLabel}
                  </span>
                </>
              )}
            </nav>

            {/* right-aligned actions slot (reserved for future chrome) */}
            <div className="ml-auto flex items-center gap-2" />
          </header>

          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
