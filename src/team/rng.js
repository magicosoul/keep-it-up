export function createRng(seed) {
  let state = seed >>> 0;

  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromText(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function randomSeedText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';

  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }

  return out;
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function range(rng, min, max) {
  return min + rng() * (max - min);
}

export function intRange(rng, min, max) {
  return Math.floor(range(rng, min, max + 1));
}

export function weighted(rng, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.value;
    }
  }

  return entries[entries.length - 1].value;
}

export function poisson(rng, mean) {
  const limit = Math.exp(-mean);
  let k = 0;
  let p = 1;

  do {
    k += 1;
    p *= rng();
  } while (p > limit && k < 40);

  return k - 1;
}
