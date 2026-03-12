import { chromium } from "playwright";

const URL = "http://localhost:5000";

async function main() {
  console.log("=== DEEP SCROLL TEST - Finding Card Gaps ===\n");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const analyzeRow = async (rowIndex) => {
    return await page.evaluate((r) => {
      const cards = document.querySelectorAll(`[data-testid="row-movies-${r}"] [data-testid^="card-movie-"]`);
      const cardData = [];
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const title = card.querySelector('[data-testid^="text-movie-title-"]')?.textContent || '?';
        cardData.push({
          index: i,
          title: title.slice(0, 15),
          x: rect.x,
          width: rect.width,
          right: rect.x + rect.width
        });
      }
      
      // Check for gaps between consecutive cards
      const gaps = [];
      for (let i = 1; i < cardData.length; i++) {
        const prevRight = cardData[i-1].right;
        const currLeft = cardData[i].x;
        const gap = currLeft - prevRight;
        // Expected gap is around 16px (CSS gap), anything significantly different is a problem
        if (gap > 30 || gap < 10) {
          gaps.push({
            between: `${i-1}-${i}`,
            prevTitle: cardData[i-1].title,
            currTitle: cardData[i].title,
            gap: gap,
            prevRight: prevRight,
            currLeft: currLeft
          });
        }
      }
      
      return {
        cardCount: cards.length,
        cards: cardData.slice(0, 5), // First 5 cards
        gaps,
        hasGaps: gaps.length > 0
      };
    }, rowIndex);
  };

  console.log("=== INITIAL STATE ===");
  for (let r = 0; r < 2; r++) {
    const analysis = await analyzeRow(r);
    console.log(`\nRow ${r}: ${analysis.cardCount} cards`);
    console.log(`First 5 cards:`, analysis.cards.map(c => `${c.title}@${c.x.toFixed(0)}`).join(', '));
    if (analysis.hasGaps) {
      console.log(`*** GAPS FOUND:`, analysis.gaps);
    }
  }

  // Deep scroll - many increments
  console.log("\n=== DEEP SCROLLING (20 increments of 500px each = 10000px total) ===");
  
  for (let step = 1; step <= 20; step++) {
    await page.evaluate(() => {
      const vp = document.querySelector('[data-testid="carousel-viewport"]');
      if (vp) vp.scrollLeft += 500;
    });
    await page.waitForTimeout(100);
    
    // Check for gaps after each scroll
    for (let r = 0; r < 2; r++) {
      const analysis = await analyzeRow(r);
      if (analysis.hasGaps) {
        console.log(`\n*** GAP DETECTED at step ${step} (scrollLeft=${step * 500}), Row ${r}:`);
        for (const gap of analysis.gaps) {
          console.log(`  Between cards ${gap.between}: "${gap.prevTitle}" and "${gap.currTitle}"`);
          console.log(`  Gap size: ${gap.gap.toFixed(0)}px (prevRight=${gap.prevRight.toFixed(0)}, currLeft=${gap.currLeft.toFixed(0)})`);
        }
      }
    }
  }

  console.log("\n=== FINAL STATE ===");
  for (let r = 0; r < 2; r++) {
    const analysis = await analyzeRow(r);
    console.log(`\nRow ${r}: ${analysis.cardCount} cards`);
    console.log(`First 5 cards:`, analysis.cards.map(c => `${c.title}@${c.x.toFixed(0)}`).join(', '));
    if (analysis.hasGaps) {
      console.log(`*** GAPS FOUND:`, analysis.gaps);
    } else {
      console.log(`No gaps detected.`);
    }
  }

  // Check visible cards in viewport
  console.log("\n=== CARDS IN VIEWPORT (0-1280px) ===");
  for (let r = 0; r < 2; r++) {
    const visibleCards = await page.evaluate((rowIdx) => {
      const cards = document.querySelectorAll(`[data-testid="row-movies-${rowIdx}"] [data-testid^="card-movie-"]`);
      const visible = [];
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (rect.right > 0 && rect.x < 1280) {
          const title = card.querySelector('[data-testid^="text-movie-title-"]')?.textContent || '?';
          visible.push({
            title: title.slice(0, 15),
            x: rect.x.toFixed(0),
            right: (rect.x + rect.width).toFixed(0)
          });
        }
      }
      return visible;
    }, r);
    
    console.log(`\nRow ${r} visible cards (${visibleCards.length}):`);
    for (const card of visibleCards) {
      console.log(`  "${card.title}" at x=${card.x} to ${card.right}`);
    }
    
    // Check for gaps in visible cards
    for (let i = 1; i < visibleCards.length; i++) {
      const prevRight = parseInt(visibleCards[i-1].right);
      const currLeft = parseInt(visibleCards[i].x);
      const gap = currLeft - prevRight;
      if (gap > 30) {
        console.log(`  *** GAP of ${gap}px between "${visibleCards[i-1].title}" and "${visibleCards[i].title}" ***`);
      }
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
