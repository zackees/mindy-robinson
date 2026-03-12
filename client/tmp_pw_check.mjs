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

  const card = page.locator('[data-testid="card-movie-0-0"]');
  await card.scrollIntoViewIfNeeded();
  await card.hover();

  const desc = page.locator('[data-testid="text-movie-description-0-0"]');
  await desc.waitFor({ state: 'visible' });

  console.log('class before:', await desc.getAttribute('class'));
  console.log('opacity before:', await getNumeric(desc, 'opacity'));

  await page.click('[data-testid="button-card-0-0"]');
  await sleep(20);
  console.log('class after 20ms:', await desc.getAttribute('class'));
  console.log('opacity after 20ms:', await getNumeric(desc, 'opacity'));

  await sleep(220);
  console.log('link panel visible:', await page.locator('[data-testid="panel-movie-link-0-0"]').isVisible().catch(() => false));

  await browser.close();
})();
