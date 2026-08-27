/** Banner device targeting — shared by the admin screens, the API routes and
 *  the homepage carousel so the three never disagree about who sees what. */

export type BannerDeviceType = 'all' | 'desktop' | 'mobile';

export const BANNER_DEVICE_TYPES: readonly BannerDeviceType[] = ['all', 'desktop', 'mobile'];

/** Viewport width at which the site switches to the desktop layout. Kept in
 *  step with `useIsMobile` and Tailwind's `md` breakpoint. */
export const MOBILE_BREAKPOINT = 768;

/** Crop shape the admin uploader enforces per device. Mobile banners are
 *  portrait 9:16 so they fill a phone screen edge to edge. */
export const BANNER_ASPECT: Record<BannerDeviceType, number> = {
    all: 21 / 9,
    desktop: 21 / 9,
    mobile: 9 / 16,
};

export const BANNER_DEVICE_LABEL: Record<BannerDeviceType, string> = {
    all: 'All Devices',
    desktop: 'Desktop',
    mobile: 'Mobile',
};

export function isBannerDeviceType(value: unknown): value is BannerDeviceType {
    return BANNER_DEVICE_TYPES.includes(value as BannerDeviceType);
}

/** Rows saved before device targeting existed have no value; they belong to
 *  the 'all' group and stay visible everywhere. */
export function normalizeDeviceType(value: unknown): BannerDeviceType {
    return isBannerDeviceType(value) ? value : 'all';
}

type DeviceScoped = { device_type?: string | null };

/** Banners a given viewport should render: the ones targeted at it, plus the
 *  untargeted ones. */
export function bannersForDevice<T extends DeviceScoped>(
    banners: T[],
    device: 'desktop' | 'mobile',
): T[] {
    return banners.filter((banner) => {
        const target = normalizeDeviceType(banner.device_type);
        return target === 'all' || target === device;
    });
}
