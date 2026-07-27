import { describe, expect, test } from "bun:test";
import { anchorStyle, type AnchorRect, type Viewport } from "../src/lib/anchor.ts";

const VIEWPORT: Viewport = { width: 1000, height: 800 };
/** A trigger in the middle of the viewport, with room on both sides. */
const middle: AnchorRect = { top: 380, bottom: 400, left: 480, width: 40 };

describe("anchorStyle", () => {
  test("opens on the preferred side when it has room", () => {
    const below = anchorStyle(middle, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(below).toEqual({ position: "fixed", top: 408, left: 300, width: 400, maxHeight: 376 });

    const above = anchorStyle(middle, VIEWPORT, { prefer: "above", width: 400, minRoom: 200 });
    expect(above).toEqual({ position: "fixed", bottom: 428, left: 300, width: 400, maxHeight: 356 });
  });

  test("flips to the other side once the preferred one is too tight", () => {
    // 60px of room below, against a 200px demand.
    const low: AnchorRect = { top: 700, bottom: 716, left: 480, width: 40 };
    const style = anchorStyle(low, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(style).toEqual({ position: "fixed", bottom: 108, left: 300, width: 400, maxHeight: 676 });
  });

  test("flips a preferred-above popover downward near the top", () => {
    const high: AnchorRect = { top: 40, bottom: 60, left: 480, width: 40 };
    const style = anchorStyle(high, VIEWPORT, { prefer: "above", width: 400, minRoom: 200 });
    expect(style).toEqual({ position: "fixed", top: 68, left: 300, width: 400, maxHeight: 716 });
  });

  test("exactly minRoom counts as too tight, so the edge case flips rather than clipping", () => {
    // 200px below: viewport.height - bottom - MARGIN(24) === 200.
    const edge: AnchorRect = { top: 540, bottom: 576, left: 480, width: 40 };
    const style = anchorStyle(edge, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(style).toHaveProperty("bottom");
  });

  test("clamps horizontally inside the viewport rather than centring off-screen", () => {
    const left = anchorStyle({ top: 380, bottom: 400, left: 0, width: 40 }, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(left.left).toBe(16);

    const right = anchorStyle({ top: 380, bottom: 400, left: 960, width: 40 }, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(right.left).toBe(584); // 1000 - 400 - 16
  });

  test("narrows to fit a viewport smaller than the requested width", () => {
    const style = anchorStyle(middle, { width: 320, height: 800 }, { prefer: "below", width: 400, minRoom: 200 });
    expect(style.width).toBe(288); // 320 - 16*2
    expect(style.left).toBe(16);
  });

  test("never reports negative room for a trigger scrolled out of view", () => {
    const offscreen: AnchorRect = { top: 900, bottom: 940, left: 480, width: 40 };
    const style = anchorStyle(offscreen, VIEWPORT, { prefer: "below", width: 400, minRoom: 200 });
    expect(style.maxHeight).toBeGreaterThanOrEqual(0);
  });
});
