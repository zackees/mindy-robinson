import { test, expect } from "@playwright/test";

test.describe("Carousel Performance", () => {
  test("drag performance analysis", async ({ page }) => {
    await page.goto("http://localhost:5000", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const row = page.locator('[data-testid="row-movies-0"]');
    const box = await row.boundingBox();
    if (!box) throw new Error("Row not found");

    const centerY = box.y + box.height / 2;
    const leftX = box.x + 100;
    const rightX = box.x + box.width - 100;

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    
    const startMetrics = await cdp.send('Performance.getMetrics');
    const startTime = Date.now();

    await page.mouse.move(leftX, centerY);
    await page.mouse.down();
    
    const frameTimes: number[] = [];
    let lastFrameTime = Date.now();
    
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(rightX, centerY, { steps: 15 });
      frameTimes.push(Date.now() - lastFrameTime);
      lastFrameTime = Date.now();
      
      await page.mouse.move(leftX, centerY, { steps: 15 });
      frameTimes.push(Date.now() - lastFrameTime);
      lastFrameTime = Date.now();
    }
    
    await page.mouse.up();
    
    const endMetrics = await cdp.send('Performance.getMetrics');
    const endTime = Date.now();

    console.log("=== DRAG PERFORMANCE ANALYSIS ===");
    console.log(`Total drag time: ${endTime - startTime}ms`);
    console.log(`Drag cycles: 8 back-and-forth`);
    console.log(`Avg cycle time: ${(frameTimes.reduce((a,b) => a+b, 0) / frameTimes.length).toFixed(1)}ms`);
    console.log(`Min cycle time: ${Math.min(...frameTimes)}ms`);
    console.log(`Max cycle time: ${Math.max(...frameTimes)}ms`);

    const getMetric = (metrics: any, name: string) => {
      const metric = metrics.metrics.find((m: any) => m.name === name);
      return metric ? metric.value : 0;
    };

    const layoutStart = getMetric(startMetrics, 'LayoutCount');
    const layoutEnd = getMetric(endMetrics, 'LayoutCount');
    const styleStart = getMetric(startMetrics, 'RecalcStyleCount');
    const styleEnd = getMetric(endMetrics, 'RecalcStyleCount');
    const scriptStart = getMetric(startMetrics, 'ScriptDuration');
    const scriptEnd = getMetric(endMetrics, 'ScriptDuration');
    const layoutDurStart = getMetric(startMetrics, 'LayoutDuration');
    const layoutDurEnd = getMetric(endMetrics, 'LayoutDuration');

    console.log("\n=== CHROME METRICS DURING DRAG ===");
    console.log(`Layout recalculations: ${layoutEnd - layoutStart}`);
    console.log(`Style recalculations: ${styleEnd - styleStart}`);
    console.log(`Script duration: ${((scriptEnd - scriptStart) * 1000).toFixed(1)}ms`);
    console.log(`Layout duration: ${((layoutDurEnd - layoutDurStart) * 1000).toFixed(1)}ms`);

    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    const swiperSlides = await page.evaluate(() => document.querySelectorAll('.swiper-slide').length);
    const images = await page.evaluate(() => document.querySelectorAll('img').length);

    console.log("\n=== DOM ANALYSIS ===");
    console.log(`Total DOM nodes: ${nodeCount}`);
    console.log(`Swiper slides: ${swiperSlides}`);
    console.log(`Images: ${images}`);

    const cssInfo = await page.evaluate(() => {
      const slides = document.querySelectorAll('.swiper-slide');
      const firstSlide = slides[0] as HTMLElement;
      if (!firstSlide) return null;
      const style = window.getComputedStyle(firstSlide);
      return {
        transform: style.transform,
        willChange: style.willChange,
        contain: style.contain,
        position: style.position,
      };
    });

    console.log("\n=== SLIDE CSS PROPERTIES ===");
    console.log(`Transform: ${cssInfo?.transform}`);
    console.log(`Will-change: ${cssInfo?.willChange}`);
    console.log(`Contain: ${cssInfo?.contain}`);
    console.log(`Position: ${cssInfo?.position}`);

    const wrapperInfo = await page.evaluate(() => {
      const wrapper = document.querySelector('.swiper-wrapper') as HTMLElement;
      if (!wrapper) return null;
      const style = window.getComputedStyle(wrapper);
      return {
        transform: style.transform,
        willChange: style.willChange,
        transition: style.transition,
      };
    });

    console.log("\n=== SWIPER WRAPPER CSS ===");
    console.log(`Transform: ${wrapperInfo?.transform}`);
    console.log(`Will-change: ${wrapperInfo?.willChange}`);
    console.log(`Transition: ${wrapperInfo?.transition}`);

    expect(true).toBe(true);
  });
});
