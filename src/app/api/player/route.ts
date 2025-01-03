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

export async function GET(request: NextRequest): Promise<Response> {
  let page: Page | null = null;
  try {
    // Initialize the browser if not already done
    if (!browser) {
      browser = await createBrowser();
    }

    // Initialize the page
    page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["document"].includes(resourceType)) {
        req.continue();
      } else {
        req.abort();
      }
    });

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Missing 'name' query parameter." },
        { status: 400 }
      );
    }

    // Check Redis cache
    const cachedValue = await redis.get(`streamLink:${name}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeData: { StreamLink: cachedValue } },
        { status: 200 }
      );
    }

    // Navigate to the anime page
    await page.goto(`https://ww19.gogoanimes.fi/${encodeURIComponent(name)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Extract iframe URL
    // @ts-ignore
    const iframeUrl = await page.evaluate(() => {
      const iframe = document.querySelector(".play-video iframe");
      return iframe ? iframe.getAttribute("src") : null;
    });

    if (!iframeUrl) {
      return NextResponse.json(
        { error: "Iframe URL not found." },
        { status: 404 }
      );
    }

    // Cache the iframe URL in Redis
    await redis.set(`streamLink:${name}`, iframeUrl, "EX", 60 * 60 * 24);

    return NextResponse.json(
      { animeData: { StreamLink: iframeUrl } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch iframe URL" },
      { status: 500 }
    );
  } finally {
    if (page) {
      await page.close();
    }
  }
}
