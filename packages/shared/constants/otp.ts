/**
 * Length of all generated OTPs (login, contact verification and verifiable
 * fields). OTPs are uppercase alphanumeric; entry is case-insensitive as
 * submitted OTPs are uppercased before hash comparison.
 */
export const OTP_LENGTH = 8

/**
 * Matches a well-formed (uppercased) OTP. For case-insensitive matching of
 * raw user input, derive from `OTP_REGEX.source` with the `i` flag.
 */
export const OTP_REGEX = new RegExp(`^[A-Z0-9]{${OTP_LENGTH}}$`)
