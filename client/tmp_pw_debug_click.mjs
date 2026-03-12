import { chromium } from 'playwright';

const baseURL = 'http://127.0.0.1:5000/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PW_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  page.on('console', (msg) => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));

  await page.goto(baseURL, { waitUntil: 'networkidle' });

  // Verify element exists
  const button = page.locator('[data-testid="button-card-0-0"]');
  console.log('button count:', await button.count());

  const card = page.locator('[data-testid="card-movie-0-0"]');
  await card.scrollIntoViewIfNeeded();

  // Make hover state explicit
  await card.hover();

  // Click via locator to ensure it's actually clicked
  await button.click({ force: true });

  await sleep(50);

  console.log('link panel count:', await page.locator('[data-testid="panel-movie-link-0-0"]').count());
  console.log('desc panel count:', await page.locator('[data-testid="panel-movie-desc-0-0"]').count());

  await browser.close();
})();
