import { test, expect } from "@playwright/test";

test.describe("Carousel Visibility Check", () => {
  test("verify carousel is visible and rendering", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "domcontentloaded", timeout: 30000 });
    
    // Wait for carousel to appear
    await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: "test-results/page-top.png", fullPage: false });
    
    // Check if carousel exists in DOM
    const carousel = page.locator('[data-testid="carousel-movies"]');
    const carouselExists = await carousel.count();
    console.log(`Carousel element count: ${carouselExists}`);
    
    // Check carousel rows
    const rows = page.locator('[data-testid^="row-movies-"]');
    const rowCount = await rows.count();
    console.log(`Carousel row count: ${rowCount}`);
    
    // Check swiper slides
    const slides = page.locator('.swiper-slide');
    const slideCount = await slides.count();
    console.log(`Swiper slide count: ${slideCount}`);
    
    // Scroll to carousel section
    await carousel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/carousel-section.png", fullPage: false });
    
    // Get carousel bounding box
    const box = await carousel.boundingBox();
    console.log(`Carousel bounding box: ${JSON.stringify(box)}`);
    
    // Check for any movie cards
    const movieCards = page.locator('[data-testid^="card-movie-"]');
    const cardCount = await movieCards.count();
    console.log(`Movie card count: ${cardCount}`);
    
    // Take full page screenshot
    await page.screenshot({ path: "test-results/full-page.png", fullPage: true });
    
    // Assert expectations
    expect(carouselExists).toBeGreaterThan(0);
    expect(rowCount).toBe(5);
    expect(cardCount).toBeGreaterThan(0);
  });
});
