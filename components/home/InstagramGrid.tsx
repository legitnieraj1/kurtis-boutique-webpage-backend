// "As seen on Instagram" 3x2 grid. Server component.
// Tiles show real Instagram post/reel imagery; clicking a tile opens the
// matching product page (not Instagram) so the look is shoppable.
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

export type InstaTile = {
  src: string;
  href: string;   // internal product page
  isReel?: boolean;
};

export function InstagramGrid({ tiles }: { tiles: InstaTile[] }) {
  const shown = tiles.slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1.5 md:gap-2 max-w-3xl mx-auto mb-10">
      {shown.map((tile, i) => (
        <Link
          key={i}
          href={tile.href}
          className="group relative aspect-[4/5] overflow-hidden rounded-md bg-secondary/40"
          title="Shop this look"
        >
          <Image
            src={tile.src}
            alt="Kurtis Boutique look, as seen on Instagram"
            fill
            sizes="(max-width: 768px) 33vw, 260px"
            quality={72}
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          {tile.isReel && (
            <span className="absolute top-2 right-2 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-black/45 text-white">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 text-white text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Shop this look →
          </div>
        </Link>
      ))}
    </div>
  );
}
