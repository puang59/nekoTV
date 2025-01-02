import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";

// Search for anime on Gogoanime

const browser = await puppeteer.launch({
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  if (!search) {
    return NextResponse.json(
      { error: "Missing 'search' query parameter." },
      { status: 400 }
    );
  }

  const cachedValue = await redis.get(`search:${search}`);
  if (cachedValue) {
    return NextResponse.json(
      { animeList: JSON.parse(cachedValue) },
      { status: 200 }
    );
  }

  try {
    const animeName = encodeURIComponent(search);
    await page.goto(
      `https://ww19.gogoanimes.fi/search.html?keyword=${animeName}`
    );

    const animeList = await page.$$eval(".items li", (items) =>
      items.map((item) => {
        const link = item.querySelector("a[href]")?.getAttribute("href");
        let image = item.querySelector("a img[src]")?.getAttribute("src");
        if (image?.split("/")[1] === "cover") {
          image = "https://ww19.gogoanimes.fi" + image;
        }

        const name = item.querySelector("a[title]")?.getAttribute("title");
        const released = item.querySelector(".released")?.textContent?.trim();
        return {
          link: link ? link : null,
          image: image || null,
          name: name || null,
          released: released || null,
        };
      })
    );

    await redis.set(
      `search:${search}`,
      JSON.stringify(animeList),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
