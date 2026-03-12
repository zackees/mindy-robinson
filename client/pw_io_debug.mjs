import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== INTERSECTION OBSERVER DEBUG ===\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Capture console messages from the page
  const ioLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[IO]')) {
      ioLogs.push(text);
      console.log(`BROWSER: ${text}`);
    }
  });

  console.log("Navigating to page...");
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  
  console.log("Waiting for carousel...");
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(1000); // Wait for initial IO callbacks
  
  console.log(`\n--- Initial IO logs: ${ioLogs.length} ---`);
  
  // Scroll in increments
  for (let step = 1; step <= 10; step++) {
    console.log(`\n--- Scrolling step ${step} (+1000px) ---`);
    
    await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      if (vp) vp.scrollLeft += 1000;
    });
    
    await page.waitForTimeout(300);
    
    const state = await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      const rows = [];
      for (let r = 0; r < 5; r++) {
        const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
        rows.push({ row: r, cardCount: cards.length });
      }
      return { scrollLeft: vp?.scrollLeft || 0, rows };
    });
    
    console.log(`scrollLeft=${state.scrollLeft.toFixed(0)}, cards: ${state.rows.map(r => r.cardCount).join(', ')}`);
    console.log(`IO logs so far: ${ioLogs.length}`);
  }

  console.log("\n=== ALL IO LOGS ===");
  for (const log of ioLogs) {
    console.log(log);
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
