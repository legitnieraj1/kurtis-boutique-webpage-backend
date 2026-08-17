/**
 * Baby size bands are price brackets, not measurements.
 *
 * "0 - 2 years" is one price, but a newborn and a 23-month-old are nowhere
 * near the same garment, so a band on its own does not tell the tailor what to
 * stitch. These helpers turn a band label into a short list of exact ages the
 * customer picks from, which is captured alongside the band and travels to the
 * order.
 *
 * Band labels are typed by hand in the admin ("0 - 2 years", "8 years and
 * above 8 years"), so the numbers are read out of the text rather than assumed
 * to be in any fixed format.
 */

export interface BabyAgeBand {
    /** Lower bound, in years. */
    from: number;
    /** Upper bound in years, or null when the band is open-ended ("and above"). */
    to: number | null;
}

/** Read the year range out of a free-text band label. */
export function parseBabyAgeBand(label: string): BabyAgeBand | null {
    const numbers = (label.match(/\d+/g) || []).map(Number);
    if (numbers.length === 0) return null;

    const openEnded = /above|onwards?|\+|older/i.test(label);
    const from = Math.min(...numbers);

    if (openEnded) return { from, to: null };
    if (numbers.length === 1) return { from, to: from };

    return { from, to: Math.max(...numbers) };
}

/**
 * The exact ages offered inside a band.
 *
 * A band that starts at birth is listed in months — the first two years are
 * where the difference between one end of the band and the other is largest,
 * and a parent knows their baby's age in months long before they think in
 * years. Every other band is listed year by year.
 */
export function babyAgeOptions(label: string): string[] {
    const band = parseBabyAgeBand(label);
    if (!band) return [];

    if (band.from === 0) {
        const months = ['0–3 months', '3–6 months', '6–9 months', '9–12 months', '12–18 months', '18–24 months'];
        const cap = band.to === null ? 24 : band.to * 12;
        // Keep only the buckets that fit inside the band (a "0 - 1 year" band
        // should not offer 18–24 months).
        const upperBound = (bucket: string) => Number(bucket.match(/(\d+)–(\d+)/)?.[2] ?? 0);
        return months.filter((m) => upperBound(m) <= cap);
    }

    const years: string[] = [];
    const last = band.to === null ? band.from + 4 : band.to;
    for (let year = band.from; year <= last; year++) {
        years.push(`${year} year${year === 1 ? '' : 's'}`);
    }
    if (band.to === null) years.push(`Older than ${last}`);

    return years;
}
