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
  
  // Get initial state
  const getState = async () => {
    return await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const el = document.querySelector(`[data-testid="trackInner-movies-${r}"]`);
        const style = el ? window.getComputedStyle(el) : null;
        const matrix = style?.transform || "none";
        const match = matrix.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
        const translateX = match ? parseFloat(match[1]) : 0;
        rows.push({ row: r, translateX });
      }
      return {
        scrollLeft: vp?.scrollLeft || 0,
        rows
      };
    });
  };

  const before = await getState();
  console.log(`\nBefore scroll: scrollLeft=${before.scrollLeft}`);
  for (const r of before.rows) {
    console.log(`  Row ${r.row}: translateX=${r.translateX.toFixed(1)}px`);
  }

  // Manually advance scrollLeft to simulate auto-rotation
  console.log("\nManually advancing scrollLeft by 100px...");
  await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    if (vp) vp.scrollLeft += 100;
  });
  
  await page.waitForTimeout(100); // Let React re-render

  const after = await getState();
  console.log(`\nAfter scroll: scrollLeft=${after.scrollLeft}`);
  for (const r of after.rows) {
    console.log(`  Row ${r.row}: translateX=${r.translateX.toFixed(1)}px`);
  }

  // Analyze
  console.log("\n=== ANALYSIS ===");
  console.log(`scrollLeft changed by: ${after.scrollLeft - before.scrollLeft}px`);
  console.log("\nExpected behavior:");
  console.log("  - Rows 0/2/4 (direction=+1): translateX should INCREASE by scrollLeft delta");
  console.log("  - Rows 1/3 (direction=-1): translateX should DECREASE by scrollLeft delta");
  console.log("\nActual changes:");
  
  for (let i = 0; i < 5; i++) {
    const beforeX = before.rows[i].translateX;
    const afterX = after.rows[i].translateX;
    const delta = afterX - beforeX;
    const expectedSign = i % 2 === 0 ? "+" : "-";
    const actualSign = delta > 0 ? "+" : delta < 0 ? "-" : "0";
    const correct = (i % 2 === 0 && delta > 0) || (i % 2 === 1 && delta < 0);
    console.log(`  Row ${i}: delta=${delta.toFixed(1)}px (expected ${expectedSign}, got ${actualSign}) ${correct ? "OK" : "WRONG"}`);
  }

  // Check if transforms changed at all
  const anyChange = before.rows.some((r, i) => Math.abs(r.translateX - after.rows[i].translateX) > 0.5);
  if (!anyChange) {
    console.log("\n!!! CRITICAL: Transforms did NOT change when scrollLeft changed !!!");
    console.log("This means the React state is not updating in response to scroll.");
    console.log("The snapshot() function is probably not being called to recompute rowX.");
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
