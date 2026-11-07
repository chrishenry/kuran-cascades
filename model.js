// Preference falsification cascade model (Kuran 1995, after Granovetter 1978).
//
// Each person has a threshold: the share of the public (0 to 100) that must be
// openly opposing before they will join. The "propagation curve" F(x) is the
// share of people whose threshold is at or below x. If everyone expects a
// share x to be speaking up, then F(x) actually do, which becomes the next
// expectation. Opinion settles where F(x) = x.

// The curve is shaped by handles at these expected-opinion levels.
export const HANDLE_XS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const PRESETS = {
  fig43: {
    label: "Kuran's Figure 4.3",
    ys: [30, 32.5, 35, 37.5, 40, 43.5, 48, 53, 59, 66, 74],
    spark: 0,
    start: 20,
  },
  twoValleys: {
    label: "Two valleys",
    ys: [4, 9.5, 18.5, 28.5, 39, 74, 91, 95.5, 97.5, 98.5, 99],
    spark: 0,
    start: 4,
  },
  // Same crowd as twoValleys, then a small spark lowers every threshold.
  spark: {
    label: "A small spark",
    ys: [4, 9.5, 18.5, 28.5, 39, 74, 91, 95.5, 97.5, 98.5, 99],
    spark: 4,
    start: 4,
  },
};

export const CROWD_SIZES = [10, 100, 1000];

// Monotone cubic interpolation (Fritsch and Carlson), so the curve never
// dips: a share of people "at or below" a level can only grow with the level.
export function makeCurve(ys, xs = HANDLE_XS) {
  const n = xs.length;
  const h = [];
  const d = [];
  const m = new Array(n);
  for (let k = 0; k < n - 1; k++) {
    h[k] = xs[k + 1] - xs[k];
    d[k] = (ys[k + 1] - ys[k]) / h[k];
  }
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let k = 1; k < n - 1; k++) {
    m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
  }
  for (let k = 0; k < n - 1; k++) {
    if (d[k] === 0) {
      m[k] = 0;
      m[k + 1] = 0;
      continue;
    }
    const a = m[k] / d[k];
    const b = m[k + 1] / d[k];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[k] = t * a * d[k];
      m[k + 1] = t * b * d[k];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let k = 0;
    while (k < n - 2 && x > xs[k + 1]) k++;
    const t = (x - xs[k]) / h[k];
    const t2 = t * t;
    const t3 = t2 * t;
    const y =
      (2 * t3 - 3 * t2 + 1) * ys[k] +
      (t3 - 2 * t2 + t) * h[k] * m[k] +
      (-2 * t3 + 3 * t2) * ys[k + 1] +
      (t3 - t2) * h[k] * m[k + 1];
    return Math.min(100, Math.max(0, y));
  };
}

// The curve after a spark: everyone's threshold drops by `spark` points
// (a negative spark raises them).
export function shiftCurve(f, spark) {
  return (x) => {
    const u = x + spark;
    if (u < 0) return 0;
    return f(Math.min(100, u));
  };
}

// Smallest threshold level t with f(t) >= q. Infinity means this person
// never speaks up, even if everyone else does.
function inverse(f, q) {
  if (f(100) < q) return Infinity;
  if (f(0) >= q) return 0;
  let lo = 0;
  let hi = 100;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) >= q) hi = mid;
    else lo = mid;
  }
  return hi;
}

// Turn a smooth curve into a crowd of n people, sorted from bravest to most
// cautious. Person i sits at the middle of their slice of the population.
export function makeCrowd(f, n, spark = 0) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const base = inverse(f, ((i + 0.5) / n) * 100);
    out[i] = base === Infinity ? Infinity : Math.max(0, base - spark);
  }
  return out;
}

// Share of the crowd (0 to 100) whose threshold is at or below x.
export function makeShare(thresholds) {
  const n = thresholds.length;
  return (x) => {
    let lo = 0;
    let hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (thresholds[mid] <= x + 1e-9) lo = mid + 1;
      else hi = mid;
    }
    return (100 * lo) / n;
  };
}

// Repeatedly update the expectation to what people actually did, until it
// stops changing. Returns every expectation along the way.
export function run(share, x0, maxSteps = 5000) {
  const path = [x0];
  let x = x0;
  for (let i = 0; i < maxSteps; i++) {
    const y = share(x);
    if (Math.abs(y - x) < 1e-9) break;
    path.push(y);
    x = y;
  }
  return { path, rest: path[path.length - 1] };
}

// Where the smooth curve meets the diagonal. "rest" points pull opinion in;
// "tip" points push it away (the hilltop between two valleys).
export function crossings(f, step = 0.25) {
  const out = [];
  const g = (x) => f(x) - x;
  let prevX = 0;
  let prevG = g(0);
  if (Math.abs(prevG) < 1e-9 && g(step) < 0) out.push({ x: 0, kind: "rest" });
  for (let x = step; x <= 100 + 1e-9; x += step) {
    const gx = g(x);
    if (prevG > 0 && gx <= 0) {
      out.push({ x: root(g, prevX, x), kind: "rest" });
    } else if (prevG < 0 && gx >= 0 && x < 100) {
      out.push({ x: root(g, prevX, x), kind: "tip" });
    }
    prevX = x;
    prevG = gx;
  }
  return out;
}

function root(g, a, b) {
  let lo = a;
  let hi = b;
  const sLo = Math.sign(g(lo));
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (Math.sign(g(mid)) === sLo) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Height of the "bowl" in Kuran's panel B. Opinion rolls downhill: where more
// people act than expected (f(x) > x) the ground slopes down to the right.
// Slopes are square-rooted (softness 0.5) so a shallow valley next to a deep
// one stays visible. Valleys and hilltops stay exactly where they are; only
// their depths are softened. Pass softness 1 for the true heights.
export function landscape(f, step = 0.5, softness = 0.5) {
  const slope = (x) => {
    const g = x - f(x);
    return Math.sign(g) * Math.abs(g) ** softness;
  };
  const xs = [0];
  const vs = [0];
  let v = 0;
  let prev = slope(0);
  for (let x = step; x <= 100 + 1e-9; x += step) {
    const cur = slope(x);
    v += ((prev + cur) / 2) * step;
    xs.push(x);
    vs.push(v);
    prev = cur;
  }
  return { xs, vs };
}
