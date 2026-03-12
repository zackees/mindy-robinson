import { test, expect } from "@playwright/test";

test.setTimeout(60000);

test.describe("Carousel Card Open Jump Bug", () => {
  test("carousel should not jump after opening and closing a card", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait for carousel to be visible
    const carousel = page.locator('[data-testid="carousel-movies"]');
    await expect(carousel).toBeVisible({ timeout: 10000 });
    await carousel.scrollIntoViewIfNeeded();
    
    // Get the first row
    const firstRow = page.locator('[data-testid="row-movies-0"]');
    await expect(firstRow).toBeVisible();
    
    const swiperWrapper = firstRow.locator('.swiper-wrapper');
    await expect(swiperWrapper).toBeVisible();
    
    const getTransform = async () => {
      return await swiperWrapper.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const transform = style.transform;
        const match = transform.match(/matrix\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^,]+),/);
        return match ? parseFloat(match[1]) : 0;
      });
    };
    
    // Let carousel scroll for a bit
    await page.waitForTimeout(2000);
    
    // Hover to pause
    await firstRow.hover();
    await page.waitForTimeout(300);
    
    // Click a card to open it
    const cards = firstRow.locator('.swiper-slide .dvd-case');
    const targetCard = cards.nth(3);
    await expect(targetCard).toBeVisible();
    
    const box = await targetCard.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    console.log("Card clicked to open");
    await page.waitForTimeout(500);
    
    const afterOpenPosition = await getTransform();
    console.log("Position after card open:", afterOpenPosition);
    
    // Keep card open for 5 seconds
    await page.waitForTimeout(5000);
    
    const stillOpenPosition = await getTransform();
    console.log("Position still open:", stillOpenPosition);
    
    // Click again to close or move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    
    const afterClosePosition = await getTransform();
    console.log("Position after close:", afterClosePosition);
    
    // Track for 15 seconds looking for jumps
    const positions: number[] = [afterClosePosition];
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(1000);
      const pos = await getTransform();
      positions.push(pos);
      console.log(`Position at ${i + 1}s after close:`, pos);
    }
    
    // Check for jumps
    let hasJump = false;
    for (let i = 1; i < positions.length; i++) {
      const diff = Math.abs(positions[i] - positions[i - 1]);
      if (diff > 150) {
        hasJump = true;
        console.log(`JUMP detected: ${positions[i - 1]} -> ${positions[i]} (diff: ${diff})`);
      }
    }
    
    if (!hasJump) {
      console.log("SUCCESS: No jumps detected after card open/close");
    }
    
    expect(hasJump).toBe(false);
  });
});
