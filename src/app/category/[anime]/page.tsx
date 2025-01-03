"use client";
import { Banner } from "@/components/ui/Banner";
import Header from "@/components/ui/Header";
import { fetchAnimeDataGogo } from "@/lib/fetchDetails";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AnimeData {
  Name: string | null;
  Genres: string | null;
  Description: string | null;
  Poster: string | null;
  Type: string | null;
  Status: string | null;
  Released: string | null;
  AlternativeName: string | null;
  Episodes: string | null;
}

export default function Anime({
  params,
}: {
  params: Promise<{ anime: string }>;
}) {
  const router = useRouter();
  const [animeData, setAnimeData] = useState<AnimeData | null>(null);
  const [animeName, setAnimeName] = useState<string | null>(null);
  const [searchName, setSearchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setAnimeName(resolvedParams.anime);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (animeName) {
      const fetchData = async () => {
        try {
          const data = await fetchAnimeDataGogo(animeName);
          setAnimeData(data);
        } catch (error) {
          console.error("Error fetching anime data:", error);
        }
      };
      fetchData();
    }
  }, [animeName]);

  if (!animeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Loading...
        <div className="text-zinc-400">
          If it takes too long, please try reloading
        </div>
      </div>
    );
  }

  const handleSearch = async () => {
    setLoading(true);
    try {
      const formattedAnimeName = searchName?.replace(/\s+/g, "-");
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
        animeName={searchName || ""}
        setAnimeName={setSearchName}
        handleSearch={handleSearch}
      />
      <div className="relative pt-20 px-4">
        {animeData && (
          <div className="opacity-80">
            <Banner />
          </div>
        )}
        <div className="absolute inset-x-0 top-[400px] px-6 lg:px-20">
          {animeData && (
            <div className="text-gray-300">
              <div className="flex flex-row items-start gap-4 md:gap-10">
                <img
                  src={animeData.Poster || ""}
                  alt={`${animeData.Name} Poster`}
                  className="w-56 h-80 rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold mb-4 text-white">
                    {animeData.Name}
                  </h1>
                  <ul className="font-bold list-none p-0 text-sm">
                    <li className="py-1">
                      <span className="text-gray-400 text-xs">Type</span> <br />
                      {animeData.Type}
                    </li>
                    <li className="py-1">
                      <span className="text-gray-400 text-xs">Genres</span>{" "}
                      <br />
                      {animeData.Genres?.split(",").join(", ")}
                    </li>
                    <li className="py-1">
                      <span className="text-gray-400 text-xs">Status</span>{" "}
                      <br />
                      {animeData.Status}
                    </li>
                    <li className="py-1">
                      <span className="text-gray-400 text-xs">Released</span>{" "}
                      <br />
                      {animeData.Released}
                    </li>
                    <li className="py-1">
                      <span className="text-gray-400 text-xs">
                        Alternative Name
                      </span>{" "}
                      <br />
                      {animeData.AlternativeName}
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-gray-300">
                <span className="text-gray-400 text-xs block mb-1">
                  Description
                </span>
                {animeData.Description}
              </p>
            </div>
          )}
          {animeData.Episodes && (
            <div className="my-10">
              <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4 text-center text-white">
                {animeData.Episodes.split(",")
                  .reverse()
                  .map(
                    (episode, index) =>
                      episode !== "#" && (
                        <li key={index}>
                          <a
                            href={episode}
                            className="bg-zinc-800 py-2 px-4 rounded-md hover:bg-zinc-700 transition-colors font-semibold block text-center"
                          >
                            EP {index + 1}
                          </a>
                        </li>
                      )
                  )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
