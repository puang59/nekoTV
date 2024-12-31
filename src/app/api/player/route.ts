import { NextResponse } from "next/server";
import puppeteer, { Browser, Page } from "puppeteer";

const browser: Browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

  const page: Page = await browser.newPage();

  try {
    // Block unnecessary resources
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
    console.log("Iframe URL:", iframeUrl);
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
