"use client";
import Header from "@/components/ui/Header";
import { fetchRecentlyAdded } from "@/lib/fetchRecentlyAdded";
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

  useEffect(() => {
    try {
      fetchRecentlyAdded().then((data) => setRecentlyAdded(data));
    } catch (error) {
      console.error("Error fetching recently added anime:", error);
    }
  }, []);

  const handleSearch = async () => {
    try {
      const formattedAnimeName = animeName.replace(/\s+/g, "+");

      const response = await fetch(
        `/api/fetch4anime?search=${formattedAnimeName}`,
        { cache: "force-cache" }
      );
      const data = await response.json();
      setAnimeList(data.animeList || []);
    } catch (error) {
      console.error("Error fetching anime:", error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Header
        animeName={animeName}
        setAnimeName={setAnimeName}
        handleSearch={handleSearch}
      />
      <main className="pt-20 px-4">
        {animeList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {animeList.map(
              (anime, index) =>
                anime.image && (
                  <div
                    key={index}
                    className="border border-accent rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <a
                      href={anime.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={anime.image}
                        alt={anime.name || `Anime ${index}`}
                        className="w-full h-48 object-cover"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recentlyAdded.map(
              (anime, index) =>
                anime.image && (
                  <div
                    key={index}
                    className="border border-accent rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <a
                      href={anime.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={anime.image}
                        alt={anime.name || `Anime ${index}`}
                        className="w-full h-48 object-cover"
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
