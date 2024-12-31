import { revalidatePath } from "next/cache";

export async function searchAnime(name: string) {
  if (typeof window === "undefined") {
    revalidatePath(`/api/fetchGogo?search=${name}`);
  }
  return fetch(`/api/fetchGogo?search=${name}`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  })
    .then((response) => response.json())
    .then((data) => data.animeList || {});
}
