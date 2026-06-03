import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load .env (including non-VITE_ vars) into process.env so SERVER-ONLY auth code can read
  // GOOGLE_CLIENT_ID / BETTER_AUTH_SECRET / DATABASE_URL during dev. These never reach the
  // client bundle — they're only referenced via process.env inside server modules.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
  server: {
    port: 1713,
    strictPort: true
  },
  preview: {
    port: 1713,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  ssr: {
    noExternal: ["pdfjs-dist"],
    // Auth + native DB deps: keep OUT of the SSR bundle (resolved from node_modules at
    // runtime). Avoids bundling better-auth's unused bun/kysely dialects.
    external: [
      "pg",
      "better-auth",
      "@better-auth/kysely-adapter",
      "kysely"
    ]
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "routes"
      }
    }),
    viteReact()
  ]
  };
});
