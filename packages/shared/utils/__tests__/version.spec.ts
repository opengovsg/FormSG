import { isBreakingVersionChange, parseMajorVersion } from '../version'

describe('parseMajorVersion', () => {
  it('should parse a clean semver string', () => {
    expect(parseMajorVersion('9.6.1')).toEqual(9)
    expect(parseMajorVersion('10.0.0')).toEqual(10)
  })

  it('should parse CI-style version strings with build suffixes', () => {
    // CI builds APP_VERSION as `<package.json version>-<branch>-<short sha>`.
    expect(parseMajorVersion('9.6.1-develop-abc12345')).toEqual(9)
    expect(parseMajorVersion('10.0.0-release-al2023-deadbeef')).toEqual(10)
  })

  it('should parse versions with a leading v', () => {
    expect(parseMajorVersion('v9.6.1')).toEqual(9)
  })

  it('should tolerate surrounding whitespace', () => {
    expect(parseMajorVersion(' 9.6.1 ')).toEqual(9)
  })

  it('should return null for missing or empty versions', () => {
    expect(parseMajorVersion('')).toBeNull()
    expect(parseMajorVersion(null)).toBeNull()
    expect(parseMajorVersion(undefined)).toBeNull()
  })

  it('should return null for non-semver strings', () => {
    expect(parseMajorVersion('develop')).toBeNull()
    expect(parseMajorVersion('9.6')).toBeNull()
    expect(parseMajorVersion('abc-9.6.1')).toBeNull()
  })
})

describe('isBreakingVersionChange', () => {
  it('should return false when versions share the same major', () => {
    expect(isBreakingVersionChange('9.6.1', '9.6.1')).toEqual(false)
    expect(isBreakingVersionChange('9.6.1', '9.7.0')).toEqual(false)
    expect(isBreakingVersionChange('9.6.1', '9.6.2')).toEqual(false)
    expect(isBreakingVersionChange('9.6.1-develop-abc12345', '9.7.0')).toEqual(
      false,
    )
  })

  it('should return true when the server major is ahead of the client', () => {
    expect(isBreakingVersionChange('9.6.1', '10.0.0')).toEqual(true)
    expect(isBreakingVersionChange('9.6.1-develop-abc12345', '10.0.0')).toEqual(
      true,
    )
  })

  it('should return true when the server major is behind the client (rollback)', () => {
    expect(isBreakingVersionChange('10.0.0', '9.6.1')).toEqual(true)
  })

  it('should fail open when either version is unknown', () => {
    expect(isBreakingVersionChange('', '10.0.0')).toEqual(false)
    expect(isBreakingVersionChange(undefined, '10.0.0')).toEqual(false)
    expect(isBreakingVersionChange('9.6.1', '')).toEqual(false)
    expect(isBreakingVersionChange('9.6.1', undefined)).toEqual(false)
    expect(isBreakingVersionChange('develop', '10.0.0')).toEqual(false)
  })
})
