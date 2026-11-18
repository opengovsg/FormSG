describe('uenConfig', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('should default hiddenEntityTypes to an empty list when UEN_HIDDEN_ENTITY_TYPES is not set', () => {
    // Arrange
    delete process.env.UEN_HIDDEN_ENTITY_TYPES

    // Act
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { uenConfig } = require('../uen.config')

    // Assert
    expect(uenConfig.hiddenEntityTypes).toEqual([])
  })

  it('should parse UEN_HIDDEN_ENTITY_TYPES into trimmed, uppercased entity types', () => {
    // Arrange
    process.env.UEN_HIDDEN_ENTITY_TYPES = 'qq, RR ,,'

    // Act
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { uenConfig } = require('../uen.config')

    // Assert
    expect(uenConfig.hiddenEntityTypes).toEqual(['QQ', 'RR'])
  })
})
