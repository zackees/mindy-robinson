import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== EXPLICIT DRAG TEST ===\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  console.log("Navigating to page...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  
  console.log("Waiting for carousel...");
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const getRowState = async (rowIndex) => {
    return await page.evaluate((r) => {
      const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
      const startSentinel = document.querySelector(`[data-testid="sentinel-start-${r}"]`);
      const endSentinel = document.querySelector(`[data-testid="sentinel-end-${r}"]`);
      
      const titles = Array.from(cards).slice(0, 3).map(c => 
        c.querySelector('[data-testid^="text-movie-title-"]')?.textContent || '?'
      );
      
      return {
        cardCount: cards.length,
        firstThreeTitles: titles,
        startSentinelX: startSentinel?.getBoundingClientRect()?.x,
        endSentinelX: endSentinel?.getBoundingClientRect()?.x
      };
    }, rowIndex);
  };

  console.log("=== INITIAL STATE ===");
  let state = await getRowState(0);
  console.log(`Row 0: ${state.cardCount} cards`);
  console.log(`First 3 titles: ${state.firstThreeTitles.join(' | ')}`);
  console.log(`Start sentinel x: ${state.startSentinelX?.toFixed(0)}, End: ${state.endSentinelX?.toFixed(0)}`);

  // Find a card in row 0 to drag
  const card = await page.$('[data-testid="row-movies-0"] [data-testid^="card-movie-"]');
  const cardBox = await card.boundingBox();
  
  console.log(`\nCard position: x=${cardBox.x.toFixed(0)}, y=${cardBox.y.toFixed(0)}`);

  // Use explicit pointer events
  console.log("\n=== DRAGGING RIGHT (800px) using explicit pointer events ===");
  
  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  
  // Dispatch raw pointer events
  await page.evaluate(async ({ sx, sy, distance }) => {
    const el = document.elementFromPoint(sx, sy);
    if (!el) return 'No element found';
    
    console.log('[DRAG] Starting at element:', el.tagName, el.getAttribute('data-testid'));
    
    // Create and dispatch pointerdown
    const downEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: sx,
      clientY: sy,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0
    });
    el.dispatchEvent(downEvent);
    
    // Move in increments
    for (let dx = 0; dx <= distance; dx += 50) {
      await new Promise(r => setTimeout(r, 16));
      const moveEvent = new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: sx + dx,
        clientY: sy,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
      });
      window.dispatchEvent(moveEvent);
    }
    
    // Pointer up
    await new Promise(r => setTimeout(r, 16));
    const upEvent = new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      clientX: sx + distance,
      clientY: sy,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true
    });
    window.dispatchEvent(upEvent);
    
    return 'Done';
  }, { sx: startX, sy: startY, distance: 800 });

  await page.waitForTimeout(300);

  console.log("\n=== AFTER DRAG ===");
  state = await getRowState(0);
  console.log(`Row 0: ${state.cardCount} cards`);
  console.log(`First 3 titles: ${state.firstThreeTitles.join(' | ')}`);
  console.log(`Start sentinel x: ${state.startSentinelX?.toFixed(0)}, End: ${state.endSentinelX?.toFixed(0)}`);

  // Alternative: Use page.drag which uses CDP
  console.log("\n=== ALTERNATIVE: Scroll-based simulation ===");
  console.log("Simulating drag by directly updating dragDeltaPx via exposed function...");
  
  // We can simulate drag by directly calling the engine's setDragDeltaPx
  // But that requires accessing React internals which is complex
  
  // Instead, let's just verify the sentinel logic works with manual scroll
  console.log("Advancing scrollLeft to trigger sentinels...");
  await page.evaluate(() => {
    const vp = document.querySelector('[data-testid="carousel-viewport"]');
    if (vp) vp.scrollLeft += 3000;
  });
  await page.waitForTimeout(300);
  
  state = await getRowState(0);
  console.log(`\nAfter +3000px scroll:`);
  console.log(`Row 0: ${state.cardCount} cards`);
  console.log(`First 3 titles: ${state.firstThreeTitles.join(' | ')}`);
  console.log(`Start sentinel x: ${state.startSentinelX?.toFixed(0)}, End: ${state.endSentinelX?.toFixed(0)}`);

  // Check if titles changed (indicating new cards were loaded)
  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
