import { test, expect } from '@playwright/test';

test.describe('Carousel Performance Analysis', () => {
  test('analyze carousel frame rate and performance', async ({ page, browser }) => {
    // Start tracing for flame graph analysis
    await page.context().tracing.start({ 
      screenshots: true, 
      snapshots: true,
      sources: true 
    });

    // Enable performance metrics
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // Navigate to the page
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });

    // Wait for carousel to be visible
    await page.waitForSelector('[data-testid="carousel-movies"]', { timeout: 10000 });

    // Collect initial metrics
    const initialMetrics = await client.send('Performance.getMetrics');
    console.log('Initial metrics:', JSON.stringify(initialMetrics.metrics.slice(0, 10), null, 2));

    // Start collecting frame stats
    await client.send('Performance.enable');
    
    // Let the carousel auto-scroll for 5 seconds to measure performance
    console.log('Observing carousel for 5 seconds...');
    
    // Capture frame timing data
    const frameData: number[] = [];
    const startTime = Date.now();
    
    while (Date.now() - startTime < 5000) {
      const metrics = await client.send('Performance.getMetrics');
      const frames = metrics.metrics.find((m: any) => m.name === 'Frames');
      if (frames) {
        frameData.push(frames.value);
      }
      await page.waitForTimeout(100);
    }

    // Calculate FPS
    if (frameData.length > 1) {
      const totalFrames = frameData[frameData.length - 1] - frameData[0];
      const fps = totalFrames / 5;
      console.log(`Average FPS during auto-scroll: ${fps.toFixed(1)}`);
    }

    // Get final metrics
    const finalMetrics = await client.send('Performance.getMetrics');
    
    // Log key performance metrics
    const keyMetrics = ['JSHeapUsedSize', 'JSHeapTotalSize', 'LayoutCount', 'RecalcStyleCount', 'Frames'];
    console.log('\n=== Performance Metrics ===');
    for (const metric of finalMetrics.metrics) {
      if (keyMetrics.includes(metric.name)) {
        console.log(`${metric.name}: ${metric.value}`);
      }
    }

    // Test drag interaction performance
    console.log('\n=== Testing drag performance ===');
    const carousel = page.locator('[data-testid="row-movies-0"]');
    const box = await carousel.boundingBox();
    
    if (box) {
      const preInteractionMetrics = await client.send('Performance.getMetrics');
      const preLayoutCount = preInteractionMetrics.metrics.find((m: any) => m.name === 'LayoutCount')?.value || 0;
      const preStyleCount = preInteractionMetrics.metrics.find((m: any) => m.name === 'RecalcStyleCount')?.value || 0;

      // Perform drag
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + box.height / 2, { steps: 20 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);

      const postInteractionMetrics = await client.send('Performance.getMetrics');
      const postLayoutCount = postInteractionMetrics.metrics.find((m: any) => m.name === 'LayoutCount')?.value || 0;
      const postStyleCount = postInteractionMetrics.metrics.find((m: any) => m.name === 'RecalcStyleCount')?.value || 0;

      console.log(`Layouts triggered by drag: ${postLayoutCount - preLayoutCount}`);
      console.log(`Style recalculations triggered: ${postStyleCount - preStyleCount}`);
    }

    // Stop tracing and save
    await page.context().tracing.stop({ path: 'test-results/carousel-trace.zip' });
    
    console.log('\n=== Trace saved to test-results/carousel-trace.zip ===');
    console.log('View with: npx playwright show-trace test-results/carousel-trace.zip');
  });
});
