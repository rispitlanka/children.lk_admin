/**
 * Contact phone must start with +94 followed by exactly 9 digits.
 * Example: +94771234567
 */
const PHONE_REGEX = /^\+94\d{9}$/;

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  return PHONE_REGEX.test(phone.trim());
}

export const PHONE_VALIDATION_MESSAGE =
  "Phone must start with +94 followed by 9 digits (e.g. +94771234567)";

const SUPER_HERO_CONTACT_MAX_LEN = 64;

/**
 * Super hero contact is intentionally loose: short codes (e.g. "199"),
 * international numbers (e.g. "+94775921581"), or other common formats.
 */
export function isValidSuperHeroContact(value: unknown): boolean {
  if (value == null) return false;
  const s = typeof value === "string" ? value : String(value);
  const t = s.trim();
  return t.length >= 1 && t.length <= SUPER_HERO_CONTACT_MAX_LEN;
}

export const SUPER_HERO_CONTACT_VALIDATION_MESSAGE = `Contact must be 1–${SUPER_HERO_CONTACT_MAX_LEN} characters after trimming.`;
