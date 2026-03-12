import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== DEBUG SCROLL TEST ===\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[step]') || text.includes('BLOCKED')) {
      console.log(`BROWSER: ${text}`);
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  console.log("=== SCROLLING FORWARD (5 steps of 1500px each) ===\n");
  
  for (let step = 1; step <= 5; step++) {
    console.log(`\n--- Step ${step}: +1500px ---`);
    
    await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      if (vp) vp.scrollLeft += 1500;
    });
    
    // Wait for sentinel triggers
    await page.waitForTimeout(300);
    
    // Check current state
    const state = await page.evaluate(() => {
      const rows = [];
      for (let r = 0; r < 2; r++) {
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
        rows.push({
          rowIndex: r,
          cardCount: cards.length,
          firstCard: cards[0]?.querySelector('[data-testid^="text-movie-title-"]')?.textContent?.slice(0, 12) || '?',
          lastCard: cards[cards.length-1]?.querySelector('[data-testid^="text-movie-title-"]')?.textContent?.slice(0, 12) || '?'
        });
      }
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      return { scrollLeft: vp?.scrollLeft, rows };
    });
    
    console.log(`scrollLeft: ${state.scrollLeft}`);
    for (const row of state.rows) {
      console.log(`Row ${row.rowIndex}: ${row.cardCount} cards, first="${row.firstCard}", last="${row.lastCard}"`);
    }
  }

  await browser.close();
  console.log("\n=== DONE ===");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
