import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== SENTINEL POSITION DIAGNOSTIC ===\n");
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
  await page.waitForTimeout(500);

  const getState = async (label) => {
    return await page.evaluate((lbl) => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const vpRect = vp?.getBoundingClientRect();
      const vpWidth = vpRect?.width || 1280;
      
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const startSentinel = document.querySelector(`[data-testid="sentinel-start-${r}"]`);
        const endSentinel = document.querySelector(`[data-testid="sentinel-end-${r}"]`);
        const trackInner = document.querySelector(`[data-testid="trackInner-movies-${r}"]`);
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
        
        const startRect = startSentinel?.getBoundingClientRect();
        const endRect = endSentinel?.getBoundingClientRect();
        const trackRect = trackInner?.getBoundingClientRect();
        
        // Check if sentinel is inside or outside trackInner
        const startInsideTrack = startSentinel?.closest('[data-testid^="trackInner-"]') !== null;
        const endInsideTrack = endSentinel?.closest('[data-testid^="trackInner-"]') !== null;
        
        rows.push({
          row: r,
          cardCount: cards.length,
          startSentinel: {
            x: startRect?.x,
            insideTrack: startInsideTrack,
            inViewport: startRect ? (startRect.x >= 0 && startRect.x < vpWidth) : false
          },
          endSentinel: {
            x: endRect?.x,
            insideTrack: endInsideTrack,
            inViewport: endRect ? (endRect.x >= 0 && endRect.x < vpWidth) : false
          },
          trackX: trackRect?.x
        });
      }
      
      return {
        label: lbl,
        scrollLeft: vp?.scrollLeft || 0,
        vpWidth,
        rows
      };
    }, label);
  };

  // Initial state
  const state0 = await getState("Initial");
  printState(state0);

  // Check sentinel DOM structure
  console.log("\n=== DOM STRUCTURE CHECK ===");
  const domCheck = await page.evaluate(() => {
    const row0 = document.querySelector('[data-testid="row-movies-0"]');
    const startSentinel = document.querySelector('[data-testid="sentinel-start-0"]');
    const endSentinel = document.querySelector('[data-testid="sentinel-end-0"]');
    const trackInner = document.querySelector('[data-testid="trackInner-movies-0"]');
    
    return {
      startParent: startSentinel?.parentElement?.getAttribute('data-testid') || 'unknown',
      endParent: endSentinel?.parentElement?.getAttribute('data-testid') || 'unknown',
      trackParent: trackInner?.parentElement?.getAttribute('data-testid') || 'unknown',
      startInsideTrack: startSentinel?.closest('[data-testid^="trackInner-"]') !== null,
      endInsideTrack: endSentinel?.closest('[data-testid^="trackInner-"]') !== null
    };
  });
  
  console.log(`Start sentinel parent: ${domCheck.startParent}`);
  console.log(`End sentinel parent: ${domCheck.endParent}`);
  console.log(`Track parent: ${domCheck.trackParent}`);
  console.log(`Start sentinel inside trackInner: ${domCheck.startInsideTrack}`);
  console.log(`End sentinel inside trackInner: ${domCheck.endInsideTrack}`);
  
  if (!domCheck.startInsideTrack || !domCheck.endInsideTrack) {
    console.log("\n*** BUG CONFIRMED: Sentinels are OUTSIDE trackInner! ***");
    console.log("*** They won't move with the content transform! ***\n");
  }

  // Advance scroll significantly
  console.log("\n=== ADVANCING SCROLL ===");
  for (let step = 1; step <= 5; step++) {
    await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      if (vp) vp.scrollLeft += 500;
    });
    await page.waitForTimeout(100);
    
    const state = await getState(`After +${step * 500}px scroll`);
    printState(state);
  }

  // Final analysis
  console.log("\n=== ANALYSIS ===");
  const finalState = await getState("Final");
  
  for (const r of finalState.rows) {
    const direction = r.row % 2 === 0 ? -1 : 1;
    const dirLabel = direction === -1 ? "LEFT" : "RIGHT";
    const leadingSentinel = direction === -1 ? "end" : "start";
    
    console.log(`\nRow ${r.row} (moves ${dirLabel}, leading sentinel: ${leadingSentinel}):`);
    console.log(`  Cards in window: ${r.cardCount}`);
    console.log(`  Start sentinel x: ${r.startSentinel.x?.toFixed(0) || 'N/A'}, inViewport: ${r.startSentinel.inViewport}`);
    console.log(`  End sentinel x: ${r.endSentinel.x?.toFixed(0) || 'N/A'}, inViewport: ${r.endSentinel.inViewport}`);
    
    if (r.cardCount < 10) {
      console.log(`  *** WARNING: Low card count - carousel may be running out! ***`);
    }
  }

  await browser.close();
  console.log("\nDone.");
}

function printState(state) {
  console.log(`\n--- ${state.label} (scrollLeft=${state.scrollLeft.toFixed(0)}) ---`);
  for (const r of state.rows) {
    const startX = r.startSentinel.x?.toFixed(0) || 'N/A';
    const endX = r.endSentinel.x?.toFixed(0) || 'N/A';
    console.log(`  Row ${r.row}: ${r.cardCount} cards, startSentinel.x=${startX}, endSentinel.x=${endX}`);
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
