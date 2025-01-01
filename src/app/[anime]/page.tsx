"use client";

import { fetchPlayer } from "@/lib/fetchDetails";
import { useEffect, useState } from "react";

interface AnimeData {
  StreamLink: string | null;
}

export default function Anime({
  params,
}: {
  params: Promise<{ anime: string }>;
}) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [animeName, setAnimeName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="bg-background text-accent min-h-screen p-4">
      <div className="text-gray-300">
        {/* Render the iframe */}
        <iframe
          src={iframeUrl}
          allowFullScreen
          frameBorder={0}
          className="w-96 h-96"
        />
      </div>
    </div>
  );
}
