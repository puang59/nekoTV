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

// Anime data interface
interface AnimeData {
  Name: string | null;
  Genres: string | null;
  Description: string | null;
  Poster: string | null;
  Type: string | null;
  Status: string | null;
  Released: string | null;
  AlternativeName: string | null;
  Episodes: string | null;
}

type Browser = PuppeteerBrowser | PuppeteerCoreBrowser;
type Page = PuppeteerPage | PuppeteerCorePage;

export const dynamic = "force-dynamic";

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
      page = newPage; // Assign the page explicitly to avoid type mismatches
    }

    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Missing 'name' query parameter." },
        { status: 400 }
      );
    }

    // Check Redis cache
    const cachedValue = await redis.get(`anime:${name}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeData: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Navigate to the target page
    const animeName = encodeURIComponent(name);
    await page.goto(`https://ww19.gogoanimes.fi/category/${animeName}`, {
      timeout: 60000,
    });

    // Wait for the required selector
    await page.waitForSelector(".anime_info_body_bg img");

    // Scrape the anime data
    // @ts-ignore
    const animeData: AnimeData = await page.evaluate((): AnimeData => {
      const result: Partial<AnimeData> = {};

      result.Name = document.querySelector("h1")?.textContent?.trim() || null;

      result.Genres =
        Array.from(document.querySelectorAll('.type a[href*="/genre/"]'))
          .map((item) => item.textContent?.trim())
          .join(", ") || null;

      const descriptionElement = document.querySelector(".description p");
      result.Description = descriptionElement?.textContent?.trim() || null;

      if (!result.Description || result.Description.length === 0) {
        const fallbackElement = document.querySelector(".description");
        result.Description = fallbackElement?.textContent?.trim() || null;
      }

      let poster = document
        .querySelector(".anime_info_body_bg img")
        ?.getAttribute("src");
      if (poster?.split("/")[1] === "cover") {
        poster = "https://ww19.gogoanimes.fi" + poster;
      }
      result.Poster = poster || null;

      result.Type =
        document
          .querySelector('.type a[href*="/sub-category/"]')
          ?.textContent?.trim() || null;

      result.Status =
        document
          .querySelector('.type a[href*="/completed-anime"]')
          ?.textContent?.trim() || null;

      const releasedElement = Array.from(
        document.querySelectorAll(".type span")
      ).find((el) => el.textContent?.trim() === "Released:");
      result.Released =
        releasedElement?.parentElement?.textContent
          ?.replace("Released:", "")
          ?.trim() || null;

      result.AlternativeName =
        document.querySelector(".type.other-name a")?.textContent?.trim() ||
        null;

      result.Episodes =
        Array.from(document.querySelectorAll(".anime_video_body ul li a"))
          .map((item) => item.getAttribute("href"))
          .filter((item) => item !== "Download")
          .join(", ") || null;

      return result as AnimeData;
    });

    // Cache the result in Redis
    await redis.set(
      `anime:${name}`,
      JSON.stringify(animeData),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ animeData }, { status: 200 });
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
