"use client";
import Header from "@/components/ui/Header";
import { searchAnime } from "@/lib/fetchDetails";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface AnimeItem {
  link: string;
  image: string | null;
  name: string | null;
  released: string | null;
}

export default function Search({
  params,
}: {
  params: Promise<{ anime: string }>;
}) {
  const [animeName, setAnimeName] = useState("");
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const fetchAnime = async () => {
      try {
        const resolvedParams = await params;
        setAnimeName(resolvedParams.anime.replace(/-/g, " "));
        const data = await searchAnime(resolvedParams.anime);
        setAnimeList(data);
      } catch (error) {
        console.error("Error fetching anime:", error);
      } finally {
        setLoading(false);
        setInitialLoad(false); // Indicate the initial fetch is complete
      }
    };

    fetchAnime();
  }, [params]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const formattedAnimeName = animeName.replace(/\s+/g, "-");
      router.push(`/search/${formattedAnimeName}`);
    } catch (error) {
      console.error("Error fetching anime:", error);
    } finally {
      setLoading(false);
    }
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
        {!loading && !initialLoad && animeList.length === 0 ? (
          <h1 className="text-accent text-2xl">No anime found</h1>
        ) : (
          <div className="sm:px-0 md:px-4 lg:px-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 md:gap-6 gap-4">
            {animeList.map(
              (anime, index) =>
                anime.image && (
                  <div
                    key={index}
                    className="rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <a href={anime.link} className="block">
                      <img
                        src={anime.image}
                        alt={anime.name || `Anime ${index}`}
                        className="w-full h-40 sm:h-56 md:h-80 object-cover"
                      />
                      <div className="p-4 text-center">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-accent mb-2">
                          {anime.name}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-sm text-zinc-500">
                          {anime.released}
                        </p>
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
