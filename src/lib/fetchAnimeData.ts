import { revalidatePath } from "next/cache";

// export async function fetchAnimeData(name: string) {
//   if (typeof window === "undefined") {
//     revalidatePath(`/api/animePage/4anime?name=${name}`);
//   }
//   return fetch(`/api/animePage?name=${name}`, {
//     cache: "no-cache",
//     next: { revalidate: 3600 },
//   })
//     .then((response) => response.json())
//     .then((data) => data.animeData || {});
// }

export async function fetchAnimeDataGogo(name: string) {
  if (typeof window === "undefined") {
    revalidatePath(`/api/animePage/gogo?name=${name}`);
  }
  return fetch(`/api/animePage/gogo?name=${name}`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  })
    .then((response) => response.json())
    .then((data) => data.animeData || {});
}

export async function fetchPlayer(
  name: string
): Promise<{ StreamLink: string | null }> {
  const response = await fetch(`/api/player?name=${name}`, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  const data = await response.json();
  return data.animeData || { StreamLink: null };
}
