import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation
} from "@tanstack/react-router";
import appCss from "../app/globals.css?url";
import appFontCss from "../app/font.css?url";
import { NextIntlClientProvider } from "@/i18n/compat/client";
import { useEffect } from "react";
import idMessages from "@/i18n/locales/id.json";
import enMessages from "@/i18n/locales/en.json";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { getPreferredLocale } from "@/i18n/runtime";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      { title: "CV-Buff" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "stylesheet",
        href: appFontCss
      }
    ]
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound
});

function RootComponent() {
  const pathname = useLocation({
    select: (location) => location.pathname
  });
  const locale = getPreferredLocale(pathname);
  const messages = locale === "en" ? enMessages : idMessages;

  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
  }, [locale]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        <link rel="icon" href="/favicon.ico?v=3" sizes="32x32" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon.png?v=3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
      </head>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Asia/Jakarta"
        >
          <Providers>
            <Outlet />
            <Toaster position="top-center" richColors />
          </Providers>
        </NextIntlClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Halaman tidak ditemukan</p>
    </main>
  );
}
