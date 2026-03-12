import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  console.log("Creating page...");
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log("Navigating to page...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  
  console.log("Waiting for carousel...");
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(600);

  const rowsCount = 5;
  
  // Take 11 samples over 1 second (every 100ms)
  const samples = [];
  
  for (let s = 0; s < 11; s++) {
    const time = s * 100;
    const rowData = [];

    for (let r = 0; r < rowsCount; r++) {
      // Get the trackInner element which has --row-x style
      const trackInner = await page.$(`[data-testid="trackInner-movies-${r}"]`);
      
      if (trackInner) {
        // Get the computed transform to see actual position
        const transform = await trackInner.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.transform;
        });
        
        // Also get the first few card positions
        const cards = await page.$$(`[data-testid="row-movies-${r}"] [data-testid^="text-movie-title-"]`);
        
        let thirdVisibleX = null;
        let thirdTitle = null;
        let visibleCount = 0;
        
        for (const card of cards) {
          const box = await card.boundingBox();
          if (box && box.x + box.width > 0 && box.x < 1280) {
            visibleCount++;
            if (visibleCount === 3) {
              thirdVisibleX = box.x;
              thirdTitle = await card.textContent();
              break;
            }
          }
        }
        
        rowData.push({
          row: r,
          transform,
          thirdVisibleX,
          thirdTitle: thirdTitle?.trim() || "?"
        });
      } else {
        rowData.push({ row: r, transform: null, thirdVisibleX: null, thirdTitle: "?" });
      }
    }

    samples.push({ time, rows: rowData });
    if (s < 10) await page.waitForTimeout(100);
  }

  await browser.close();

  // Print results
  console.log("\n=== CAROUSEL POSITION TRACKING ===\n");

  for (let r = 0; r < rowsCount; r++) {
    const expectedDir = r % 2 === 0 ? "LEFT (x should decrease)" : "RIGHT (x should increase)";
    console.log(`\nROW ${r} — Expected: ${expectedDir}`);
    console.log("-".repeat(80));

    const xValues = [];
    
    for (const s of samples) {
      const p = s.rows[r];
      const xStr = p.thirdVisibleX !== null ? p.thirdVisibleX.toFixed(1).padStart(8) : "    null";
      console.log(`  t=${String(s.time).padStart(4)}ms  x=${xStr}  title="${p.thirdTitle}"  transform="${p.transform}"`);
      if (p.thirdVisibleX !== null) xValues.push(p.thirdVisibleX);
    }

    if (xValues.length >= 2) {
      const startX = xValues[0];
      const endX = xValues[xValues.length - 1];
      const deltaX = endX - startX;
      
      console.log(`\n  RESULT: startX=${startX.toFixed(1)}, endX=${endX.toFixed(1)}, delta=${deltaX.toFixed(1)}px`);
      
      const directionCorrect = (r % 2 === 0 && deltaX < 0) || (r % 2 === 1 && deltaX > 0);
      const smooth = Math.abs(deltaX) > 10;
      
      console.log(`  Direction correct: ${directionCorrect ? "YES" : "NO"}`);
      console.log(`  Smooth motion (|delta| > 10px): ${smooth ? "YES" : "NO"}`);
    }
  }

  console.log("\n=== END REPORT ===\n");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
