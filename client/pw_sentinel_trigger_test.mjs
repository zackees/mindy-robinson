import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== SENTINEL TRIGGER TEST ===\n");
  console.log("Testing if IntersectionObserver fires as sentinels approach viewport...\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(500);

  const getState = async () => {
    return await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const startSentinel = document.querySelector(`[data-testid="sentinel-start-${r}"]`);
        const endSentinel = document.querySelector(`[data-testid="sentinel-end-${r}"]`);
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
        
        rows.push({
          row: r,
          cardCount: cards.length,
          startX: startSentinel?.getBoundingClientRect()?.x,
          endX: endSentinel?.getBoundingClientRect()?.x
        });
      }
      return { scrollLeft: vp?.scrollLeft || 0, rows };
    });
  };

  // Initial state
  let state = await getState();
  console.log(`Initial: scrollLeft=${state.scrollLeft}`);
  for (const r of state.rows) {
    const dir = r.row % 2 === 0 ? "LEFT" : "RIGHT";
    console.log(`  Row ${r.row} (${dir}): ${r.cardCount} cards, startX=${r.startX?.toFixed(0)}, endX=${r.endX?.toFixed(0)}`);
  }

  // Scroll in large increments until we see sentinel activity
  const totalScroll = 8000; // Scroll far enough for sentinels to enter and trigger
  const stepSize = 1000;
  
  for (let scrolled = 0; scrolled < totalScroll; scrolled += stepSize) {
    await page.evaluate((step) => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      if (vp) vp.scrollLeft += step;
    }, stepSize);
    await page.waitForTimeout(200);
    
    state = await getState();
    console.log(`\nAfter +${scrolled + stepSize}px total (scrollLeft=${state.scrollLeft.toFixed(0)}):`);
    
    let anyTriggerExpected = false;
    for (const r of state.rows) {
      const dir = r.row % 2 === 0 ? -1 : 1;
      const dirLabel = dir === -1 ? "LEFT" : "RIGHT";
      const leadingSentinelX = dir === -1 ? r.endX : r.startX;
      const leadingLabel = dir === -1 ? "end" : "start";
      
      // Check if leading sentinel is near viewport edge (within buffer ~500px)
      const buffer = 500;
      const nearViewport = dir === -1 
        ? (leadingSentinelX !== undefined && leadingSentinelX < 1280 + buffer)
        : (leadingSentinelX !== undefined && leadingSentinelX > -buffer);
      
      const indicator = nearViewport ? " <<< NEAR VIEWPORT" : "";
      if (nearViewport) anyTriggerExpected = true;
      
      console.log(`  Row ${r.row} (${dirLabel}): ${r.cardCount} cards, ${leadingLabel}SentinelX=${leadingSentinelX?.toFixed(0)}${indicator}`);
    }
    
    if (anyTriggerExpected) {
      console.log("  ** Sentinel should be triggering IntersectionObserver **");
    }
  }

  // Final check
  console.log("\n=== FINAL STATE ===");
  state = await getState();
  const initialCards = 24;
  for (const r of state.rows) {
    const dir = r.row % 2 === 0 ? "LEFT" : "RIGHT";
    const changed = r.cardCount !== initialCards ? ` (CHANGED from ${initialCards}!)` : " (unchanged)";
    console.log(`  Row ${r.row} (${dir}): ${r.cardCount} cards${changed}`);
    
    if (r.cardCount < 10) {
      console.log(`    *** WARNING: Very low card count! Carousel may be running out! ***`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
