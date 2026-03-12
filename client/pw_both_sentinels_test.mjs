import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== BOTH SENTINELS TEST ===\n");
  console.log("Verifying that BOTH start and end sentinels can trigger element additions\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[IO]') || text.includes('handleSentinel')) {
      console.log(`BROWSER: ${text}`);
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(500);

  const getState = async () => {
    return await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const rows = [];
      for (let r = 0; r < 2; r++) {
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
        const startSentinel = document.querySelector(`[data-testid="sentinel-start-${r}"]`);
        const endSentinel = document.querySelector(`[data-testid="sentinel-end-${r}"]`);
        
        const firstTitle = cards[0]?.querySelector('[data-testid^="text-movie-title-"]')?.textContent || '?';
        const lastTitle = cards[cards.length-1]?.querySelector('[data-testid^="text-movie-title-"]')?.textContent || '?';
        
        rows.push({
          row: r,
          cardCount: cards.length,
          first: firstTitle.slice(0, 20),
          last: lastTitle.slice(0, 20),
          startX: startSentinel?.getBoundingClientRect()?.x,
          endX: endSentinel?.getBoundingClientRect()?.x
        });
      }
      return { scrollLeft: vp?.scrollLeft || 0, rows };
    });
  };

  console.log("=== INITIAL STATE ===");
  let state = await getState();
  console.log(`scrollLeft: ${state.scrollLeft.toFixed(0)}`);
  for (const r of state.rows) {
    console.log(`Row ${r.row}: ${r.cardCount} cards, first="${r.first}", last="${r.last}"`);
    console.log(`         startX=${r.startX?.toFixed(0)}, endX=${r.endX?.toFixed(0)}`);
  }

  // Scroll forward to trigger END sentinels
  console.log("\n=== SCROLLING FORWARD (+5000px) to trigger END sentinels ===");
  await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    if (vp) vp.scrollLeft += 5000;
  });
  await page.waitForTimeout(300);
  
  state = await getState();
  console.log(`scrollLeft: ${state.scrollLeft.toFixed(0)}`);
  for (const r of state.rows) {
    console.log(`Row ${r.row}: ${r.cardCount} cards, first="${r.first}", last="${r.last}"`);
    console.log(`         startX=${r.startX?.toFixed(0)}, endX=${r.endX?.toFixed(0)}`);
  }

  // Now scroll backward to trigger START sentinels (simulating drag-right effect)
  console.log("\n=== SCROLLING BACKWARD (-3000px) to trigger START sentinels ===");
  await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    if (vp) vp.scrollLeft -= 3000;
  });
  await page.waitForTimeout(300);
  
  state = await getState();
  console.log(`scrollLeft: ${state.scrollLeft.toFixed(0)}`);
  for (const r of state.rows) {
    console.log(`Row ${r.row}: ${r.cardCount} cards, first="${r.first}", last="${r.last}"`);
    console.log(`         startX=${r.startX?.toFixed(0)}, endX=${r.endX?.toFixed(0)}`);
  }

  // Check if START sentinels are now in viewport
  const vpWidth = 1280;
  const buffer = 432;
  for (const r of state.rows) {
    const startInVp = r.startX !== undefined && r.startX > -buffer && r.startX < vpWidth + buffer;
    const endInVp = r.endX !== undefined && r.endX > -buffer && r.endX < vpWidth + buffer;
    
    console.log(`\nRow ${r.row}: startInViewport=${startInVp}, endInViewport=${endInVp}`);
    if (startInVp) {
      console.log(`  START sentinel should trigger and add elements at start`);
    }
    if (endInVp) {
      console.log(`  END sentinel should trigger and add elements at end`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
