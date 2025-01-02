import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";

const browser: Browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

let page: Page | null = null;

export async function GET(request: Request) {
  if (!page) {
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
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
  }

  const cachedValue = await redis.get("movies");
  if (cachedValue) {
    return NextResponse.json(
      { movieList: JSON.parse(cachedValue) },
      { status: 200 }
    );
  }

  try {
    await page.goto("https://ww19.gogoanimes.fi/anime-movies.html");
    const animeList = await page.$$eval(".last_episodes li", (items) =>
      items.map((item) => {
        const link = item.querySelector("a[href]")?.getAttribute("href");
        let image = item.querySelector("a img[src]")?.getAttribute("src");
        if (image?.split("/")[1] === "cover") {
          image = "https://ww19.gogoanimes.fi" + image;
        }
        const name = item.querySelector(".name")?.textContent?.trim();
        const released = item.querySelector(".released")?.textContent?.trim();

        return {
          link: link ? link : null,
          image: image || null,
          name: name || null,
          released: released || null,
        };
      })
    );

    await redis.set("movies", JSON.stringify(animeList), "EX", 60 * 60 * 24);
    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
