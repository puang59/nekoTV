"use client";
import { Banner } from "@/components/ui/Banner";
import Header from "@/components/ui/Header";
import { fetchRecentlyAdded } from "@/lib/fetchDetails";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface AnimeItem {
  link: string;
  image: string | null;
  name: string | null;
  episode: string | null;
}

export default function Home() {
  const router = useRouter();

  const [animeName, setAnimeName] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      fetchRecentlyAdded().then((data) => setRecentlyAdded(data));
    } catch (error) {
      console.error("Error fetching recently added anime:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    try {
      const formattedAnimeName = animeName.replace(/\s+/g, "-");
      router.push(`/search/${formattedAnimeName}`);
    } catch (error) {
      console.error("Error:", error);
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

      <main className="relative pt-20 px-4">
        <div className="relative">
          {recentlyAdded.length > 0 && <Banner />}
          <div className="absolute inset-x-0 top-[300px] px-4">
            {recentlyAdded.length > 0 && (
              <h1 className="text-white font-bold mb-5 text-2xl">
                Recently Added
              </h1>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 md:gap-6 gap-4">
              {recentlyAdded.map(
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
                          className="w-full h-40 sm:h-56 md:h-80 object-cover" // Adjust image height for mobile
                        />
                        <div className="p-4 text-center">
                          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-accent mb-2">
                            {" "}
                            {/* Adjust text size */}
                            {anime.name}
                          </h3>
                          <p className="text-xs sm:text-sm md:text-sm text-zinc-500">
                            {" "}
                            {/* Adjust text size */}
                            {anime.episode}
                          </p>
                        </div>
                      </a>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
