import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build also works when opened from a sub-path
// (e.g. a project page on GitHub Pages) — not just the domain root.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2019",
    // Split the animation libraries out of the app bundle so the shell
    // can paint before GSAP/Lenis parse. Keeps first load lean.
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ["gsap", "lenis", "split-type"],
        },
      },
    },
  },
});
