import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  makeCurve,
  shiftCurve,
  makeCrowd,
  makeShare,
  run,
  crossings,
  landscape,
} from "../model.js";

const near = (a, b, tol, msg) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg}: expected ${b} +/- ${tol}, got ${a}`);

function settle(preset, n, spark, start) {
  const f = makeCurve(preset.ys);
  const share = makeShare(makeCrowd(f, n, spark));
  return run(share, start).rest;
}

test("curve passes through its handles and never dips", () => {
  const ys = PRESETS.twoValleys.ys;
  const f = makeCurve(ys);
  ys.forEach((y, i) => near(f(i * 10), y, 1e-9, `handle ${i}`));
  let prev = -1;
  for (let x = 0; x <= 100; x += 0.1) {
    assert.ok(f(x) >= prev - 1e-9, `dips at ${x}`);
    prev = f(x);
  }
});

test("Figure 4.3: an expectation of 20 yields 35, and opinion settles at 40", () => {
  const f = makeCurve(PRESETS.fig43.ys);
  near(f(20), 35, 1e-9, "F(20)");
  const c = crossings(f);
  assert.equal(c.length, 1);
  near(c[0].x, 40, 0.3, "single resting point");
  for (const n of [100, 1000]) {
    near(settle(PRESETS.fig43, n, 0, 20), 40, 1.5, `n=${n} from 20`);
    near(settle(PRESETS.fig43, n, 0, 90), 40, 1.5, `n=${n} from 90`);
  }
});

test("two valleys: low and high resting points with a tipping point between", () => {
  const f = makeCurve(PRESETS.twoValleys.ys);
  const kinds = crossings(f).map((c) => c.kind);
  assert.deepEqual(kinds, ["rest", "tip", "rest"]);
});

test("a 4 point spark tips the crowd from the low valley to the high one", () => {
  // A 10-person crowd is lumpy (one person is 10 points), so it needs a bigger
  // spark; that is tested separately below.
  for (const n of [100, 1000]) {
    const low = settle(PRESETS.twoValleys, n, 0, 4);
    assert.ok(low < 25, `n=${n} low valley at ${low}`);
    const f = makeCurve(PRESETS.twoValleys.ys);
    const share = makeShare(makeCrowd(f, n, 4));
    const high = run(share, low).rest;
    assert.ok(high > 80, `n=${n} after spark at ${high}`);
  }
  const shifted = shiftCurve(makeCurve(PRESETS.twoValleys.ys), 4);
  assert.equal(crossings(shifted).length, 1);
});

test("a 10-person crowd still tips, with a larger spark", () => {
  const f = makeCurve(PRESETS.twoValleys.ys);
  const low = run(makeShare(makeCrowd(f, 10, 0)), 4).rest;
  assert.equal(low, 10);
  assert.equal(run(makeShare(makeCrowd(f, 10, 4)), low).rest, 10);
  assert.ok(run(makeShare(makeCrowd(f, 10, 8)), low).rest >= 80);
});

test("the bowl is lowest at the resting point", () => {
  const f = makeCurve(PRESETS.fig43.ys);
  const { xs, vs } = landscape(f);
  const i = vs.indexOf(Math.min(...vs));
  near(xs[i], 40, 1, "bowl bottom");
});

test("10-person crowd has 10 thresholds and share moves in 10 point steps", () => {
  const f = makeCurve(PRESETS.fig43.ys);
  const crowd = makeCrowd(f, 10);
  assert.equal(crowd.length, 10);
  const share = makeShare(crowd);
  for (let x = 0; x <= 100; x += 7) assert.equal(share(x) % 10, 0);
});
