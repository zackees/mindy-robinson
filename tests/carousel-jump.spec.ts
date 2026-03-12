import { test, expect } from "@playwright/test";

test.setTimeout(60000);

test.describe("Carousel Jump Bug", () => {
  test("carousel should not jump after hover and leave", async ({ page }) => {
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
        // Extract the X translation value
        const match = transform.match(/matrix\([^,]+,\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*([^,]+),/);
        return match ? parseFloat(match[1]) : 0;
      });
    };
    
    // Let carousel scroll for a bit
    await page.waitForTimeout(2000);
    
    // Hover to pause
    await firstRow.hover();
    await page.waitForTimeout(500);
    
    const pausedPosition = await getTransform();
    console.log("Paused position:", pausedPosition);
    
    // Stay hovered for 3 seconds
    await page.waitForTimeout(3000);
    
    const stillPausedPosition = await getTransform();
    console.log("Still paused position:", stillPausedPosition);
    expect(pausedPosition).toBe(stillPausedPosition);
    
    // Move mouse away to resume
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    
    // Track positions over 20 seconds to catch any jumps
    const positions: number[] = [];
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      const pos = await getTransform();
      positions.push(pos);
      console.log(`Position at ${i + 1}s:`, pos);
      
      // Do another hover/leave at 10 seconds
      if (i === 10) {
        console.log("Doing another hover/leave cycle...");
        await firstRow.hover();
        await page.waitForTimeout(500);
        const hoverPos = await getTransform();
        console.log("Hover position:", hoverPos);
        await page.mouse.move(0, 0);
        await page.waitForTimeout(500);
      }
    }
    
    // Check for jumps - position should change smoothly (no sudden large changes)
    let hasJump = false;
    let jumpInfo = "";
    for (let i = 1; i < positions.length; i++) {
      const diff = Math.abs(positions[i] - positions[i - 1]);
      // A jump would be a sudden large change (more than 100px in 1 second is suspicious)
      // Normal scroll at 5000ms speed = about 40-50px per second
      if (diff > 150) {
        hasJump = true;
        jumpInfo = `Jump detected at ${i}s: ${positions[i - 1]} -> ${positions[i]} (diff: ${diff})`;
        console.log(jumpInfo);
      }
    }
    
    if (hasJump) {
      console.log("FAIL: Carousel jumped unexpectedly");
      console.log("All positions:", positions);
    } else {
      console.log("SUCCESS: No jumps detected");
    }
    
    expect(hasJump).toBe(false);
  });
});
