import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

export async function GET(request: NextRequest): Promise<Response> {
  const browser = await getBrowser();

  // Parse the search parameter
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!search) {
    return NextResponse.json(
      { error: "Missing 'search' query parameter." },
      { status: 400 }
    );
  }

  try {
    // Check Redis cache
    const cachedValue = await redis.get(`search:${search}`);
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

      const animeName = encodeURIComponent(search);
      await page.goto(
        `https://ww19.gogoanimes.fi/search.html?keyword=${animeName}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 30000, // 30 seconds timeout
        }
      );

      // Extract anime data
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

      // Cache the results in Redis for 24 hours
      await redis.set(
        `search:${search}`,
        JSON.stringify(animeList),
        "EX",
        60 * 60 * 24
      );

      return NextResponse.json({ animeList }, { status: 200 });
    } finally {
      // Always close the page
      await page.close();
    }
  } catch (error) {
    console.error("Error during search:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
