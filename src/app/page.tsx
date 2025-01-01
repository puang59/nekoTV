"use client";
import Header from "@/components/ui/Header";
import { fetchRecentlyAdded, searchAnime } from "@/lib/fetchDetails";
import { useState, useEffect } from "react";

interface AnimeItem {
  link: string;
  image: string | null;
  name: string | null;
  episode: string | null;
}

export default function Home() {
  const [animeName, setAnimeName] = useState("");
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<AnimeItem[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      fetchRecentlyAdded().then((data) => setRecentlyAdded(data));
    } catch (error) {
      console.error("Error fetching recently added anime:", error);
    }

    setLoading(false);
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const formattedAnimeName = animeName.replace(/\s+/g, "-");

      const data = await searchAnime(formattedAnimeName);
      setAnimeList(data);
    } catch (error) {
      console.error("Error fetching anime:", error);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen">
      <Header
        animeName={animeName}
        setAnimeName={setAnimeName}
        handleSearch={handleSearch}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-accent bg-opacity-50">
          <div className="text-accent2">Loading...</div>
        </div>
      )}

      <main className="pt-20 px-4">
        {animeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {animeList.map(
              (anime, index) =>
                anime.image && (
                  <div
                    key={index}
                    className="border border-accent rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <a href={anime.link} className="block">
                      <img
                        src={anime.image}
                        alt={anime.name || `Anime ${index}`}
                        className="w-full h-80 object-cover"
                      />
                      <div className="p-4 text-center">
                        <h3 className="text-lg font-semibold text-accent mb-2">
                          {anime.name}
                        </h3>
                        <p className="text-sm text-accent2">{anime.episode}</p>
                      </div>
                    </a>
                  </div>
                )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {recentlyAdded.map(
              (anime, index) =>
                anime.image && (
                  <div
                    key={index}
                    className="border border-accent rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <a href={anime.link} className="block">
                      <img
                        src={anime.image}
                        alt={anime.name || `Anime ${index}`}
                        className="w-full h-80 object-cover"
                      />
                      <div className="p-4 text-center">
                        <h3 className="text-lg font-semibold text-accent mb-2">
                          {anime.name}
                        </h3>
                        <p className="text-sm text-accent2">{anime.episode}</p>
                      </div>
                    </a>
                  </div>
                )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
