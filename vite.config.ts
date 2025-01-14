import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { remixDevTools } from "remix-development-tools";

// the full list of packages causes styling problems on DEV, but is necessary for PROD 🤷🏽‍♂️
const mui_externals = process.env.NODE_ENV === 'production' ?
  ['@mui/icons-material', '@mui/material', '@mui/utils', '@mui/system', '@mui/styled-engine'] :
  ['@mui/icons-material'];

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remixDevTools({suppressDeprecationWarning: true}),
    !process.env.VITEST && remix({
      future: {
        unstable_optimizeDeps: true,
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: true,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  test: {
    reporters: ['verbose'],
    env: loadEnv("", process.cwd(), ""),  // since we disable remix() in test mode, we need to load env vars explicitly
  },
  server: {
    warmup: {
      clientFiles: [
        "./app/entry.client.tsx",
        "./app/root.tsx",
        "./app/routes/**/*",
        "!**/*.server.(ts|tsx)",
        "!**/*.test.ts",
      ],
    },
  },
  optimizeDeps: {
    include: mui_externals, 
  },
  ssr: {
    noExternal: mui_externals, 
  },
});
