export async function fetchRecentlyAdded() {
  return fetch("/api/recentlyAdded", { cache: "force-cache" })
    .then((response) => response.json())
    .then((data) => data.animeList || []);
}
