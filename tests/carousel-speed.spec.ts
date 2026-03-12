import { test, expect } from "@playwright/test";

test.describe("Carousel Speed Consistency", () => {
  test.setTimeout(90000);

  test("speed delta comparison before and after hover", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    const carousel = page.locator('[data-testid="carousel-movies"]');
    await expect(carousel).toBeVisible({ timeout: 10000 });
    await carousel.scrollIntoViewIfNeeded();
    
    const firstRow = page.locator('[data-testid="row-movies-0"]');
    await expect(firstRow).toBeVisible();
    
    // Get card 4 position (arbitrary card)
    const card4 = firstRow.locator('[data-testid="card-movie-0-4"]');
    await expect(card4).toBeVisible();
    
    const getCardPosition = async () => {
      const box = await card4.boundingBox();
      return box ? box.x : 0;
    };
    
    // Wait for carousel to stabilize
    await page.waitForTimeout(500);
    
    // BEFORE HOVER: Capture card position, wait 1 second, capture again
    const beforePos1 = await getCardPosition();
    console.log(`Before hover - Position 1: ${beforePos1.toFixed(2)}`);
    await page.waitForTimeout(1000);
    const beforePos2 = await getCardPosition();
    console.log(`Before hover - Position 2: ${beforePos2.toFixed(2)}`);
    const deltaBefore = Math.abs(beforePos2 - beforePos1);
    console.log(`Delta BEFORE hover: ${deltaBefore.toFixed(2)} px/s`);
    
    // Mouse in (hover over row)
    await firstRow.hover();
    console.log("Mouse entered row");
    
    // Wait 10 seconds while hovering
    await page.waitForTimeout(10000);
    
    // Mouse out
    await page.mouse.move(0, 0);
    console.log("Mouse left row");
    
    // Wait 1 second for autoplay to resume
    await page.waitForTimeout(1000);
    
    // AFTER HOVER: Capture card position, wait 1 second, capture again
    const afterPos1 = await getCardPosition();
    console.log(`After hover - Position 1: ${afterPos1.toFixed(2)}`);
    await page.waitForTimeout(1000);
    const afterPos2 = await getCardPosition();
    console.log(`After hover - Position 2: ${afterPos2.toFixed(2)}`);
    const deltaAfter = Math.abs(afterPos2 - afterPos1);
    console.log(`Delta AFTER hover: ${deltaAfter.toFixed(2)} px/s`);
    
    // Compare deltas
    const deltaDiff = Math.abs(deltaAfter - deltaBefore);
    const deltaDiffPercent = (deltaDiff / deltaBefore) * 100;
    console.log(`Delta difference: ${deltaDiff.toFixed(2)} px (${deltaDiffPercent.toFixed(2)}%)`);
    
    // Deltas should be almost equal (within 20% - allows for CI variance)
    expect(deltaDiffPercent).toBeLessThan(20);
    
    console.log("SUCCESS: Speed deltas are consistent before and after hover");
  });

  test("carousel maintains consistent speed after hover/leave", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait for carousel to be visible
    const carousel = page.locator('[data-testid="carousel-movies"]');
    await expect(carousel).toBeVisible({ timeout: 10000 });
    await carousel.scrollIntoViewIfNeeded();
    
    // Get the first row
    const firstRow = page.locator('[data-testid="row-movies-0"]');
    await expect(firstRow).toBeVisible();
    
    // Get the swiper wrapper to track its transform
    const swiperWrapper = firstRow.locator('.swiper-wrapper');
    await expect(swiperWrapper).toBeVisible();
    
    // Helper to extract translate X value from transform matrix
    const getTranslateX = async () => {
      const transform = await swiperWrapper.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transform;
      });
      // Parse matrix(1, 0, 0, 1, X, 0) to get X value
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      return match ? parseFloat(match[1]) : 0;
    };
    
    // Wait for carousel to start moving
    await page.waitForTimeout(500);
    
    // Measure baseline speed (before any hover)
    const baselineStart = await getTranslateX();
    await page.waitForTimeout(2000);
    const baselineEnd = await getTranslateX();
    const baselineSpeed = Math.abs(baselineEnd - baselineStart) / 2; // pixels per second
    console.log(`Baseline speed: ${baselineSpeed.toFixed(2)} px/s`);
    
    // Now hover over the row
    await firstRow.hover();
    await page.waitForTimeout(500); // Wait for pause to take effect
    
    // Leave the row
    await page.mouse.move(0, 0);
    
    // Wait for autoplay to resume (after the transition delay)
    await page.waitForTimeout(6000); // Wait for the 5s transition + buffer
    
    // Measure speed after hover/leave
    const afterHoverStart = await getTranslateX();
    await page.waitForTimeout(2000);
    const afterHoverEnd = await getTranslateX();
    const afterHoverSpeed = Math.abs(afterHoverEnd - afterHoverStart) / 2; // pixels per second
    console.log(`After hover speed: ${afterHoverSpeed.toFixed(2)} px/s`);
    
    // Calculate speed difference percentage
    const speedDiff = Math.abs(afterHoverSpeed - baselineSpeed);
    const speedDiffPercent = (speedDiff / baselineSpeed) * 100;
    console.log(`Speed difference: ${speedDiffPercent.toFixed(2)}%`);
    
    // Speed should be within 20% of baseline (allowing for measurement variance)
    expect(speedDiffPercent).toBeLessThan(20);
    
    console.log("SUCCESS: Speed is consistent after hover/leave");
  });

  test("speed comparison across multiple hover cycles", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    const carousel = page.locator('[data-testid="carousel-movies"]');
    await expect(carousel).toBeVisible({ timeout: 10000 });
    await carousel.scrollIntoViewIfNeeded();
    
    const firstRow = page.locator('[data-testid="row-movies-0"]');
    await expect(firstRow).toBeVisible();
    
    const swiperWrapper = firstRow.locator('.swiper-wrapper');
    
    const getTranslateX = async () => {
      const transform = await swiperWrapper.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transform;
      });
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      return match ? parseFloat(match[1]) : 0;
    };
    
    // Wait for carousel to start
    await page.waitForTimeout(500);
    
    // Measure baseline speed
    const baselineStart = await getTranslateX();
    await page.waitForTimeout(2000);
    const baselineEnd = await getTranslateX();
    const baselineSpeed = Math.abs(baselineEnd - baselineStart) / 2;
    console.log(`Baseline speed: ${baselineSpeed.toFixed(2)} px/s`);
    
    // Do 3 hover/leave cycles
    const speeds: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      // Hover
      await firstRow.hover();
      await page.waitForTimeout(300);
      
      // Leave
      await page.mouse.move(0, 0);
      
      // Wait for resume
      await page.waitForTimeout(6000);
      
      // Measure speed
      const start = await getTranslateX();
      await page.waitForTimeout(2000);
      const end = await getTranslateX();
      const speed = Math.abs(end - start) / 2;
      speeds.push(speed);
      console.log(`Cycle ${i + 1} speed: ${speed.toFixed(2)} px/s`);
    }
    
    // Check that all speeds are within 25% of baseline
    for (let i = 0; i < speeds.length; i++) {
      const speedDiffPercent = (Math.abs(speeds[i] - baselineSpeed) / baselineSpeed) * 100;
      console.log(`Cycle ${i + 1} diff from baseline: ${speedDiffPercent.toFixed(2)}%`);
      expect(speedDiffPercent).toBeLessThan(25);
    }
    
    console.log("SUCCESS: Speed consistent across multiple hover cycles");
  });
});
