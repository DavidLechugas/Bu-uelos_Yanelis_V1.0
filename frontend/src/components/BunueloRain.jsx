/** Fondo decorativo de buñuelos a línea (`currentColor`); la geometría sale de un PRNG con semilla, así es estable. */

const VARIANTS = 3;
const COUNT = 14;

/** PRNG pequeño (mulberry32): mismo `seed`, misma secuencia. */
export function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value) => Math.round(value * 100) / 100;
const point = (radius, angle) => [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];

function outline(random, radius, wobble) {
  const steps = 14;
  const pts = Array.from({ length: steps }, (_, i) =>
    point(radius * (1 + (random() - 0.5) * wobble), (i / steps) * Math.PI * 2 + random() * 0.05));
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[steps - 1], pts[0]);
  let d = `M${round(start[0])} ${round(start[1])}`;
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % steps]);
    d += `Q${round(p[0])} ${round(p[1])} ${round(m[0])} ${round(m[1])}`;
  });
  return `${d}Z`;
}

function hatching(random, radius) {
  let d = '';
  for (let i = 0; i < 26; i += 1) {
    const from = (0.1 + random() * 0.55) * Math.PI;
    const span = (0.05 + random() * 0.14) * Math.PI;
    const r = radius * (0.78 + random() * 0.19);
    const [x1, y1] = point(r, from);
    const [x2, y2] = point(r, from + span);
    d += `M${round(x1)} ${round(y1)}A${round(r)} ${round(r)} 0 0 1 ${round(x2)} ${round(y2)}`;
  }
  return d;
}

function pores(random, radius) {
  let d = '';
  for (let i = 0; i < 16; i += 1) {
    const [x, y] = point(radius * 0.72 * Math.sqrt(random()), Math.PI * (0.9 + random() * 1.1));
    const dx = 1.2 + random() * 1.8;
    const dy = (random() - 0.5) * 1.6;
    d += `M${round(x)} ${round(y)}q${round(dx / 2)} ${round(dy - 0.8)} ${round(dx)} ${round(dy)}`;
  }
  return d;
}

export function sketchPaths(seed) {
  const random = seeded(seed);
  return {
    outline: outline(random, 43, 0.06),
    outlineInner: outline(random, 42, 0.04),
    hatch: hatching(random, 43),
    pores: pores(random, 43),
  };
}

function layout() {
  const random = seeded(2026);
  return Array.from({ length: COUNT }, (_, i) => {
    const duration = 28 + random() * 16;
    return {
      key: i,
      variant: i % VARIANTS,
      x: round((i / COUNT) * 100 + random() * (100 / COUNT) - 4),
      top: round(random() * 90),
      size: Math.round(48 + random() * 72),
      duration: round(duration),
      delay: -round(random() * duration),
      spin: Math.round((15 + random() * 25) * (random() > 0.5 ? 1 : -1)),
    };
  });
}

const SKETCHES = Array.from({ length: VARIANTS }, (_, i) => sketchPaths(101 + i * 37));
const ITEMS = layout();

export function BunueloRain() {
  return (
    <div className="bunuelo-rain" aria-hidden="true">
      <svg width="0" height="0" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          {SKETCHES.map((sketch, i) => (
            <symbol key={i} id={`bunuelo-sketch-${i}`} viewBox="0 0 100 100">
              <path className="sketch-line sketch-line--main" d={sketch.outline} />
              <path className="sketch-line sketch-line--thin" d={sketch.outlineInner} />
              <path className="sketch-line sketch-line--thin" d={sketch.hatch} />
              <path className="sketch-line sketch-line--thin" d={sketch.pores} />
            </symbol>
          ))}
        </defs>
      </svg>
      {ITEMS.map((item) => (
        <span
          key={item.key}
          className="bunuelo-item"
          style={{
            '--x': `${item.x}%`,
            '--top': `${item.top}%`,
            '--size': `${item.size}px`,
            '--dur': `${item.duration}s`,
            '--delay': `${item.delay}s`,
            '--spin': `${item.spin}deg`,
          }}
        >
          <svg className="bunuelo-sketch" viewBox="0 0 100 100" focusable="false">
            <use href={`#bunuelo-sketch-${item.variant}`} />
          </svg>
        </span>
      ))}
    </div>
  );
}
