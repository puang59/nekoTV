import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

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

export async function GET(request: NextRequest): Promise<Response> {
  const browser = await getBrowser();

  // Parse request parameters
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' query parameter." },
      { status: 400 }
    );
  }

  try {
    // Check Redis cache
    const cachedValue = await redis.get(`anime:${name}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeData: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    // Create a new page for this request
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

      // Navigate to the target page
      const animeName = encodeURIComponent(name);
      await page.goto(`https://ww19.gogoanimes.fi/category/${animeName}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000, // 30 seconds timeout
      });

      // Wait for the required selector
      await page.waitForSelector(".anime_info_body_bg img", { timeout: 15000 });

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

      // Cache the result in Redis for 24 hours
      await redis.set(
        `anime:${name}`,
        JSON.stringify(animeData),
        "EX",
        60 * 60 * 24
      );

      return NextResponse.json({ animeData }, { status: 200 });
    } finally {
      // Always close the page
      await page.close();
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
