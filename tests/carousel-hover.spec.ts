import { test, expect } from "@playwright/test";

test.describe("Carousel Hover Pause/Resume", () => {
  test("carousel pauses on hover and resumes on mouse leave", async ({ page }) => {
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
    
    // Wait a bit for autoplay to start
    await page.waitForTimeout(500);
    
    // Get initial transform position
    const getTransform = async () => {
      return await swiperWrapper.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transform;
      });
    };
    
    const initialTransform = await getTransform();
    console.log("Initial transform:", initialTransform);
    
    // Wait for movement
    await page.waitForTimeout(1000);
    const afterMovementTransform = await getTransform();
    console.log("After 1s transform:", afterMovementTransform);
    
    // Verify carousel is moving (transform should change)
    expect(initialTransform).not.toBe(afterMovementTransform);
    
    // Hover over the row
    await firstRow.hover();
    await page.waitForTimeout(200);
    
    // Get position immediately after hover
    const hoverTransform1 = await getTransform();
    console.log("After hover transform:", hoverTransform1);
    
    // Wait while hovering
    await page.waitForTimeout(1000);
    const hoverTransform2 = await getTransform();
    console.log("After 1s hover transform:", hoverTransform2);
    
    // Verify carousel is paused (transform should NOT change significantly while hovering)
    expect(hoverTransform1).toBe(hoverTransform2);
    
    // Move mouse away from the row
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    
    // Get position after mouse leave
    const afterLeaveTransform1 = await getTransform();
    console.log("After leave transform:", afterLeaveTransform1);
    
    // Wait for movement after mouse leave
    await page.waitForTimeout(1500);
    const afterLeaveTransform2 = await getTransform();
    console.log("After 1.5s leave transform:", afterLeaveTransform2);
    
    // Verify carousel resumed (transform should change after mouse leave)
    expect(afterLeaveTransform1).not.toBe(afterLeaveTransform2);
    
    console.log("SUCCESS: Carousel pauses on hover and resumes on mouse leave");
  });
});
