import puppeteer from 'puppeteer';

export async function generateChartScreenshot(symbol: string, interval: string = '15'): Promise<Buffer | null> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 500 });

    // The advanced TradingView widget URL
    const tvUrl = `https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=${interval}&hidesidetoolbar=1&hide_legend=1&save_image=false&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&show_popup_button=1&popup_width=1000&popup_height=650`;

    await page.goto(tvUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait some extra time to let the chart completely render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Hide any popups or loading spinners if they exist
    await page.evaluate(() => {
      const wrappers = document.querySelectorAll('.tv-site-widget');
      if (wrappers.length) {
        // Anything floating or banners
        document.querySelectorAll('a').forEach(a => a.remove());
      }
    });

    const screenshotBuffer = await page.screenshot({ type: 'png' });
    
    await browser.close();
    
    return Buffer.from(screenshotBuffer);
  } catch (err) {
    console.error('Error generating chart screenshot:', err);
    return null;
  }
}
