/**
 * Minimal metadata typings for route SEO/head config and PWA manifest/sitemap.
 * Local definitions so the app stays framework-agnostic.
 */

export type Metadata = {
  title?: string | { default?: string; template?: string; absolute?: string };
  description?: string;
  metadataBase?: URL;
  keywords?: string | string[];
  authors?:
    | Array<{ name?: string; url?: string }>
    | { name?: string; url?: string };
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  openGraph?: Record<string, any>;
  twitter?: Record<string, any>;
  robots?: Record<string, any> | string;
  icons?: Record<string, any> | string;
  manifest?: string;
  [key: string]: any;
};

export namespace MetadataRoute {
  export type Sitemap = Array<{
    url: string;
    lastModified?: string | Date;
    changeFrequency?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    priority?: number;
    alternates?: { languages?: Record<string, string> };
  }>;

  export type Manifest = {
    name?: string;
    short_name?: string;
    description?: string;
    start_url?: string;
    display?: string;
    background_color?: string;
    theme_color?: string;
    icons?: Array<{
      src: string;
      sizes?: string;
      type?: string;
      purpose?: string;
    }>;
    [key: string]: any;
  };
}
