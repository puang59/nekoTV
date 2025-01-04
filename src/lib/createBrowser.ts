import puppeteer, { type Browser as PuppeteerBrowser } from "puppeteer";
import puppeteerCore, {
  type Browser as PuppeteerCoreBrowser,
} from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export type Browser = PuppeteerBrowser | PuppeteerCoreBrowser;

let browserInstance: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = (async () => {
      if (
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production"
      ) {
        const executablePath = await chromium.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
        );
        return puppeteerCore.launch({
          executablePath,
          args: chromium.args,
          headless: chromium.headless,
          defaultViewport: chromium.defaultViewport,
        });
      } else {
        return puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        });
      }
    })();
  }
  return browserInstance;
}
