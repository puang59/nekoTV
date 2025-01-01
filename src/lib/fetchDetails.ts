export async function fetchAnimeDataGogo(name: string) {
  return fetch(`/api/animePage/gogo?name=${name}`)
    .then((response) => response.json())
    .then((data) => data.animeData || {});
}

export async function fetchPlayer(
  name: string
): Promise<{ StreamLink: string | null }> {
  const response = await fetch(`/api/player?name=${name}`);
  const data = await response.json();
  return data.animeData || { StreamLink: null };
}

export async function fetchRecentlyAdded() {
  return fetch("/api/recentlyAdded")
    .then((response) => response.json())
    .then((data) => data.animeList || []);
}

export async function searchAnime(name: string) {
  return fetch(`/api/fetchGogo?search=${name}`)
    .then((response) => response.json())
    .then((data) => data.animeList || {});
}
