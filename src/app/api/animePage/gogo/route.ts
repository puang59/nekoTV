import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";

// Get anime data from Gogoanime

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

const browser: Browser = await puppeteer.launch({
  headless: true,
});
const page: Page = await browser.newPage();

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' query parameter." },
      { status: 400 }
    );
  }

  const cachedValue = await redis.get(`anime:${name}`);
  if (cachedValue) {
    return NextResponse.json(
      { animeData: JSON.parse(cachedValue) },
      { status: 200 }
    );
  }

  try {
    const animeName = encodeURIComponent(name);

    await page.goto(`https://ww19.gogoanimes.fi/category/${animeName}`, {
      timeout: 60000,
    });

    await page.waitForSelector(".anime_info_body_bg img");

    const animeData: AnimeData = await page.evaluate((): AnimeData => {
      const result: Partial<AnimeData> = {};

      const name = document.querySelector("h1")?.textContent?.trim();
      result.Name = name || null;

      const genres = Array.from(
        document.querySelectorAll('.type a[href*="/genre/"]')
      )
        .map((item) => item.textContent?.trim())
        .join(", ");
      result.Genres = genres || null;

      const description = document
        .querySelector(".description p")
        ?.textContent?.trim();
      result.Description = description || null;

      let poster = document
        .querySelector(".anime_info_body_bg img")
        ?.getAttribute("src");
      if (poster?.split("/")[1] === "cover") {
        poster = "https://ww19.gogoanimes.fi" + poster;
      }
      result.Poster = poster || null;

      const type = document
        .querySelector('.type a[href*="/sub-category/"]')
        ?.textContent?.trim();
      result.Type = type || null;

      const status = document
        .querySelector('.type a[href*="/completed-anime"]')
        ?.textContent?.trim();
      result.Status = status || null;

      const releasedElement = Array.from(
        document.querySelectorAll(".type span")
      ).find((el) => el.textContent?.trim() === "Released:");
      const released = releasedElement?.parentElement?.textContent
        ?.replace("Released:", "")
        ?.trim();
      result.Released = released || null;

      const altName = document
        .querySelector(".type.other-name a")
        ?.textContent?.trim();
      result.AlternativeName = altName || null;

      const eps = Array.from(
        document.querySelectorAll(".anime_video_body ul li a")
      )
        .map((item) => item.getAttribute("href"))
        .filter((item) => item !== "Download")
        .join(", ");
      result.Episodes = eps || null;

      return result as AnimeData;
    });

    await redis.set(
      `anime:${name}`,
      JSON.stringify(animeData),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ animeData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
