import { chromium } from 'playwright';

const baseURL = 'http://127.0.0.1:5000/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getNumeric = async (locator, prop) => {
  const v = await locator.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
  return Number.parseFloat(String(v).trim());
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PW_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(baseURL, { waitUntil: 'networkidle' });

  const desc = page.locator('[data-testid="text-movie-description-0-0"]');

  await page.hover('[data-testid="card-movie-0-0"]');
  await desc.waitFor({ state: 'visible' });

  await page.click('[data-testid="button-card-0-0"]', { force: true });

  for (const t of [0, 50, 120, 220, 400]) {
    await sleep(t === 0 ? 0 : t - (t === 50 ? 0 : 0));
    // just sample at approximate times
  }

  await sleep(20);
  console.log('class after click:', await desc.getAttribute('class'));

  await browser.close();
})();
