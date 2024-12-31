import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: Request) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto(`https://4anime.gg/recently-added`);

    const animeList = await page.$$eval(".anime_list .item", (items) =>
      items.map((item) => {
        const link = item.querySelector("a[href]")?.getAttribute("href");
        const image = item.querySelector("a img[src]")?.getAttribute("src");
        const name = item
          .querySelector(".anime_detail h3 a[title]")
          ?.getAttribute("title");
        const episode = item.querySelector("a.eps")?.textContent?.trim();
        return {
          link: link ? link : null,
          image: image || null,
          name: name || null,
          episode: episode || null,
        };
      })
    );

    await browser.close();

    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
