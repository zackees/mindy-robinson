import { describe, expect, test } from "vitest";
import { CarouselEngine } from "./MoviesCarousel.engine";

const makeBaseRows = (rowsCount: number, moviesPerRow: number) => {
  const baseRows: any[][] = [];
  for (let r = 0; r < rowsCount; r++) {
    baseRows.push(
      Array.from({ length: moviesPerRow }, (_, i) => ({
        title: `Movie ${r}-${i}`,
        year: "2024",
        description: "desc",
        thumbnailSrc: "/x.png",
        link: "https://example.com",
        link_text: "IMDb",
        streaming_links: [],
      }))
    );
  }
  return baseRows;
};

describe("CarouselEngine math", () => {
  test("rowX changes with scrollLeft using corrected scroll coefficient", () => {
    const rowsCount = 5;
    // Rows 0/2/4 move LEFT (direction=-1), rows 1/3 move RIGHT (direction=+1)
    const directions = [-1, 1, -1, 1, -1] as const;
    const eng = new CarouselEngine({
      rowsCount,
      baseRows: makeBaseRows(rowsCount, 30) as any,
      directions: directions as any,
      stridePx: 216,
      viewportWidth: 1200,
    });

    const s0 = eng.snapshot(100).rows.map((r) => r.rowX);
    const s1 = eng.snapshot(140).rows.map((r) => r.rowX);

    // New formula: rowX = base + (1+direction)*scrollLeft
    // direction=-1: coefficient=0, rowX constant
    // direction=+1: coefficient=2, rowX increases 2x scroll delta
    
    // rows 0/2/4 (direction=-1): coefficient=0, rowX doesn't change
    expect(s1[0] - s0[0]).toBeCloseTo(0);
    expect(s1[2] - s0[2]).toBeCloseTo(0);
    expect(s1[4] - s0[4]).toBeCloseTo(0);

    // rows 1/3 (direction=+1): coefficient=2, rowX increases by 2*40=80
    expect(s1[1] - s0[1]).toBeCloseTo(80);
    expect(s1[3] - s0[3]).toBeCloseTo(80);
  });

  test("leading-side sentinel step trims with anchor compensation", () => {
    const rowsCount = 2;
    // Row 0: direction=-1 (left motion), Row 1: direction=+1 (right motion)
    const directions = [-1, 1] as const;
    const eng = new CarouselEngine({
      rowsCount,
      baseRows: makeBaseRows(rowsCount, 50) as any,
      directions: directions as any,
      stridePx: 200,
      viewportWidth: 800,
    });

    const row0 = eng.rows[0];
    const row1 = eng.rows[1];

    // Force tiny maxWindow to make trim happen quickly
    eng.maxWindow = 6;

    // Row 0 (direction=-1, left motion): leading side is "end"
    const before0 = row0.getSnapshot(0).rowX;
    const did0 = eng.handleSentinel(0, "end", 1000);
    expect(did0).toBe(true);
    // when adding to end and trimming start, anchorShiftPx should increase by stride
    expect(row0.anchorShiftPx).toBe(200);
    const after0 = row0.getSnapshot(0).rowX;
    // rowX should shift by +stride due to anchor compensation (stability mechanism)
    expect(after0 - before0).toBe(200);

    // Row 1 (direction=+1, right motion): leading side is "start"
    const before1 = row1.getSnapshot(0).rowX;
    const did1 = eng.handleSentinel(1, "start", 1000);
    expect(did1).toBe(true);
    // adding to start always shifts anchor by -stride
    expect(row1.anchorShiftPx).toBe(-200);
    const after1 = row1.getSnapshot(0).rowX;
    expect(after1 - before1).toBe(-200);
  });
});
