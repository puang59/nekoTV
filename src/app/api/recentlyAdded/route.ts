import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

export async function GET(request: NextRequest): Promise<Response> {
  const browser = await getBrowser();

  try {
    // Check Redis cache
    const cachedValue = await redis.get("recentlyAdded");
    if (cachedValue) {
      return NextResponse.json(
        { animeList: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Create a new page for the request
    const page = await browser.newPage();
    try {
      // Optimize network requests
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (["image", "stylesheet", "font"].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to the homepage
      await page.goto("https://ww19.gogoanimes.fi/", {
        waitUntil: "domcontentloaded",
        timeout: 30000, // 30 seconds timeout
      });

      // Extract recently added anime data
      // @ts-ignore
      const animeList = await page.$$eval(
        ".last_episodes li",
        (items: Element[]) =>
          items.map((item) => {
            const link = item.querySelector("a[href]")?.getAttribute("href");
            let image = item.querySelector("a img[src]")?.getAttribute("src");
            if (image?.split("/")[1] === "cover") {
              image = "https://ww19.gogoanimes.fi" + image;
            }

            const name = item.querySelector(".name")?.textContent?.trim();
            const episode = item.querySelector(".episode")?.textContent?.trim();

            return {
              link: link || null,
              image: image || null,
              name: name || null,
              episode: episode || null,
            };
          })
      );

      // Cache the results in Redis for 24 hours
      await redis.set(
        "recentlyAdded",
        JSON.stringify(animeList),
        "EX",
        60 * 60 * 24
      );

      return NextResponse.json({ animeList }, { status: 200 });
    } catch (pageError) {
      console.error("Error during page interaction:", pageError);
      return NextResponse.json(
        { error: "Error during page interaction" },
        { status: 500 }
      );
    } finally {
      try {
        // Always attempt to close the page
        await page.close();
      } catch (closeError) {
        console.error("Error while closing the page:", closeError);
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
