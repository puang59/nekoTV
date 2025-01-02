"use client";

import { Banner } from "@/components/ui/Banner";
import Header from "@/components/ui/Header";
import { fetchPlayer, fetchStreamList } from "@/lib/fetchDetails";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AnimeData {
  StreamLink: string | null;
}

export default function Anime({
  params,
}: {
  params: Promise<{ anime: string }>;
}) {
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [animeName, setAnimeName] = useState<string | null>(null);
  const [searchName, setSearchName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamList, setStreamList] = useState<{ Episode: string }[] | null>(
    null
  );

  const formattedAnimeName = animeName
    ?.split("-")
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.startsWith("episode")
        ? `Ep-${word.split("episode-")[1]}`
        : word
    )
    .join(" ")
    .replace(/Ep-undefined/g, "");

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
        setLoading(true);
        try {
          const data: AnimeData = await fetchPlayer(animeName);
          setIframeUrl(data.StreamLink);
          const formattedSearch = animeName.split(/-episode/)[0];
          const streamListData = await fetchStreamList(formattedSearch);
          setStreamList(streamListData.reverse());
        } catch (error) {
          console.error("Error fetching anime data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [animeName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!iframeUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No video available.
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
    <div className="relative min-h-screen bg-background">
      <Header
        animeName={searchName || ""}
        setAnimeName={setSearchName}
        handleSearch={handleSearch}
      />
      <div className="relative pt-20 px-4">
        <div className="opacity-20">
          <Banner />
        </div>
        <div className="absolute inset-x-0 top-32 px-4 md:px-8 lg:px-12">
          <h1 className="text-2xl mb-2 text-white font-bold max-w-[1200px] mx-auto">
            {formattedAnimeName}
          </h1>
          <div className="relative w-full max-w-[1200px] mx-auto aspect-video bg-black rounded-lg overflow-hidden mb-10">
            <iframe
              src={iframeUrl}
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ border: "none" }}
            />
          </div>
          {streamList && (
            <div className="my-10 max-w-[1200px] mx-auto">
              <ul className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-4 text-center text-white">
                {streamList.map((episode: { Episode: string }, index) => {
                  const isActive = animeName === episode.Episode.split("/")[1];
                  return (
                    <li key={index}>
                      <a
                        href={episode.Episode}
                        className={`py-2 px-4 rounded-md transition-colors font-semibold block text-center ${
                          isActive
                            ? "bg-accent"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      >
                        EP {index + 1}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
