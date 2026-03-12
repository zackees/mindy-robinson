import { chromium } from "playwright";

const URL = "http://localhost:5000";
const SAMPLE_INTERVAL_MS = 100;
const DURATION_MS = 1000;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });

  // Wait for initial render
  await page.waitForTimeout(500);

  const rowsCount = 5;
  const samples = [];

  const numSamples = Math.ceil(DURATION_MS / SAMPLE_INTERVAL_MS) + 1;

  for (let s = 0; s < numSamples; s++) {
    const time = s * SAMPLE_INTERVAL_MS;
    const rowData = [];

    for (let r = 0; r < rowsCount; r++) {
      // Get all visible movie cards in this row
      const cards = await page.$$(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);

      // Find 3rd visible card (index 2) that's within viewport
      let thirdVisibleCard = null;
      let visibleCount = 0;

      for (const card of cards) {
        const box = await card.boundingBox();
        if (box && box.x + box.width > 0 && box.x < 1280) {
          visibleCount++;
          if (visibleCount === 3) {
            thirdVisibleCard = card;
            break;
          }
        }
      }

      if (thirdVisibleCard) {
        // Get the title element inside this card
        const titleEl = await thirdVisibleCard.$('[data-testid^="text-movie-title-"]');
        if (titleEl) {
          const titleBox = await titleEl.boundingBox();
          const titleText = await titleEl.textContent();
          rowData.push({
            row: r,
            title: titleText?.trim() || "?",
            x: titleBox?.x ?? null,
            y: titleBox?.y ?? null,
          });
        } else {
          rowData.push({ row: r, title: "no-title-el", x: null, y: null });
        }
      } else {
        rowData.push({ row: r, title: "no-3rd-visible", x: null, y: null });
      }
    }

    samples.push({ time, rows: rowData });
    if (s < numSamples - 1) await page.waitForTimeout(SAMPLE_INTERVAL_MS);
  }

  await browser.close();

  // Analyze and print results
  console.log("\n=== CAROUSEL POSITION TRACKING (3rd visible card per row) ===\n");

  for (let r = 0; r < rowsCount; r++) {
    const direction = r % 2 === 0 ? "+1 (should move LEFT, x decreases)" : "-1 (should move RIGHT, x increases)";
    console.log(`\nROW ${r} — direction: ${direction}`);
    console.log("-".repeat(70));

    const positions = samples.map((s) => s.rows[r]);
    const xValues = positions.map((p) => p.x).filter((x) => x !== null);

    if (xValues.length < 2) {
      console.log("  Not enough data points");
      continue;
    }

    // Print samples
    for (const s of samples) {
      const p = s.rows[r];
      console.log(`  t=${String(s.time).padStart(4)}ms  x=${p.x !== null ? p.x.toFixed(1).padStart(7) : "   null"}  title="${p.title}"`);
    }

    // Calculate movement
    const startX = xValues[0];
    const endX = xValues[xValues.length - 1];
    const deltaX = endX - startX;
    const expectedSpeed = 18; // px/sec from engine
    const expectedDelta = r % 2 === 0 ? -expectedSpeed : expectedSpeed; // direction=+1 means translate increases, so cards move LEFT (x decreases)

    console.log(`\n  ANALYSIS:`);
    console.log(`    Start X: ${startX.toFixed(1)}`);
    console.log(`    End X:   ${endX.toFixed(1)}`);
    console.log(`    Delta:   ${deltaX.toFixed(1)} px over ${DURATION_MS}ms`);
    console.log(`    Expected delta (approx): ${expectedDelta} px/sec → ~${expectedDelta.toFixed(1)} px over 1s`);
    console.log(`    Direction correct: ${(deltaX < 0 && r % 2 === 0) || (deltaX > 0 && r % 2 === 1) ? "YES" : "NO"}`);
    console.log(`    Smooth (|delta| > 10): ${Math.abs(deltaX) > 10 ? "YES" : "NO (jittering or stuck)"}`);
  }

  console.log("\n=== END REPORT ===\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
