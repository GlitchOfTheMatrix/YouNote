import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    host: true,
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart(),
    ...(isVercel ? [nitro()] : []),
    viteReact(),
  ],
});
