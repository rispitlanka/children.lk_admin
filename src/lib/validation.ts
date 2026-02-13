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
