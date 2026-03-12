import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log("Navigating to page...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  
  console.log("Waiting for carousel...");
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(300);

  const rowsCount = 5;
  const samples = [];
  
  // Simulate auto-scroll by advancing scrollLeft 18px/sec (18px per 1000ms)
  // We'll do 11 samples over 1 second, advancing 1.8px each time (100ms interval)
  console.log("\nSimulating auto-scroll by advancing scrollLeft manually...");
  
  for (let s = 0; s < 11; s++) {
    const time = s * 100;
    
    // Get current state
    const state = await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="text-movie-title-"]`);
        let thirdVisibleX = null;
        let thirdTitle = null;
        let visibleCount = 0;
        
        for (const card of cards) {
          const box = card.getBoundingClientRect();
          if (box.x + box.width > 0 && box.x < 1280) {
            visibleCount++;
            if (visibleCount === 3) {
              thirdVisibleX = box.x;
              thirdTitle = card.textContent?.trim() || "?";
              break;
            }
          }
        }
        
        rows.push({ row: r, x: thirdVisibleX, title: thirdTitle });
      }
      return { scrollLeft: vp?.scrollLeft || 0, rows };
    });
    
    samples.push({ time, ...state });
    
    // Advance scrollLeft by 1.8px (simulating 18px/sec over 100ms)
    if (s < 10) {
      await page.evaluate(() => {
        const vp = document.querySelector('[data-testid="carousel-viewport"]');
        if (vp) vp.scrollLeft += 1.8;
      });
      await page.waitForTimeout(100);
    }
  }

  // Print results
  console.log("\n=== CAROUSEL POSITION TRACKING (3rd visible card per row) ===\n");

  for (let r = 0; r < rowsCount; r++) {
    const expectedDir = r % 2 === 0 ? "LEFT (x decreases)" : "RIGHT (x increases)";
    console.log(`\nROW ${r} — Expected: ${expectedDir}`);
    console.log("-".repeat(70));

    const xValues = [];
    
    for (const s of samples) {
      const p = s.rows[r];
      const xStr = p.x !== null ? p.x.toFixed(1).padStart(8) : "    null";
      console.log(`  t=${String(s.time).padStart(4)}ms  x=${xStr}  title="${p.title}"  scrollLeft=${s.scrollLeft.toFixed(1)}`);
      if (p.x !== null) xValues.push(p.x);
    }

    if (xValues.length >= 2) {
      const startX = xValues[0];
      const endX = xValues[xValues.length - 1];
      const deltaX = endX - startX;
      
      console.log(`\n  RESULT: startX=${startX.toFixed(1)}, endX=${endX.toFixed(1)}, delta=${deltaX.toFixed(1)}px`);
      
      // CORRECTED expectations
      const directionCorrect = (r % 2 === 0 && deltaX < 0) || (r % 2 === 1 && deltaX > 0);
      const smooth = Math.abs(deltaX) > 10;
      
      console.log(`  Direction correct: ${directionCorrect ? "YES" : "NO"}`);
      console.log(`  Smooth motion (|delta| > 10px): ${smooth ? "YES" : "NO"}`);
    }
  }

  console.log("\n=== END REPORT ===\n");

  await browser.close();
  console.log("Done.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
