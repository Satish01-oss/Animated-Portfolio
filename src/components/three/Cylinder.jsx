import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const TEXTURE = `${import.meta.env.BASE_URL}assets/textures/showreel.webp`;

// A slow idle turn keeps the object alive when the visitor stops scrolling;
// scroll adds most of one revolution across the length of the section. Two
// full turns read as spinning — at 0.6 each panel gets time to be looked at.
const IDLE_TURNS_PER_SEC = 0.04;
const SCROLL_TURNS = 0.6;

/**
 * Open-ended cylinder with the showreel texture mapped to its inner and
 * outer wall. Rotation is the sum of a time-based idle drift and the
 * section's scroll progress, so the object reads as a physical thing being
 * turned over rather than a looping GIF.
 *
 * `progress` is a ref (not state) on purpose: the scroll handler writes to
 * it ~60×/sec and React must not re-render for any of them.
 */
export default function Cylinder({ progress }) {
  const mesh = useRef(null);
  const idle = useRef(0);
  const map = useTexture(TEXTURE);

  // Colour space and filtering have to be set on the texture itself, once.
  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    map.needsUpdate = true;
  }, [map]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    // delta-based so the speed is identical on 60Hz and 144Hz displays.
    idle.current += delta * IDLE_TURNS_PER_SEC * Math.PI * 2;
    mesh.current.rotation.y =
      idle.current + progress.current * Math.PI * 2 * SCROLL_TURNS;
  });

  return (
    <group rotation={[0, 1.4, 0.5]}>
      <mesh ref={mesh}>
        {/* open-ended: the far wall stays visible through the near one */}
        <cylinderGeometry args={[1, 1, 1, 60, 60, true]} />
        {/* Basic, not standard: there is nothing to shade here — one ambient
            light on a flat wall — and `toneMapped={false}` sends the texture's
            colour to the bloom pass at full strength instead of being rolled
            off first. That is what makes the panels read as emitting light
            rather than merely being lit. */}
        <meshBasicMaterial
          map={map}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
