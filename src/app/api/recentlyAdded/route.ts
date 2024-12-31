import { NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer";

const browser: Browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

export async function GET(request: Request) {
  const page = await browser.newPage();
  try {
    await page.goto("https://ww19.gogoanimes.fi/");
    const animeList = await page.$$eval(".last_episodes li", (items) =>
      items.map((item) => {
        const link = item.querySelector("a[href]")?.getAttribute("href");
        let image = item.querySelector("a img[src]")?.getAttribute("src");
        if (image?.split("/")[1] === "cover") {
          image = "https://ww19.gogoanimes.fi" + image;
        }
        const name = item.querySelector(".name")?.textContent?.trim();
        const episode = item.querySelector(".episode")?.textContent?.trim();
        return {
          link: link ? link : null,
          image: image || null,
          name: name || null,
          episode: episode || null,
        };
      })
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
