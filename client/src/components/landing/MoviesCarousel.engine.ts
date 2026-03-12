import type { movies } from "@/data/movies";

export type Movie = (typeof movies)[number];

export type MovieInstance = {
  instanceId: string;
  movie: Movie;
};

export type Cursor = { start: number; end: number };

export type RowSnapshot = {
  rowIndex: number;
  direction: 1 | -1;
  instances: MovieInstance[];
  rowX: number;
};

export type CarouselSnapshot = {
  rows: RowSnapshot[];
};

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function modIndex(n: number, m: number) {
  return ((n % m) + m) % m;
}

export class CarouselRowEngine {
  rowIndex: number;
  direction: 1 | -1;
  base: Movie[];

  cursors: Cursor;
  seq: number;
  window: MovieInstance[];

  baseOffsetPx: number;
  dragDeltaPx: number;
  anchorShiftPx: number;

  cooldownUntil: number;

  constructor(opts: {
    rowIndex: number;
    direction: 1 | -1;
    base: Movie[];
    initialCount: number;
    baseOffsetPx: number;
    initialCursorStart?: number;
  }) {
    this.rowIndex = opts.rowIndex;
    this.direction = opts.direction;
    this.base = opts.base;

    const baseLen = Math.max(1, this.base.length);

    const start = opts.initialCursorStart ?? 0;
    const end = start + opts.initialCount;

    this.cursors = { start, end };
    this.seq = 0;
    this.cooldownUntil = 0;

    this.baseOffsetPx = opts.baseOffsetPx;
    this.dragDeltaPx = 0;
    this.anchorShiftPx = 0;

    this.window = Array.from({ length: opts.initialCount }, (_, i) => {
      const movie = this.base[modIndex(start + i, baseLen)] as Movie;
      const id = `${this.rowIndex}-${this.seq++}`;
      return { instanceId: id, movie };
    });
  }

  getSnapshot(scrollLeft: number): RowSnapshot {
    // Card screen position = cardPos + rowX - scrollLeft
    // For left motion (direction=-1): we want screenX to decrease → coefficient = 0
    // For right motion (direction=+1): we want screenX to increase → coefficient = 2
    // Formula: rowX = base + (1 + direction) * scrollLeft
    //   direction=-1: (1-1)=0 → rowX constant, screen moves left with scroll
    //   direction=+1: (1+1)=2 → rowX grows 2x scroll, screen moves right
    const scrollCoeff = 1 + this.direction;
    const rowX = this.baseOffsetPx + scrollCoeff * scrollLeft + this.dragDeltaPx + this.anchorShiftPx;
    return {
      rowIndex: this.rowIndex,
      direction: this.direction,
      instances: this.window,
      rowX,
    };
  }

  setDragDeltaPx(next: number) {
    this.dragDeltaPx = next;
  }

  stepIfIntersect(side: "start" | "end", stridePx: number, maxWindow: number, nowMs: number): boolean {
    // Handle BOTH sentinels - when either enters viewport, add elements on that side
    // This supports both natural scrolling AND dragging in the opposite direction
    if (nowMs < this.cooldownUntil) return false;

    this.cooldownUntil = nowMs + 60;

    const baseLen = Math.max(1, this.base.length);

    if (side === "end") {
      const movie = this.base[modIndex(this.cursors.end, baseLen)] as Movie;
      this.cursors.end += 1;
      this.window.push({ instanceId: `${this.rowIndex}-${this.seq++}`, movie });

      if (this.window.length > maxWindow) {
        this.window.shift();
        this.anchorShiftPx += stridePx;
      }
      return true;
    }

    this.cursors.start -= 1;
    const movie = this.base[modIndex(this.cursors.start, baseLen)] as Movie;
    this.window.unshift({ instanceId: `${this.rowIndex}-${this.seq++}`, movie });
    this.anchorShiftPx -= stridePx;

    if (this.window.length > maxWindow) {
      this.window.pop();
    }

    return true;
  }
}

export class CarouselEngine {
  rowsCount: number;
  baseRows: Movie[][];
  directions: (1 | -1)[];

  rows: CarouselRowEngine[];

  stridePx: number;
  bufferPx: number;
  minWindow: number;
  maxWindow: number;

  constructor(opts: {
    rowsCount: number;
    baseRows: Movie[][];
    directions: (1 | -1)[];
    stridePx: number;
    viewportWidth: number;
  }) {
    this.rowsCount = opts.rowsCount;
    this.baseRows = opts.baseRows;
    this.directions = opts.directions;

    this.stridePx = opts.stridePx;
    this.bufferPx = 2 * this.stridePx;

    const dragReservePx = 3 * this.stridePx;
    const requiredPx = opts.viewportWidth + 2 * this.bufferPx + dragReservePx;
    this.minWindow = Math.ceil(requiredPx / this.stridePx) + 2;
    this.maxWindow = clampNumber(this.minWindow + 6, 24, 44);

    this.rows = Array.from({ length: this.rowsCount }, (_, rowIndex) => {
      const base = this.baseRows[rowIndex] ?? [];
      const baseOffsetPx = ((rowIndex % 2 === 0 ? 1 : -1) * this.stridePx * rowIndex) / 3;
      return new CarouselRowEngine({
        rowIndex,
        direction: this.directions[rowIndex] ?? 1,
        base,
        initialCount: this.maxWindow,
        baseOffsetPx,
      });
    });
  }

  updateGeometry(stridePx: number, viewportWidth: number) {
    this.stridePx = stridePx;
    this.bufferPx = 2 * this.stridePx;

    const dragReservePx = 3 * this.stridePx;
    const requiredPx = viewportWidth + 2 * this.bufferPx + dragReservePx;
    this.minWindow = Math.ceil(requiredPx / this.stridePx) + 2;
    this.maxWindow = clampNumber(this.minWindow + 6, 24, 44);
  }

  snapshot(scrollLeft: number): CarouselSnapshot {
    return { rows: this.rows.map((r) => r.getSnapshot(scrollLeft)) };
  }

  handleSentinel(rowIndex: number, side: "start" | "end", nowMs: number) {
    const row = this.rows[rowIndex];
    if (!row) return false;
    return row.stepIfIntersect(side, this.stridePx, this.maxWindow, nowMs);
  }
}
