import { test, expect } from "@playwright/test";

test.describe("Carousel Click Behavior", () => {
  test("clicking a card should not change row position", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait for carousel to be visible
    const carousel = page.locator('[data-testid="carousel-movies"]');
    await expect(carousel).toBeVisible({ timeout: 10000 });
    await carousel.scrollIntoViewIfNeeded();
    
    // Get the first row
    const firstRow = page.locator('[data-testid="row-movies-0"]');
    await expect(firstRow).toBeVisible();
    
    // Hover to pause the carousel first
    await firstRow.hover();
    await page.waitForTimeout(500);
    
    // Get the swiper wrapper to track its transform
    const swiperWrapper = firstRow.locator('.swiper-wrapper');
    await expect(swiperWrapper).toBeVisible();
    
    const getTransform = async () => {
      return await swiperWrapper.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.transform;
      });
    };
    
    // Get position before click
    const beforeClickTransform = await getTransform();
    console.log("Before click transform:", beforeClickTransform);
    
    // Find a visible card and click it
    const cards = firstRow.locator('.swiper-slide .dvd-case');
    const cardCount = await cards.count();
    console.log("Card count:", cardCount);
    
    // Click the 3rd card (should be visible) - use force to avoid scroll
    const targetCard = cards.nth(2);
    await expect(targetCard).toBeVisible();
    
    // Get bounding box and click at center to avoid triggering mouse leave
    const box = await targetCard.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    
    // Wait a moment for any transition
    await page.waitForTimeout(300);
    
    // Get position after click
    const afterClickTransform = await getTransform();
    console.log("After click transform:", afterClickTransform);
    
    // Wait longer to catch any delayed snap
    await page.waitForTimeout(1000);
    const afterDelayTransform = await getTransform();
    console.log("After 1s delay transform:", afterDelayTransform);
    
    // Wait even longer
    await page.waitForTimeout(2000);
    const afterLongerDelayTransform = await getTransform();
    console.log("After 3s total delay transform:", afterLongerDelayTransform);
    
    // Verify position didn't change at any point
    expect(beforeClickTransform).toBe(afterClickTransform);
    expect(beforeClickTransform).toBe(afterDelayTransform);
    expect(beforeClickTransform).toBe(afterLongerDelayTransform);
    
    console.log("SUCCESS: Card click did not change row position");
  });
});
