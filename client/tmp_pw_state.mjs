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
  await page.goto(baseURL, { waitUntil: 'networkidle' });

  await page.hover('[data-testid="card-movie-0-0"]');
  await page.click('[data-testid="button-card-0-0"]', { force: true });

  await sleep(220);

  const descText = page.locator('[data-testid="text-movie-description-0-0"]');
  const html = await descText.evaluate((el) => el.innerHTML);
  console.log('desc innerHTML:', html.slice(0, 200));

  console.log('has link panel:', await page.locator('[data-testid="panel-movie-link-0-0"]').count());

  await browser.close();
})();
