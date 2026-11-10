export function frameOrder(count, steps) {
  const result = new Set([0]);
  for (const step of steps) for (let i = 0; i < count; i += step) result.add(i);
  return [...result];
}

export function nearestFrame(images, target) {
  if (images[target]) return target;
  for (let d = 1; d < images.length; d++) {
    if (images[target - d]) return target - d;
    if (images[target + d]) return target + d;
  }
  return -1;
}

// Deduplicated, bounded pool. A slow frame cannot block an entire interlaced pass.
export function createFrameLoader({ load, concurrency = 6, timeout = 12000, retries = 1, onLoad = () => {} }) {
  const records = new Map(), queue = [];
  let active = 0, disposed = false, backgroundPaused = false;
  function pump() {
    while (!disposed && active < concurrency && queue.length) {
      const next = queue.findIndex(record => !backgroundPaused || record.priority);
      if (next === -1) break;
      const [record] = queue.splice(next, 1);
      record.state = 'loading';
      active++;
      const controller = new AbortController();
      record.controller = controller;
      let timer;
      const expired = new Promise((_, reject) => {
        timer = setTimeout(() => { reject(new Error('Frame timed out')); controller.abort(); }, timeout);
      });
      const cancelled = new Promise((_, reject) => { record.cancel = () => reject(new Error('Cancelled')); });
      Promise.race([Promise.resolve().then(() => load(record.index, controller.signal)), expired, cancelled])
        .then((image) => {
          if (disposed) return;
          record.state = 'done';
          onLoad(record.index, image);
          record.resolve(image);
        }, () => {
          if (disposed) return;
          if (record.attempt++ < retries) { record.state = 'queued'; queue.push(record); }
          else { record.state = 'failed'; record.resolve(null); }
        }).finally(() => { clearTimeout(timer); active--; pump(); });
    }
  }
  function request(index, priority = false) {
    if (disposed) return Promise.resolve(null);
    let record = records.get(index);
    if (!record) {
      record = { index, attempt: 0, state: 'queued' };
      record.promise = new Promise((resolve) => { record.resolve = resolve; });
      records.set(index, record);
      queue.push(record);
    }
    if (priority) {
      // Only the latest requested pose (and opening frame) bypasses the gate.
      for (const other of records.values()) if (other.index !== 0) other.priority = false;
      record.priority = true;
    }
    if (priority && record.state === 'queued') {
      queue.splice(queue.indexOf(record), 1);
      queue.unshift(record);
    }
    pump();
    return record.promise;
  }
  return {
    request,
    setBackgroundPaused(paused) { backgroundPaused = paused; pump(); },
    dispose() {
      disposed = true;
      queue.length = 0;
      for (const record of records.values()) { record.cancel?.(); record.controller?.abort(); record.resolve(null); }
    },
  };
}

export function loadImage(url, signal, priority = 'low') {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('Cancelled'));
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = priority;
    const cleanup = () => { image.onload = image.onerror = null; signal.removeEventListener('abort', abort); };
    const abort = () => { cleanup(); image.src = ''; reject(new Error('Cancelled')); };
    image.onload = () => { cleanup(); resolve(image); };
    image.onerror = () => { cleanup(); reject(new Error('Frame failed')); };
    signal.addEventListener('abort', abort, { once: true });
    image.src = url;
  });
}

// Explicit decoding is limited to current display candidates, one at a time.
// The WeakSet does not hold a second copy of every decoded frame.
export function createFrameDecoder() {
  const decoded = new WeakSet(), pending = new WeakMap();
  let tail = Promise.resolve();
  return {
    has: (image) => decoded.has(image),
    decode(image) {
      if (decoded.has(image)) return Promise.resolve(image);
      if (pending.has(image)) return pending.get(image);
      const promise = tail.then(async () => {
        try { await image.decode?.(); } catch { /* Loaded images can still be drawn after decode rejects. */ }
        decoded.add(image);
        return image;
      });
      pending.set(image, promise);
      tail = promise;
      return promise;
    },
  };
}
