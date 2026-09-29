import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";

// Imported, not referenced by path: Vite fingerprints it, and the card fronts
// in work.css import the very same file — one download serves both.
import STRIP from "../../assets/images/work-strip.webp";

// Six panels round the ring: the three projects, twice. Each panel is 5:7 —
// the same shape as the cards the ring unrolls into — so for a ring of
// height 1 the circumference is 6 × 5/7 and the radius follows from that.
const PANELS = 6;
const PANEL_W = 5 / 7;
const RADIUS = (PANELS * PANEL_W) / (Math.PI * 2);

const RING_SCALE = 1.5;                    // world units while it is a ring
const RING_TILT = { x: 0.2, z: 0.4 };      // how it is presented, radians
const RING_X = 1.1;                        // offset right, clear of the copy
const SCROLL_TURNS = 0.85;                 // turns added across the spin phase
const IDLE_TURNS_PER_SEC = 0.03;           // keeps it breathing at rest
const GUTTER = 0.1;                        // share of a slot left open
const CARD_RADIUS_PX = 20;                 // the cards' radius (useWork, work.css)

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const wrapPi = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);

const PW = PANEL_W.toFixed(6);

// The camera's route across the spin phase: in from low and far, up and over
// the ring, then down to the landing position the unroll is measured from.
const LAND_CAMERA = new THREE.Vector3(0, 0, 5);
const CAMERA_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.3, -0.9, 8.2),
  new THREE.Vector3(0, 0.3, 6.2),
  new THREE.Vector3(-0.35, 1.15, 5.4),
  LAND_CAMERA.clone(),
]);
const camPos = new THREE.Vector3();

const vertexShader = /* glsl */ `
  uniform float uUnroll;
  uniform float uRadius;
  varying vec2 vUv;
  varying float vAngle;

  #define PI 3.141592653589793

  void main() {
    vUv = uv;
    // Angle round the ring, measured from the point that faces the camera
    // once unrolled (uv.x = 0.5). The geometry's own seam is exactly
    // opposite, so the strip opens there and no triangle spans the cut.
    float a = (uv.x - 0.5) * 2.0 * PI;
    vAngle = a;
    float s = a * uRadius;                 // arc length from the front

    // Unroll by growing the bend radius while arc length stays fixed. The
    // panels never stretch; the ring relaxes into a flat strip that stays
    // tangent to its front panel the whole way, like film leaving a spool.
    float k = 1.0 - uUnroll;
    vec3 p = vec3(0.0, position.y, 0.0);
    if (k < 0.0005) {
      p.x = s;
      p.z = uRadius;
    } else {
      float R = uRadius / k;
      float ang = s / R;
      p.x = R * sin(ang);
      p.z = uRadius - R * (1.0 - cos(ang));
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uSpin;
  uniform float uGutter;
  uniform float uColor;
  uniform float uCorner;
  uniform float uFlat;
  uniform float uStripCorner;
  varying vec2 vUv;
  varying float vAngle;

  float roundedBox(vec2 p, vec2 hs, float r) {
    vec2 q = abs(p) - hs + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    // Six slots, offset half a slot so slot 3 is centred on uv.x = 0.5:
    // the middle of the strip is a whole panel, not a seam.
    float shifted = vUv.x * 6.0 + 0.5;
    float slot = mod(floor(shifted), 6.0);
    float local = fract(shifted);
    float project = mod(slot + 1.0, 3.0);          // slot 3 → project 2
    bool middle = slot > 1.5 && slot < 4.5;         // the three that land

    // Ring: every panel is its own rounded card with a gutter either side.
    vec2 pPanel = vec2((local - 0.5) * ${PW}, vUv.y - 0.5);
    vec2 hPanel = vec2((1.0 - uGutter) * 0.5 * ${PW}, 0.5 - uGutter * 0.3);
    float d = roundedBox(pPanel, hPanel, uCorner);

    // Flat: the middle three merge into ONE slab with only its outer corners
    // rounded — exactly the shape of the joined DOM cards it hands off to.
    float fade = 1.0;
    if (middle) {
      vec2 pStrip = vec2((vUv.x - 0.5) * 6.0 * ${PW}, vUv.y - 0.5);
      float dStrip = roundedBox(pStrip, vec2(1.5 * ${PW}, 0.5), uStripCorner);
      d = mix(d, dStrip, uFlat);
    } else {
      fade = 1.0 - uFlat;                           // the spares fall away
    }

    float aa = fwidth(d) * 1.2;
    float mask = (1.0 - smoothstep(-aa, aa, d)) * fade;
    if (mask <= 0.002) discard;

    vec4 tex = texture2D(uMap, vec2((project + local) / 3.0, vUv.y));

    // Monochrome, like the rest of the site — except the panel turned toward
    // the viewer, which is allowed its colour. The spotlight follows the
    // spin, so exactly one project is ever "on".
    float facing = cos(vAngle + uSpin);
    float spot = smoothstep(0.6, 0.97, facing) * uColor;
    float gray = dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 col = mix(vec3(gray), tex.rgb, spot);
    // The far wall sits darker; with bloom on top that reads as depth.
    col *= mix(1.0, mix(0.45, 1.0, smoothstep(-0.7, 0.5, facing)), uColor);

    gl_FragColor = vec4(col, mask);
    #include <colorspace_fragment>
  }
`;

