/**
 * Utilities for comparing the version of the loaded frontend bundle against
 * the version reported by the deployed backend.
 *
 * Deployed version strings are not always clean semver — CI builds versions
 * like `9.6.1-develop-abc12345` (package.json version + branch + short sha) —
 * so parsing only relies on the leading `major.minor.patch` prefix.
 */
const SEMVER_PREFIX_REGEX = /^v?(\d+)\.(\d+)\.(\d+)/

/**
 * Extracts the major version number from a version string.
 * @returns the major version, or `null` if the string does not start with a
 * `major.minor.patch` prefix (e.g. empty string in local dev builds).
 */
export const parseMajorVersion = (
  version: string | null | undefined,
): number | null => {
  if (!version) return null
  const match = SEMVER_PREFIX_REGEX.exec(version.trim())
  if (!match) return null
  return Number(match[1])
}

/**
 * Whether the frontend bundle and the deployed backend differ by a breaking
 * change, i.e. their semver major versions differ.
 *
 * A mismatch in either direction is breaking: refreshing always loads the
 * bundle the current backend serves, so both a backend upgrade past a major
 * boundary and a backend rollback across one are fixed by a refresh.
 *
 * Returns `false` when either version cannot be parsed (e.g. local dev where
 * the bundle version is not injected) so the check fails open — no refresh
 * prompt is ever shown on unknown versions.
 */
export const isBreakingVersionChange = (
  clientVersion: string | null | undefined,
  serverVersion: string | null | undefined,
): boolean => {
  const clientMajor = parseMajorVersion(clientVersion)
  const serverMajor = parseMajorVersion(serverVersion)
  if (clientMajor === null || serverMajor === null) return false
  return clientMajor !== serverMajor
}
