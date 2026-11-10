import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoader, createFrameDecoder, frameOrder, nearestFrame } from '../src/lib/imageSequenceLoader.js';
const tick = () => new Promise(resolve => setImmediate(resolve));

function controlled(options = {}) {
  const starts = [], pending = new Map();
  const loader = createFrameLoader({
    timeout: 500, ...options,
    load(index) { starts.push(index); return new Promise(resolve => pending.set(index, resolve)); },
  });
  return { loader, starts, finish(index) { pending.get(index)({ index }); } };
}

test('interlaced ordering preserves desktop/mobile/saver frame sets', () => {
  assert.equal(frameOrder(150, [8, 4, 2, 1]).length, 150);
  assert.equal(frameOrder(150, [8, 4, 2]).length, 75);
  assert.equal(frameOrder(150, [8, 4]).length, 38);
  assert.deepEqual(frameOrder(150, [8, 4, 2, 1]).slice(0, 4), [0, 8, 16, 24]);
  assert.deepEqual(frameOrder(150, []), [0]);
});

test('caps concurrency and deduplicates in-flight and finished requests', async () => {
  const c = controlled({ concurrency: 2 });
  const first = c.loader.request(0);
  assert.equal(c.loader.request(0), first);
  c.loader.request(1); c.loader.request(2);
  await tick();
  assert.deepEqual(c.starts, [0, 1]);
  c.finish(0); await first; await tick();
  assert.deepEqual(c.starts, [0, 1, 2]);
  assert.equal(c.loader.request(0), first);
  c.loader.dispose();
});

test('current pose jumps ahead of background queue without duplicate fetch', async () => {
  const c = controlled({ concurrency: 1 });
  c.loader.request(0); c.loader.request(8); c.loader.request(16); c.loader.request(24);
  const target = c.loader.request(24, true);
  await tick(); c.finish(0); await tick();
  assert.deepEqual(c.starts, [0, 24]);
  assert.equal(c.loader.request(24, true), target);
  c.finish(24); await tick();
  assert.deepEqual(c.starts, [0, 24, 8]);
  c.loader.dispose();
});

test('timeout releases slot, retries bounded, other frames progress', async () => {
  const starts = [], aborted = [];
  const loader = createFrameLoader({ concurrency: 1, timeout: 10, retries: 1,
    load(index, signal) {
      starts.push(index);
      signal.addEventListener('abort', () => aborted.push(index));
      return index === 0 ? new Promise(() => {}) : Promise.resolve({ index });
    },
  });
  const failed = loader.request(0), healthy = loader.request(8);
  assert.deepEqual(await healthy, { index: 8 });
  assert.equal(await failed, null);
  assert.deepEqual(starts, [0, 8, 0]);
  assert.deepEqual(aborted, [0, 0]);
  loader.dispose();
});

test('transient error recovers once and publishes only successful image', async () => {
  let attempts = 0;
  const published = [];
  const loader = createFrameLoader({ load: async () => {
    if (++attempts === 1) throw new Error('temporary');
    return { index: 0 };
  }, onLoad: (index, image) => published.push([index, image]) });
  assert.deepEqual(await loader.request(0), { index: 0 });
  assert.equal(attempts, 2);
  assert.equal(published.length, 1);
  loader.dispose();
});

test('disposal settles pending work, aborts active request and prevents late publish', async () => {
  let resolve, aborted = false, published = false;
  const loader = createFrameLoader({ concurrency: 1,
    load: (_, signal) => {
      signal.addEventListener('abort', () => { aborted = true; });
      return new Promise(done => { resolve = done; });
    }, onLoad: () => { published = true; },
  });
  const first = loader.request(0), queued = loader.request(8);
  await tick(); loader.dispose();
  assert.equal(await first, null); assert.equal(await queued, null);
  resolve({}); await tick();
  assert.equal(aborted, true); assert.equal(published, false);
  assert.equal(await loader.request(16), null);
});

test('stationary target chooses newly arrived nearer frame then exact pose', () => {
  const images = new Array(150);
  images[0] = {};
  assert.equal(nearestFrame(images, 100), 0);
  images[96] = {};
  assert.equal(nearestFrame(images, 100), 96);
  images[104] = {};
  assert.equal(nearestFrame(images, 100), 96); // stable lower-frame tie
  images[100] = {};
  assert.equal(nearestFrame(images, 100), 100);
});

