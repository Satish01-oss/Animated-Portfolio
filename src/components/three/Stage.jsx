import { Suspense, useCallback, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { WebGLRenderer } from "three";
import Ring from "./Ring.jsx";

// Context loss is not a React render error: switch to the usable DOM deck.
function ContextRecovery({ onFailure }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}

/**
 * The WebGL half of the work chapter, isolated in its own module so the
 * whole three.js dependency tree can be lazily imported by <Work>.
 *
 * `active` comes from an IntersectionObserver upstream: switching frameloop
 * to "never" genuinely parks the render loop while the canvas is off screen
 * or has already handed over to the DOM cards.
 */
export default function Stage({ progress, target, active, onFailure }) {
  // The ring fades the glow out as it lands — a flat strip under bloom would
  // not match the plain DOM cards it turns into — so it needs the effect.
  //
  // A CALLBACK ref, deliberately. The postprocessing wrappers memoise on
  // JSON.stringify(props), and in React 19 `ref` is an ordinary prop: an
  // object ref gets stringified along with the BloomEffect inside it and
  // throws on the circular structure. Functions are skipped by stringify.
  const bloom = useRef(null);
  const bloomRef = useCallback((fx) => { bloom.current = fx; }, []);
  const createRenderer = useCallback((defaults) => {
    try {
      return new WebGLRenderer({ ...defaults, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      onFailure();
      // Fiber awaits this factory but does not catch configure() rejection.
      // Abort setup without rejecting; onFailure unmounts this optional scene.
      return new Promise(() => {});
    }
  }, [onFailure]);

  return (
    <Canvas
      camera={{ fov: 35, position: [0, 0, 5] }}
      // Cap the pixel ratio: a 3× retina buffer costs 9× the fill rate, and
      // the bloom pass runs over all of it.
      dpr={[1, 1.75]}
      gl={createRenderer}
      frameloop={active ? "always" : "never"}
    >
      <ContextRecovery onFailure={onFailure} />
      <Suspense fallback={null}>
        <Ring progress={progress} target={target} bloom={bloom} />
      </Suspense>
      <EffectComposer>
        {/* Low threshold, wide radius: the glow spreads off the panel edges
            and out through the open gutters, so the far wall reads as light
            coming from behind the object. */}
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={1.9}
          radius={0.8}
          luminanceThreshold={0.24}
          luminanceSmoothing={0.35}
        />
      </EffectComposer>
    </Canvas>
  );
}
