/**
 * India-only shipping validation.
 *
 * The store ships within India only, so every address that reaches the
 * payment step must carry a real Indian PIN code and a real Indian mobile
 * number. Anything else is rejected before Razorpay is opened.
 */

/** Indian PIN codes are 6 digits and never start with 0. */
export const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/** Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9. */
export const INDIAN_MOBILE_REGEX = /^[6-9][0-9]{9}$/;

/** Keep only digits — used for input masking and for parsing pasted values. */
export function digitsOnly(raw: string): string {
    return (raw || '').replace(/\D/g, '');
}

/**
 * Reduce a phone number to its 10 national digits.
 * Accepts +91 / 91 / 0 prefixes. Returns '' when it cannot be reduced
 * to a plausible 10-digit national number.
 */
export function normalizeIndianMobile(raw: string): string {
    let digits = digitsOnly(raw);

    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(3);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

    return digits.length === 10 ? digits : '';
}

export function isValidIndianMobile(raw: string): boolean {
    return INDIAN_MOBILE_REGEX.test(normalizeIndianMobile(raw));
}

export function normalizeIndianPincode(raw: string): string {
    return digitsOnly(raw);
}

export function isValidIndianPincode(raw: string): boolean {
    return INDIAN_PINCODE_REGEX.test(normalizeIndianPincode(raw));
}

export const INVALID_MOBILE_MESSAGE =
    'Enter a valid Indian mobile number (10 digits starting with 6, 7, 8 or 9). We ship within India only.';

export const INVALID_PINCODE_MESSAGE =
    'Enter a valid 6-digit Indian PIN code. We ship within India only.';

export interface IndianAddressInput {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

export interface AddressValidationResult {
    valid: boolean;
    error?: string;
    field?: 'name' | 'phone' | 'address' | 'city' | 'state' | 'pincode';
}

/**
 * Validate a shipping or billing address for Indian delivery.
 * `label` is used to build the error message ("Shipping"/"Billing").
 */
export function validateIndianAddress(
    address: IndianAddressInput | null | undefined,
    label: 'Shipping' | 'Billing' = 'Shipping'
): AddressValidationResult {
    if (!address) {
        return { valid: false, error: `${label} address is required` };
    }

    const required: Array<[AddressValidationResult['field'], string | undefined]> = [
        ['name', address.name],
        ['phone', address.phone],
        ['address', address.address],
        ['city', address.city],
        ['state', address.state],
        ['pincode', address.pincode],
    ];

    for (const [field, value] of required) {
        if (!value || !String(value).trim()) {
            return { valid: false, error: `Please fill in all ${label.toLowerCase()} details`, field };
        }
    }

    if (!isValidIndianMobile(address.phone!)) {
        return { valid: false, error: `${label}: ${INVALID_MOBILE_MESSAGE}`, field: 'phone' };
    }

    if (!isValidIndianPincode(address.pincode!)) {
        return { valid: false, error: `${label}: ${INVALID_PINCODE_MESSAGE}`, field: 'pincode' };
    }

    return { valid: true };
}
