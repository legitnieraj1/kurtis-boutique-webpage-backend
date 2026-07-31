// Craft / brand-story section — Taneira-style 2-column. Server component.
// Image is a placeholder (public/craftsmanship.jpg); swap for a higher-res
// lifestyle shot when the client supplies one.
import Link from "next/link";
import Image from "next/image";

export function BrandStory() {
  return (
    <section className="w-full bg-surface-soft" aria-label="Our craft">
      <div className="grid md:grid-cols-2 items-stretch">
        {/* Image */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[520px]">
          <Image
            src="/craftsmanship.jpg"
            alt="Handpicked Narayanpet cotton, woven by artisan hands"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={80}
            className="object-cover"
          />
        </div>

        {/* Copy */}
        <div className="flex items-center">
          <div className="max-w-lg mx-auto md:mx-0 px-6 md:px-14 py-14 md:py-20 space-y-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent-gold font-medium">
              Our Craft
            </p>
            <h2 className="font-serif text-3xl md:text-4xl leading-[1.1] text-foreground">
              Rooted in tradition,<br />worn with love.
            </h2>
            <p className="text-[15px] leading-[1.85] text-muted-foreground">
              Every piece begins with handpicked Narayanpet cotton, chosen for its
              soft handloom weave and quiet festive sheen. We design in coordinated
              sets — for you, your little one, and the whole family — so your
              closest moments look as good as they feel. Prefer a bespoke fit or a
              colour of your own? Most of our combos are made to order.
            </p>
            <Link
              href="/about-us"
              className="inline-block text-sm font-medium text-primary border-b border-transparent hover:border-primary transition-colors pb-0.5"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
