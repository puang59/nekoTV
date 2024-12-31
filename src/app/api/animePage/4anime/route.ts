import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' query parameter." },
      { status: 400 }
    );
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    const animeName = encodeURIComponent(name);
    await page.goto(`https://4anime.gg/${animeName}`);

    const animeData = await page.evaluate(() => {
      let result: { [key: string]: string | null } = {};

      const name = document.querySelector("h1.anime_name")?.textContent?.trim();
      result["Name"] = name || null;

      let genres: Set<string> = new Set();
      document.querySelectorAll(".genres .link").forEach((item) => {
        const genre = item.textContent?.trim() || "";
        genres.add(genre);
      });
      result["Genres"] = Array.from(genres).join(", ");

      const description = document
        .querySelector("div.show")
        ?.textContent?.trim();
      result["Description"] = description || null;

      const poster = document
        .querySelector("img.anime_poster-img")
        ?.getAttribute("src");
      result["Poster"] = poster || null;

      document.querySelectorAll(".block-others .element").forEach((item) => {
        const title = item.querySelector(".title")?.textContent?.trim();
        const resultElement = item.querySelector(".result");
        if (title && resultElement) {
          if (title === "Studio") {
            const studioLinks = resultElement.querySelectorAll(".link");
            result[title] = Array.from(studioLinks)
              .map((link) => link.textContent?.trim())
              .filter(Boolean)
              .join(", ");
          } else {
            result[title] = resultElement.textContent?.trim() || null;
          }
        }
      });

      return result;
    });

    await browser.close();
    return NextResponse.json({ animeData }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