/**
 * The work ring.
 *
 * One mesh, one texture, three scroll-driven jobs:
 *   1. Spin   — a tilted ring of the three projects, turned by scroll; the
 *               panel facing the viewer resolves into colour.
 *   2. Unroll — the ring stands upright and opens into a flat strip.
 *   3. Land   — the strip's middle three panels settle exactly on the DOM
 *               cards' rectangle, so <Work> can swap the canvas for the real,
 *               clickable cards without a visible cut.
 *
 * `progress` ({ spin, unroll }, both 0–1) and `target` (the cards' rect in
 * px, relative to the canvas) are refs written by useWork — scrolling never
 * causes a React render.
 */
export default function Ring({ progress, target, bloom }) {
  const tilt = useRef(null);
  const spinner = useRef(null);
  const idle = useRef(0);
  const eased = useRef({ spin: 0, unroll: 0 });
  const map = useLoader(THREE.TextureLoader, STRIP);
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
  }, [map]);

  // Built here rather than as a <shaderMaterial uniforms={…}> element: r3f
  // hands the material a COPY of a uniforms prop, so per-frame writes to the
  // original never reach the GPU. Owning the material means `uniforms` below
  // is the very object the renderer uploads.
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: map },
          uUnroll: { value: 0 },
          uRadius: { value: RADIUS },
          uSpin: { value: 0 },
          uGutter: { value: GUTTER },
          uColor: { value: 1 },
          uCorner: { value: 0.04 },
          uFlat: { value: 0 },
          uStripCorner: { value: 0.05 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [map]
  );
  const uniforms = material.uniforms;
  useEffect(() => () => material.dispose(), [material]);

  // Open-ended and dense round the circumference, so the unroll stays a
  // smooth curve rather than a polygon.
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 240, 1, true),
    []
  );

  useFrame((_, delta) => {
    if (!tilt.current || !spinner.current) return;
    // Clamped only against tab-switch spikes; a slow device still converges.
    const dt = Math.min(delta, 0.25);

    // Ease toward the scroll values: Lenis is already smooth, this only
    // takes the edge off a hard flick.
    const e = eased.current;
    const k = 1 - Math.exp(-dt * 6);
    e.spin += (progress.current.spin - e.spin) * k;
    e.unroll += (progress.current.unroll - e.unroll) * k;

    const u = e.unroll;
    const stand = smooth(0, 0.5, u);        // tilt → upright, ring → target
    const open = smooth(0.15, 0.9, u);      // curvature → 0
    const flat = smooth(0.7, 1, u);         // panels → one slab

    // ── Camera ────────────────────────────────────────────────
    // Not a turntable: the camera travels while the ring turns — rising in
    // from below and far, drifting up and over it, closing in — and arrives
    // back at the landing position exactly as the spin phase ends. From
    // there on it is fixed, which is what keeps the px → world maths exact.
    CAMERA_PATH.getPoint(smooth(0, 1, e.spin), camPos);
    camera.position.lerpVectors(camPos, LAND_CAMERA, stand);
    camera.lookAt(0, 0, 0);

    // Idle drift only while it is still a ring, and kept wrapped so fading
    // it out never unwinds more than half a turn.
    if (u < 0.001) idle.current = wrapPi(idle.current - dt * IDLE_TURNS_PER_SEC * TAU);

    // Scroll winds the ring down to a whole turn by the end of the spin
    // phase; whatever idle offset is left fades out as it stands up. Either
    // way it arrives at exactly 0 — the middle project facing forward.
    const scrollSpin = SCROLL_TURNS * TAU * (1 - e.spin);
    const spin = (scrollSpin + idle.current) * (1 - stand);
    spinner.current.rotation.y = spin;
    tilt.current.rotation.set(RING_TILT.x * (1 - stand), 0, RING_TILT.z * (1 - stand));

    // The landing spot: the DOM cards' rect, from px to world units on the
    // z = 0 plane the strip is brought onto, as seen from the landing camera.
    const t = target.current;
    const worldH = 2 * LAND_CAMERA.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const perPx = worldH / size.height;
    const flatScale = t ? t.h * perPx : RING_SCALE;
    const flatX = t ? (t.x + t.w / 2 - size.width / 2) * perPx : 0;
    const flatY = t ? (size.height / 2 - (t.y + t.h / 2)) * perPx : 0;

    // While the chapter's copy is up the ring sits to its right, so the two
    // never overlap; it slides to centre as the copy leaves.
    const ringX = RING_X * (1 - smooth(0.78, 1, e.spin));

    const s = mix(RING_SCALE, flatScale, stand);
    tilt.current.scale.setScalar(s);
    // Flat, the strip lies at local z = RADIUS; pull it back onto z = 0 so
    // the px → world conversion above is exact when it lands.
    tilt.current.position.set(
      mix(ringX, flatX, stand),
      mix(0, flatY, stand),
      mix(0, -RADIUS * flatScale, open)
    );

    const cornerPx = t ? CARD_RADIUS_PX / t.h : 0.05;
    uniforms.uUnroll.value = open;
    uniforms.uSpin.value = spin;
    uniforms.uGutter.value = GUTTER * (1 - open);
    uniforms.uColor.value = 1 - smooth(0.05, 0.55, u);
    uniforms.uCorner.value = mix(0.04, cornerPx, open);
    uniforms.uFlat.value = flat;
    uniforms.uStripCorner.value = cornerPx;

    if (bloom.current) bloom.current.intensity = mix(1.9, 0, smooth(0.3, 0.9, u));
  });

  return (
    <group ref={tilt}>
      <group ref={spinner}>
        <mesh geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
