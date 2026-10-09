const SEMVER_PREFIX_REGEX = /^v?(\d+)\.(\d+)\.(\d+)/

/**
 * Extracts the major version number from a version string. Tolerates build
 * suffixes (e.g. `9.6.1-develop-abc12345`) and a leading `v`.
 * @returns the major version, or `null` if the string does not start with a
 * `major.minor.patch` prefix.
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
 * Whether two versions differ by a breaking change, i.e. their semver major
 * versions differ (in either direction). Returns `false` when either version
 * cannot be parsed.
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
