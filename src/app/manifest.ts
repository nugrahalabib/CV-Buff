import type { MetadataRoute } from "@/types/metadata";

export const runtime = "edge";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CV-Buff",
    short_name: "CV-Buff",
    description: "Editor CV open-source berbasis AI. Gratis, privasi-pertama.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
