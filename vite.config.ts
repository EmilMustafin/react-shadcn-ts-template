import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import autoprefixer from "autoprefixer"
import path from "path"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      { find: "~", replacement: path.resolve(import.meta.dirname, "public") },
    ],
  },
  optimizeDeps: {
    include: ["lucide-react", "react", "react-dom", "react-i18next", "i18next"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react-i18next") || id.includes("node_modules/i18next")) {
            return "vendor-i18n"
          }

          if (id.includes("node_modules/react-router")) {
            return "vendor-router"
          }

          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/@tanstack/react-table")
          ) {
            return "vendor-query"
          }

          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform") ||
            id.includes("node_modules/zod")
          ) {
            return "vendor-form"
          }

          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/react-day-picker") ||
            id.includes("node_modules/react-resizable-panels") ||
            id.includes("node_modules/class-variance-authority") ||
            id.includes("node_modules/clsx") ||
            id.includes("node_modules/tailwind-merge")
          ) {
            return "vendor-ui"
          }

          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons"
          }

          if (id.includes("node_modules/recharts")) {
            return "vendor-charts"
          }

          if (
            id.includes("node_modules/embla-carousel-react") ||
            id.includes("node_modules/embla-carousel")
          ) {
            return "vendor-carousel"
          }

          if (
            id.includes("node_modules/usehooks-ts") ||
            id.includes("node_modules/date-fns") ||
            id.includes("node_modules/ky") ||
            id.includes("node_modules/input-otp") ||
            id.includes("node_modules/cmdk") ||
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/vaul")
          ) {
            return "vendor-utils"
          }
        },
      },
    },
  },
})
