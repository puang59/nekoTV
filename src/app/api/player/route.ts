import { redis } from "@/lib/redis";
import { NextResponse, type NextRequest } from "next/server";
import { getBrowser } from "@/lib/createBrowser";

export async function GET(request: NextRequest): Promise<Response> {
  const browser = await getBrowser();

  // Parse the search parameter
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
    const cachedValue = await redis.get(`streamLink:${name}`);
    if (cachedValue) {
      return NextResponse.json(
        { animeData: { StreamLink: cachedValue } },
        { status: 200 }
      );
    }

    // Create a new page for the request
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

      // Navigate to the anime page
      const animeUrl = `https://ww19.gogoanimes.fi/${encodeURIComponent(name)}`;
      await page.goto(animeUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000, // 30 seconds timeout
      });

      // @ts-ignore
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

      // Cache the iframe URL in Redis
      await redis.set(`streamLink:${name}`, iframeUrl, "EX", 60 * 60 * 24);

      return NextResponse.json(
        { animeData: { StreamLink: iframeUrl } },
        { status: 200 }
      );
    } finally {
      // Always close the page
      await page.close();
    }
  } catch (error) {
    console.error("Error during search:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
