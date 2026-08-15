// Maroon ticker above the nav. Server component — static copy, CSS-only marquee.
// Respects prefers-reduced-motion (falls back to a centered static line in globals.css).

const ITEMS = [
  "Secure Razorpay Checkout",
  "New Narayanpet Collection Live",
  "Pan India Delivery",
  "Quality Checked Before Dispatch",
];

export function AnnouncementBar() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="w-full bg-primary text-primary-foreground overflow-hidden h-9 flex items-center">
      <div
        className="flex whitespace-nowrap announcement-track"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {loop.map((text, i) => (
          <span
            key={i}
            className="inline-flex items-center text-[12px] tracking-wide font-medium"
          >
            {text}
            <span aria-hidden className="mx-5 text-accent-gold">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
