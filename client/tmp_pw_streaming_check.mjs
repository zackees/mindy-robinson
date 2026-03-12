import { chromium } from "playwright";
import fs from "fs";

const baseURL = "http://127.0.0.1:5000/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
  await page.goto(baseURL, { waitUntil: "networkidle" });

  await page.hover('[data-testid="card-movie-0-0"]');
  await page.click('[data-testid="button-card-0-0"]', { force: true });
  await sleep(800);

  const label = page.locator('[data-testid="text-movie-link-0-0"]');
  await label.waitFor({ state: "visible", timeout: 5000 });

  fs.mkdirSync("attached_assets", { recursive: true });
  await page.screenshot({ path: "attached_assets/pw_streaming_open_refactor.png" });

  const el = await label.elementHandle();
  if (el) await el.screenshot({ path: "attached_assets/pw_label_refactor.png" });

  const styles = await label.evaluate((n) => {
    const cs = getComputedStyle(n);
    const after = getComputedStyle(n, "::after");
    const p = n.parentElement ? getComputedStyle(n.parentElement) : null;
    const gp = n.parentElement?.parentElement ? getComputedStyle(n.parentElement.parentElement) : null;
    return {
      label: {
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        boxShadow: cs.boxShadow,
        filter: cs.filter,
        backdropFilter: cs.backdropFilter,
        textShadow: cs.textShadow,
      },
      labelAfter: {
        content: after.content,
        backgroundColor: after.backgroundColor,
        backgroundImage: after.backgroundImage,
        boxShadow: after.boxShadow,
        filter: after.filter,
        opacity: after.opacity,
      },
      parent: p
        ? {
            backgroundColor: p.backgroundColor,
            backgroundImage: p.backgroundImage,
            boxShadow: p.boxShadow,
            filter: p.filter,
            backdropFilter: p.backdropFilter,
          }
        : null,
      grandparent: gp
        ? {
            backgroundColor: gp.backgroundColor,
            backgroundImage: gp.backgroundImage,
            boxShadow: gp.boxShadow,
            filter: gp.filter,
            backdropFilter: gp.backdropFilter,
          }
        : null,
    };
  });

  console.log(JSON.stringify(styles, null, 2));
  await browser.close();
})();
