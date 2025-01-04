import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

export async function GET(request: NextRequest) {
  const cacheKey = "movies";
  const scrapeURL = "https://ww19.gogoanimes.fi/anime-movies.html";

  try {
    // Check Redis cache for the movie list
    const cachedValue = await redis.get(cacheKey);
    if (cachedValue) {
      return NextResponse.json(
        { movieList: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Get a browser instance
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      // Optimize network requests by blocking unnecessary resources
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (["image", "stylesheet", "font"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to the target URL
      await page.goto(scrapeURL, {
        waitUntil: "domcontentloaded",
        timeout: 30000, // 30 seconds timeout
      });

      // Scrape anime movies
      // @ts-ignore
      const animeList = await page.$$eval(
        ".last_episodes li",
        (items: Element[]) =>
          items.map((item) => {
            const link =
              item.querySelector("a[href]")?.getAttribute("href") || null;
            let path = null;

            if (link) {
              try {
                path = new URL(link, "https://ww19.gogoanimes.fi").pathname;
              } catch (error) {
                console.warn("Invalid URL found:", link);
              }
            }

            let image =
              item.querySelector("a img[src]")?.getAttribute("src") || null;

            if (image?.startsWith("/cover")) {
              image = "https://ww19.gogoanimes.fi" + image;
            }

            const name =
              item.querySelector(".name")?.textContent?.trim() || null;
            const released =
              item.querySelector(".released")?.textContent?.trim() || null;

            return {
              link: path,
              image,
              name,
              released,
            };
          })
      );

      // Cache the result in Redis for 24 hours
      await redis.set(cacheKey, JSON.stringify(animeList), "EX", 60 * 60 * 24);

      return NextResponse.json({ animeList }, { status: 200 });
    } finally {
      // Always close the page
      await page.close();
      await browser.close(); // Ensures no lingering browser processes
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
