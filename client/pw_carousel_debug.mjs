import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Capture console messages from browser
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
  });

  console.log("Navigating to page...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  
  console.log("Waiting for carousel...");
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  
  // Check initial state
  await page.waitForTimeout(300);
  
  // Get the viewport scrollLeft
  const scrollInfo = await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    return {
      scrollLeft: vp?.scrollLeft || 0,
      scrollWidth: vp?.scrollWidth || 0,
      clientWidth: vp?.clientWidth || 0,
    };
  });
  console.log(`\nInitial viewport: scrollLeft=${scrollInfo.scrollLeft}, scrollWidth=${scrollInfo.scrollWidth}, clientWidth=${scrollInfo.clientWidth}`);
  
  // Check row transforms
  const initialTransforms = await page.evaluate(() => {
    const rows = [];
    for (let r = 0; r < 5; r++) {
      const el = document.querySelector(`[data-testid="trackInner-movies-${r}"]`);
      if (el) {
        const style = window.getComputedStyle(el);
        const rowXVar = el.style.getPropertyValue('--row-x');
        rows.push({ row: r, transform: style.transform, rowXVar });
      }
    }
    return rows;
  });
  console.log("\nInitial row state:");
  for (const r of initialTransforms) {
    console.log(`  Row ${r.row}: transform="${r.transform}", --row-x="${r.rowXVar}"`);
  }
  
  // Wait 1 second
  console.log("\nWaiting 1 second...");
  await page.waitForTimeout(1000);
  
  // Check after 1 second
  const afterScrollInfo = await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    return {
      scrollLeft: vp?.scrollLeft || 0,
    };
  });
  console.log(`\nAfter 1s viewport: scrollLeft=${afterScrollInfo.scrollLeft}`);
  
  const afterTransforms = await page.evaluate(() => {
    const rows = [];
    for (let r = 0; r < 5; r++) {
      const el = document.querySelector(`[data-testid="trackInner-movies-${r}"]`);
      if (el) {
        const style = window.getComputedStyle(el);
        const rowXVar = el.style.getPropertyValue('--row-x');
        rows.push({ row: r, transform: style.transform, rowXVar });
      }
    }
    return rows;
  });
  console.log("\nAfter 1s row state:");
  for (const r of afterTransforms) {
    console.log(`  Row ${r.row}: transform="${r.transform}", --row-x="${r.rowXVar}"`);
  }
  
  // Check if scrollLeft changed
  const scrollDelta = afterScrollInfo.scrollLeft - scrollInfo.scrollLeft;
  console.log(`\nScrollLeft delta: ${scrollDelta}px (expected ~18px)`);
  
  if (scrollDelta < 5) {
    console.log("\n!!! AUTO-ROTATION IS NOT WORKING - scrollLeft is not advancing !!!");
  }
  
  // Check transform deltas
  console.log("\nTransform analysis:");
  for (let i = 0; i < 5; i++) {
    const before = initialTransforms[i];
    const after = afterTransforms[i];
    if (before && after) {
      // Extract translateX from matrix
      const beforeMatch = before.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      const afterMatch = after.transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      const beforeX = beforeMatch ? parseFloat(beforeMatch[1]) : 0;
      const afterX = afterMatch ? parseFloat(afterMatch[1]) : 0;
      const delta = afterX - beforeX;
      console.log(`  Row ${i}: beforeX=${beforeX.toFixed(1)}, afterX=${afterX.toFixed(1)}, delta=${delta.toFixed(1)}px`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
