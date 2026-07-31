// "As seen on Instagram" 3x2 grid. Server component.
// NOTE: images are currently sourced from recent product photos as a
// placeholder. Swap `images` for real UGC / an Instagram feed when available.
import Image from "next/image";
import { Instagram } from "lucide-react";

const IG_URL = "https://www.instagram.com/kurtis.boutique/";

export function InstagramGrid({ images }: { images: string[] }) {
  const tiles = images.slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1.5 md:gap-2 max-w-3xl mx-auto mb-10">
      {tiles.map((src, i) => (
        <a
          key={i}
          href={IG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square overflow-hidden rounded-md bg-secondary/40"
          title="Shop this look on Instagram"
        >
          <Image
            src={src}
            alt="Kurtis Boutique on Instagram"
            fill
            sizes="(max-width: 768px) 33vw, 220px"
            quality={70}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-white text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Instagram className="h-4 w-4" /> Shop this look
          </div>
        </a>
      ))}
    </div>
  );
}
