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

export async function fetchMovies() {
  return fetch("/api/fetchMovies")
    .then((response) => response.json())
    .then((data) => data.movieList || []);
}

export async function searchAnime(name: string) {
  return fetch(`/api/fetchGogo?search=${name}`)
    .then((response) => response.json())
    .then((data) => data.animeList || []);
}

export async function fetchStreamList(animeName: string) {
  const response = await fetch(`/api/fetchStreamList?name=${animeName}`);
  const data = await response.json();

  if (data.streamList) {
    try {
      const episodes = data.streamList
        .split(",")
        .map((url: string) => url.trim())
        .filter((url: string) => url && url !== "#")
        .map((url: string) => ({ Episode: url }));
      return episodes;
    } catch (error) {
      return [];
    }
  }
  return [];
}
