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

// Types for unified Browser and Page
type Browser = PuppeteerBrowser | PuppeteerCoreBrowser;
type Page = PuppeteerPage | PuppeteerCorePage;

export const dynamic = "force-dynamic";

// Initialize browser dynamically based on environment
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

export async function GET(request: NextRequest): Promise<Response> {
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
      page = newPage; // Explicit assignment
    }

    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    if (!search) {
      return NextResponse.json(
        { error: "Missing 'search' query parameter." },
        { status: 400 }
      );
    }

    // Check Redis cache
    const cachedValue = await redis.get(`search:${search}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeList: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Search for the anime
    const animeName = encodeURIComponent(search);
    await page.goto(
      `https://ww19.gogoanimes.fi/search.html?keyword=${animeName}`
    );

    // Extract anime data from the page
    // @ts-ignore
    const animeList = await page.$$eval(".items li", (items: Element[]) =>
      items.map((item) => {
        const link = item.querySelector("a[href]")?.getAttribute("href");
        let image = item.querySelector("a img[src]")?.getAttribute("src");
        if (image?.split("/")[1] === "cover") {
          image = "https://ww19.gogoanimes.fi" + image;
        }

        const name = item.querySelector("a[title]")?.getAttribute("title");
        const released = item.querySelector(".released")?.textContent?.trim();
        return {
          link: link || null,
          image: image || null,
          name: name || null,
          released: released || null,
        };
      })
    );

    // Cache the search results in Redis
    await redis.set(
      `search:${search}`,
      JSON.stringify(animeList),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error("Error during search:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
