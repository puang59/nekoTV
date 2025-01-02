import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";

const browser: Browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing 'name' query parameter." },
      { status: 400 }
    );
  }

  const cachedValue = await redis.get(`streamLink:${name}`);
  if (cachedValue) {
    return NextResponse.json(
      { animeData: { StreamLink: cachedValue } },
      { status: 200 }
    );
  }

  const page: Page = await browser.newPage();
  try {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["document"].includes(resourceType)) {
        request.continue();
      } else {
        request.abort();
      }
    });

    await page.goto(`https://ww19.gogoanimes.fi/${encodeURIComponent(name)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const iframeUrl = await page.evaluate(() => {
      const iframe = document.querySelector(".play-video iframe");
      return iframe ? iframe.getAttribute("src") : null;
    });

    if (!iframeUrl) {
      return NextResponse.json(
        { error: "Iframe URL not found." },
        { status: 404 }
      );
    }

    await redis.set(`streamLink:${name}`, iframeUrl, "EX", 60 * 60 * 24);

    return NextResponse.json(
      { animeData: { StreamLink: iframeUrl } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch iframe URL" },
      { status: 500 }
    );
  } finally {
    await page.close();
  }
}
