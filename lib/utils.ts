import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | string) {
  const amount = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Sizes are stored in whatever order they were typed in the admin form, so
// every screen that lists them has to impose the order shoppers expect:
// XS → 3XL for adult labels, youngest first for the free-text baby sizes.
const SIZE_RANK: Record<string, number> = {
  XXS: 0, XS: 1, S: 2, M: 3, L: 4, XL: 5,
  XXL: 6, '2XL': 6, XXXL: 7, '3XL': 7,
  '4XL': 8, XXXXL: 8, '5XL': 9,
  'FREE SIZE': 100, FREESIZE: 100, 'ONE SIZE': 100,
}

/**
 * Sort key for a size label. Adult labels use the table above; anything else
 * (baby sizes such as "0 - 2 years" or "Above 8 years") sorts by the first
 * number in the string, with "above N" placed just after N.
 */
function sizeRank(label: string): number {
  const clean = label.trim().toUpperCase().replace(/\s+/g, ' ')
  const known = SIZE_RANK[clean] ?? SIZE_RANK[clean.replace(/\s/g, '')]
  if (known !== undefined) return known

  const number = clean.match(/\d+(\.\d+)?/)
  if (number) {
    const value = parseFloat(number[0])
    // "Above 8 years" belongs after "7 - 8 years", not before it.
    return 1000 + value + (/\bABOVE\b/.test(clean) ? 0.5 : 0)
  }

  return Number.MAX_SAFE_INTEGER
}

/** Compare two size labels; ties fall back to alphabetical order. */
export function compareSizes(a: string, b: string): number {
  const diff = sizeRank(a) - sizeRank(b)
  return diff !== 0 ? diff : a.localeCompare(b)
}

/** Copy of `items` ordered by their size label. */
export function sortBySize<T>(items: T[] | undefined | null, getSize: (item: T) => string): T[] {
  return [...(items || [])].sort((a, b) => compareSizes(getSize(a), getSize(b)))
}

// Product photos come back from PostgREST in whatever order the rows happen to
// be returned in — the admin's `display_order` is only respected if we sort by
// it. The product page did; the grids did not, which is why a card could show
// a different photo than the one set as the cover.
export function sortByDisplayOrder<T>(items: T[] | undefined | null): T[] {
  const order = (item: T) =>
    (item as { display_order?: number | null })?.display_order ?? 0
  return [...(items || [])].sort((a, b) => order(a) - order(b))
}
