import { revalidatePath } from "next/cache";

export async function fetchRecentlyAdded() {
  if (typeof window === "undefined") {
    revalidatePath("/api/recentlyAdded");
  }
  return fetch("/api/recentlyAdded", {
    cache: "no-cache",
    next: { revalidate: 3600 },
  })
    .then((response) => response.json())
    .then((data) => data.animeList || []);
}
