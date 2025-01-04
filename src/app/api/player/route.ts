import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

const CACHE_DURATION = 60 * 60 * 24;
const PAGE_TIMEOUT = 10000;
const MAX_RETRIES = 2;

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' query parameter." },
      { status: 400 }
    );
  }

  // Check Redis cache first
  try {
    const cachedValue = await redis.get(`streamLink:${name}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeData: { StreamLink: cachedValue } },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Redis error:", error);
    // Continue execution even if Redis fails
  }

  // Initialize browser outside of retry loop
  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    console.error("Browser initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize browser" },
      { status: 500 }
    );
  }

  // Implement retry logic
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const page = await browser.newPage();

    try {
      // Set shorter timeout
      await page.setDefaultNavigationTimeout(PAGE_TIMEOUT);
      await page.setDefaultTimeout(PAGE_TIMEOUT);

      // Optimize network requests
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (
          ["image", "stylesheet", "font", "media", "other"].includes(
            req.resourceType()
          )
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to the anime page
      const animeUrl = `https://ww19.gogoanimes.fi/${encodeURIComponent(name)}`;
      await page.goto(animeUrl, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_TIMEOUT,
      });

      // Use more specific selector and add timeout
      const iframeUrl = await Promise.race([
        // @ts-ignore
        page.evaluate(() => {
          const iframe = document.querySelector(".play-video iframe");
          return iframe ? iframe.getAttribute("src") : null;
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Selector timeout")), 5000)
        ),
      ]);

      if (!iframeUrl) {
        throw new Error("Iframe URL not found");
      }

      // Cache the successful result
      try {
        await redis.set(`streamLink:${name}`, iframeUrl, "EX", CACHE_DURATION);
      } catch (error) {
        console.error("Redis caching error:", error);
        // Continue even if caching fails
      }

      return NextResponse.json(
        { animeData: { StreamLink: iframeUrl } },
        { status: 200 }
      );
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
    } finally {
      await page.close().catch(console.error);
    }
  }

  return NextResponse.json(
    { error: "Failed to fetch stream link after retries" },
    { status: 500 }
  );
}
