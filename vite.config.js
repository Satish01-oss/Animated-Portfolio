import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the build also works when opened from a sub-path
// (e.g. a project page on GitHub Pages) — not just the domain root.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2020",
    // Don't preload the lazy three chunk into <head>; that alone would pull
    // ~950 kB down on first paint and defeat deferring <Stage>.
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !d.includes("three-")),
    },
    // Three.js is by far the heaviest dependency and it is only needed by
    // one section, so it is split away from the motion libraries and from
    // the app shell. The shell can paint while three/ still parses.
    rollupOptions: {
      output: {
        // React must be named explicitly. Left implicit, Rollup treats it as
        // shared between the entry and @react-three/fiber and folds it INTO
        // the three chunk — which makes the entry statically import that
        // chunk, so the 1.1 MB of three.js downloads on first paint no matter
        // how carefully <Stage> is deferred.
        manualChunks(id) {
          // Vite's __vitePreload helper. Left to Rollup it landed inside the
          // `three` chunk, and the entry importing that ONE symbol was enough
          // to make the browser fetch all 948 kB of three.js on first paint —
          // the deferral was correct, the bundling quietly undid it. Pin the
          // helper to a chunk the entry already loads and the edge is gone.
          if (id.includes("preload-helper")) return "react";
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          if (/[\\/]node_modules[\\/](three|@react-three|postprocessing)[\\/]/.test(id)) return "three";
          if (/[\\/]node_modules[\\/](gsap|lenis|split-type)[\\/]/.test(id)) return "motion";
        },
      },
    },
    // The three chunk is legitimately large; don't fail the eye on it.
    chunkSizeWarningLimit: 1200,
  },
});
