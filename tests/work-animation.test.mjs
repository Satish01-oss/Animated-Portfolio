import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import { workStateAt } from "../src/hooks/useWork.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("ring scroll and handoff keep the original milestone ranges", () => {
  const before = workStateAt(-1, true);
  assert.equal(before.spin, 0);
  assert.equal(before.unroll, 0);
  assert.equal(before.hand, 0);
  near(workStateAt(1.8, true).spin, 0.5);
  assert.equal(workStateAt(3.6, true).spin, 1);
  assert.equal(workStateAt(3.6, true).unroll, 0);
  near(workStateAt(4.5, true).unroll, 0.5);
  assert.equal(workStateAt(5.4, true).unroll, 1);
  assert.equal(workStateAt(5.2, true).hand, 0);
  near(workStateAt(5.35, true).hand, 0.5);
  assert.equal(workStateAt(5.5, true).hand, 1);
});

test("DOM fallback uses the existing unroll fade and no ring unroll", () => {
  assert.equal(workStateAt(3.6, false).hand, 0);
  near(workStateAt(4.5, false).hand, 0.5);
  assert.equal(workStateAt(5.4, false).hand, 1);
  assert.equal(workStateAt(5.4, false).unroll, 0);
});

test("refresh and reverse-scroll snapshots have no stale landed or card state", () => {
  for (const value of [7, 6.55, 6, 5.56, 5.55, 5.2, 3.6, 0, 7, 0]) {
    const state = workStateAt(value, true);
    assert.equal(state.landed, value > 5.55);
    assert.equal(state.cards, value >= 6.55 ? "fanned" : value >= 6 ? "split" : "joined");
  }
});

test("copy and heading retain their existing fade ranges", () => {
  assert.equal(workStateAt(0.55, true).copyIn, 0);
  assert.equal(workStateAt(1.1, true).copyIn, 1);
  assert.equal(workStateAt(3.2, true).copyOut, 0);
  assert.equal(workStateAt(3.7, true).copyOut, 1);
  assert.equal(workStateAt(5.4, true).heading, 0);
  assert.equal(workStateAt(5.85, true).heading, 1);
});

test("scene JSX compiles, including recovery and media-query lifecycle code", async () => {
  for (const path of ["../src/components/Work.jsx", "../src/components/three/Stage.jsx"]) {
    await transform(await readFile(new URL(path, import.meta.url), "utf8"), { loader: "jsx", format: "esm" });
  }
});
