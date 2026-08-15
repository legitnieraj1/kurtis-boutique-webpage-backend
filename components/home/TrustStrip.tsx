// Trust strip below the hero. Server component — 4 static proof points, gold line icons.
import { Users, Leaf, Truck, PackageCheck } from "lucide-react";

const ITEMS = [
  { Icon: Users, label: "30,000+ Happy Customers" },
  { Icon: Leaf, label: "Premium Narayanpet Cotton" },
  { Icon: Truck, label: "Pan India Shipping" },
  { Icon: PackageCheck, label: "Quality Checked Before Dispatch" },
];

export function TrustStrip() {
  return (
    <section className="w-full bg-surface-soft" aria-label="Why shop at Kurtis Boutique">
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          {ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2.5">
              <Icon className="h-7 w-7 text-accent-gold" strokeWidth={1.5} aria-hidden />
              <span className="text-[13px] font-medium text-foreground/85 leading-tight max-w-[12rem]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
