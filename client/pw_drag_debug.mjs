import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== DRAG BEHAVIOR DEBUG ===\n");
  console.log("Testing: Dragging row 0 to the RIGHT (opposite to natural LEFT motion)\n");
  
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

  const getRowState = async (rowIndex) => {
    return await page.evaluate((r) => {
      const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
      const startSentinel = document.querySelector(`[data-testid="sentinel-start-${r}"]`);
      const endSentinel = document.querySelector(`[data-testid="sentinel-end-${r}"]`);
      const trackInner = document.querySelector(`[data-testid="trackInner-movies-${r}"]`);
      
      const firstCard = cards[0];
      const lastCard = cards[cards.length - 1];
      
      return {
        cardCount: cards.length,
        firstCardTitle: firstCard?.querySelector('[data-testid^="text-movie-title-"]')?.textContent || 'N/A',
        lastCardTitle: lastCard?.querySelector('[data-testid^="text-movie-title-"]')?.textContent || 'N/A',
        startSentinelX: startSentinel?.getBoundingClientRect()?.x,
        endSentinelX: endSentinel?.getBoundingClientRect()?.x,
        trackTransform: trackInner?.style?.getPropertyValue('--row-x') || 'N/A'
      };
    }, rowIndex);
  };

  // Initial state
  console.log("=== INITIAL STATE (Row 0) ===");
  let state = await getRowState(0);
  console.log(`Cards: ${state.cardCount}`);
  console.log(`First card: "${state.firstCardTitle}"`);
  console.log(`Last card: "${state.lastCardTitle}"`);
  console.log(`Start sentinel x: ${state.startSentinelX?.toFixed(0)}`);
  console.log(`End sentinel x: ${state.endSentinelX?.toFixed(0)}`);
  console.log(`Track transform: ${state.trackTransform}`);

  // Get row 0 position for drag
  const row0 = await page.$('[data-testid="row-movies-0"]');
  const box = await row0.boundingBox();
  
  console.log(`\nRow 0 position: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);

  // Simulate drag to the RIGHT (positive dx)
  const dragStartX = box.x + box.width / 2;
  const dragStartY = box.y + box.height / 2;
  const dragDistance = 800; // Drag 800px to the right

  console.log(`\n=== SIMULATING DRAG TO RIGHT (+${dragDistance}px) ===`);
  console.log(`Drag from (${dragStartX.toFixed(0)}, ${dragStartY.toFixed(0)}) to (${(dragStartX + dragDistance).toFixed(0)}, ${dragStartY.toFixed(0)})`);

  // Perform drag
  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  
  // Drag in increments to allow React to update
  for (let dx = 0; dx <= dragDistance; dx += 100) {
    await page.mouse.move(dragStartX + dx, dragStartY);
    await page.waitForTimeout(50);
    
    if (dx % 200 === 0) {
      state = await getRowState(0);
      console.log(`\nAt drag offset +${dx}px:`);
      console.log(`  Cards: ${state.cardCount}, first="${state.firstCardTitle}", last="${state.lastCardTitle}"`);
      console.log(`  Start sentinel x: ${state.startSentinelX?.toFixed(0)}, End sentinel x: ${state.endSentinelX?.toFixed(0)}`);
    }
  }
  
  await page.mouse.up();
  await page.waitForTimeout(200);

  console.log("\n=== AFTER DRAG RELEASE ===");
  state = await getRowState(0);
  console.log(`Cards: ${state.cardCount}`);
  console.log(`First card: "${state.firstCardTitle}"`);
  console.log(`Last card: "${state.lastCardTitle}"`);
  console.log(`Start sentinel x: ${state.startSentinelX?.toFixed(0)}`);
  console.log(`End sentinel x: ${state.endSentinelX?.toFixed(0)}`);
  console.log(`Track transform: ${state.trackTransform}`);

  // Check if START sentinel is now near or inside viewport
  const vpWidth = 1280;
  const buffer = 432; // 2 * stridePx
  const startNearViewport = state.startSentinelX !== undefined && state.startSentinelX > -buffer && state.startSentinelX < vpWidth;
  
  console.log(`\n=== ANALYSIS ===`);
  console.log(`Row 0 direction: -1 (natural LEFT motion)`);
  console.log(`When dragging RIGHT, content moves RIGHT, START sentinel approaches from LEFT`);
  console.log(`Leading sentinel for LEFT motion: END`);
  console.log(`But when dragging RIGHT, we need START sentinel to trigger (opposite edge)`);
  console.log(`Start sentinel near viewport (within buffer): ${startNearViewport}`);
  
  if (state.startSentinelX !== undefined && state.startSentinelX > 0 && state.startSentinelX < vpWidth) {
    console.log(`\n*** START sentinel IS inside viewport! Should have triggered! ***`);
    console.log(`*** BUG: The sentinel logic only handles the "leading" edge, not the opposite edge! ***`);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
