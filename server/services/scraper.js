const puppeteer = require('puppeteer');

async function launchBrowser(headless) {
  return puppeteer.launch({
    headless: !!headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

// Example scraper: Hacker News front page
// Returns an array of { title, url, rank }
async function scrapeHackerNews({ headless = true } = {}) {
  const browser = await launchBrowser(headless);
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  try {
    await page.goto('https://news.ycombinator.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    const items = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr.athing'));
      return rows.map((row) => {
        const rank = row.querySelector('.rank')?.textContent?.trim()?.replace(/\.$/, '') || '';
        const link = row.querySelector('a.storylink, a.titlelink');
        const title = link?.textContent?.trim() || '';
        const url = link?.getAttribute('href') || '';
        return { rank, title, url };
      });
    });

    return items;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

module.exports = { scrapeHackerNews };