test('decoder deduplicates current candidate and serializes explicit decoding', async () => {
  const decoder = createFrameDecoder();
  let active = 0, maxActive = 0, calls = 0;
  const image = () => ({ async decode() { calls++; maxActive = Math.max(maxActive, ++active); await tick(); active--; } });
  const a = image(), b = image(), unused = image();
  const first = decoder.decode(a);
  assert.equal(decoder.decode(a), first);
  await Promise.all([first, decoder.decode(b)]);
  await decoder.decode(a);
  assert.equal(calls, 2); assert.equal(maxActive, 1);
  assert.equal(decoder.has(a), true); assert.equal(decoder.has(unused), false);
});

test('actual hook repaints a stationary fallback when target arrives; reduced motion requests only opening', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const source = (await readFile(new URL('../src/hooks/useImageSequence.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '')
    .replace('export function useImageSequence', 'function useImageSequence')
    .replace('import.meta.env.BASE_URL', "''");
  async function mount(reduced) {
    const effects = [], rafs = new Map(), requests = new Map(), draws = [];
    let id = 0;
    const canvas = { clientWidth: 1920, clientHeight: 1080, width: 0, height: 0,
      getContext: () => ({ clearRect() {}, drawImage(image) { draws.push(image.index); } }) };
    const context = {
      useRef: current => ({ current }), useCallback: fn => fn, useMemo: fn => fn(),
      useEffect: fn => effects.push(fn),
      createFrameLoader, createFrameDecoder, frameOrder, nearestFrame,
      loadImage: (url, signal) => new Promise((resolve, reject) => {
        requests.set(Number(url), resolve);
        signal.addEventListener('abort', () => reject(new Error('cancelled')));
      }),
      window: { devicePixelRatio: 1, matchMedia: query => ({ matches: query.includes('reduced-motion') && reduced }),
        addEventListener() {}, removeEventListener() {} },
      navigator: {}, requestAnimationFrame: fn => { rafs.set(++id, fn); return id; },
      cancelAnimationFrame: id => rafs.delete(id), setTimeout, clearTimeout,
    };
    const hook = runInNewContext(source + '\nuseImageSequence;', context);
    const sequence = hook({ current: canvas }, index => String(index));
    const cleanup = effects.map(fn => fn());
    const gate = sequence.preload();
    await tick();
    const finish = index => requests.get(index)({ index, width: 1920, height: 1080, naturalWidth: 1920, decode: async () => {} });
    const paint = async () => {
      for (let i = 0; i < 4; i++) {
        const jobs = [...rafs.values()]; rafs.clear(); jobs.forEach(fn => fn()); await tick();
      }
    };
    finish(0); await gate; await paint();
    return { sequence, requests, draws, finish, paint, cleanup: () => cleanup.forEach(fn => fn()) };
  }
  const normal = await mount(false);
  assert.deepEqual(normal.draws, [0]);
  normal.sequence.setFrame(100); await normal.paint();
  assert.deepEqual(normal.draws, [0]);
  normal.finish(8); await tick();
  assert.equal(normal.requests.has(100), true);
  normal.finish(100); await normal.paint();
  assert.equal(normal.draws.at(-1), 100);
  normal.cleanup();
  const reduced = await mount(true);
  assert.deepEqual([...reduced.requests.keys()], [0]);
  reduced.cleanup();
});

test('offscreen gate pauses background, preserves current requests, resumes without duplicates', async () => {
  const c = controlled({ concurrency: 1 });
  c.loader.setBackgroundPaused(true);
  const background = c.loader.request(8);
  await tick(); assert.deepEqual(c.starts, []);
  const current = c.loader.request(100, true);
  await tick(); assert.deepEqual(c.starts, [100]);
  c.finish(100); await current; await tick();
  assert.deepEqual(c.starts, [100]);
  c.loader.setBackgroundPaused(false);
  await tick(); assert.deepEqual(c.starts, [100, 8]);
  c.finish(8); await background;
  assert.equal(c.loader.request(8), background);
  c.loader.dispose();
});
