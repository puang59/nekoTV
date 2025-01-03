import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import puppeteer, {
  type Browser as PuppeteerBrowser,
  type Page as PuppeteerPage,
} from "puppeteer";
import puppeteerCore, {
  type Browser as PuppeteerCoreBrowser,
  type Page as PuppeteerCorePage,
} from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const dynamic = "force-dynamic";

type Browser = PuppeteerBrowser | PuppeteerCoreBrowser;
type Page = PuppeteerPage | PuppeteerCorePage;

async function createBrowser(): Promise<Browser> {
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
}

let browser: Browser | undefined;
let page: Page | null = null;

export async function GET(request: NextRequest) {
  try {
    // Initialize the browser if not already done
    if (!browser) {
      browser = await createBrowser();
    }

    // Initialize the page if not already done
    if (!page) {
      const newPage = await browser.newPage();
      await newPage.setRequestInterception(true);
      newPage.on("request", (req) => {
        if (
          req.resourceType() === "image" ||
          req.resourceType() === "stylesheet" ||
          req.resourceType() === "font"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
      page = newPage; // Explicit assignment to avoid type mismatch
    }

    // Check Redis cache
    const cachedValue = await redis.get("movies");
    if (cachedValue) {
      return NextResponse.json(
        { movieList: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Ensure page is not null (TypeScript safety)
    if (!page) {
      throw new Error("Failed to initialize page.");
    }

    // Scrape the data
    await page.goto("https://ww19.gogoanimes.fi/anime-movies.html");
    // @ts-ignore
    const animeList = await page.$$eval(
      ".last_episodes li",
      (items: Element[]) =>
        items.map((item) => {
          const link = (item.querySelector("a[href]") as HTMLAnchorElement)
            ?.href;
          let path = "";
          if (link) {
            path = new URL(link).pathname;
          }
          let image = (item.querySelector("a img[src]") as HTMLImageElement)
            ?.src;
          if (image?.split("/")[1] === "cover") {
            image = "https://ww19.gogoanimes.fi" + image;
          }
          const name = (
            item.querySelector(".name") as HTMLElement
          )?.textContent?.trim();
          const released = (
            item.querySelector(".released") as HTMLElement
          )?.textContent?.trim();

          return {
            link: path || null,
            image: image || null,
            name: name || null,
            released: released || null,
          };
        })
    );

    // Cache the result in Redis
    await redis.set("movies", JSON.stringify(animeList), "EX", 60 * 60 * 24);
    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
