import { redis } from "@/lib/redis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const cachedValue = await redis.get(`anime:${name}`);
  if (cachedValue) {
    const data = JSON.parse(cachedValue);
    return new Response(JSON.stringify({ streamList: data.Episodes }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ streamList: [] }), {
    headers: { "Content-Type": "application/json" },
  });
}
