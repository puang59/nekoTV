import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import puppeteerCore, { type Browser as BrowserCore } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const dynamic = "force-dynamic";

async function createBrowser(): Promise<Browser | BrowserCore> {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
    );
    return puppeteerCore.launch({
      executablePath,
      args: chromium.args,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });
  } else {
    return puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
}

export async function GET(request: NextRequest) {
  let browser: Browser | BrowserCore | undefined;
  try {
    browser = await createBrowser();
    const page = await browser.newPage();

    const cachedValue = await redis.get("recentlyAdded");
    if (cachedValue) {
      return NextResponse.json(
        { animeList: JSON.parse(cachedValue) },
        { status: 200 }
      );
    }

    await page.goto("https://ww19.gogoanimes.fi/");
    // @ts-ignore
    const animeList = await page.$$eval(
      ".last_episodes li",
      (items: Element[]) =>
        items.map((item) => {
          const link = (item.querySelector("a[href]") as HTMLAnchorElement)
            ?.href;
          let path = "";
          if (link) {
            path = new URL(link).pathname;
          }
          let image = (item.querySelector("a img[src]") as HTMLImageElement)
            ?.src;
          if (image?.split("/")[1] === "cover") {
            image = "https://ww19.gogoanimes.fi" + image;
          }
          const name = (
            item.querySelector(".name") as HTMLElement
          )?.textContent?.trim();
          const episode = (
            item.querySelector(".episode") as HTMLElement
          )?.textContent?.trim();

          return {
            link: path || null,
            image: image || null,
            name: name || null,
            episode: episode || null,
          };
        })
    );

    await redis.set(
      "recentlyAdded",
      JSON.stringify(animeList),
      "EX",
      60 * 60 * 24
    );

    return NextResponse.json({ animeList }, { status: 200 });
  } catch (error) {
    console.error("Error during scraping:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
