import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Cylinder from "./Cylinder.jsx";

/**
 * The WebGL half of the showreel, isolated in its own module so the whole
 * three.js dependency tree can be lazily imported by <Showreel>.
 *
 * `active` comes from an IntersectionObserver upstream: switching
 * frameloop to "never" genuinely parks the render loop while the section
 * is off screen, instead of paying for frames nobody sees.
 */
export default function Stage({ progress, active }) {
  return (
    <Canvas
      camera={{ fov: 35, position: [0, 0, 5] }}
      // cap the pixel ratio — a 3× retina buffer costs 9× the fill rate for
      // an object this soft-edged, and the bloom pass runs over all of it.
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
    >
      {/* The mesh uses meshBasicMaterial, so nothing here needs lighting. */}
      <Suspense fallback={null}>
        <Cylinder progress={progress} />
      </Suspense>
      <EffectComposer>
        {/* A low threshold with a wide radius is what spreads the glow off
            the panel edges and out through the open gutters, so the far wall
            reads as backlight rather than just another surface. */}
        <Bloom
          mipmapBlur
          intensity={2.4}
          radius={0.85}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.35}
        />
      </EffectComposer>
    </Canvas>
  );
}
