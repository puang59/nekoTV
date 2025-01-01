import Image from "next/image";
import { useEffect, useState } from "react";

export function Banner() {
  const banners = [
    "https://w.wallhaven.cc/full/6d/wallhaven-6dxmj7.jpg",
    "https://w.wallhaven.cc/full/qz/wallhaven-qz7pz7.png",
    "https://w.wallhaven.cc/full/ex/wallhaven-exkqk8.jpg",
    "https://w.wallhaven.cc/full/1p/wallhaven-1p6qd1.png",
    "https://w.wallhaven.cc/full/7p/wallhaven-7p89go.jpg",
    "https://w.wallhaven.cc/full/vq/wallhaven-vq8re5.png",
  ];

  const [selectedBanner, setSelectedBanner] = useState("");

  useEffect(() => {
    const randomBanner = banners[Math.floor(Math.random() * banners.length)];
    setSelectedBanner(randomBanner);
  }, []);

  return (
    <div className="relative h-[400px] mb-10">
      {selectedBanner && (
        <div className="absolute inset-0">
          <Image
            src={selectedBanner}
            layout="fill"
            objectFit="cover"
            alt="banner"
            className="rounded-lg opacity-40"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-[300px]"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(15, 15, 15, 1))",
            }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl">
            <h1 className="mb-24 font-extrabold text-7xl">
              neko<span className="text-accent">TV</span>
            </h1>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl">
            <h1 className="text-xs md:text-sm italic">
              Where anime streams, not ads!
            </h1>
          </div>
        </div>
      )}
    </div>
  );
}
