import {
  decodeBase64,
  decodeUTF8,
  encodeBase64,
  encodeUTF8,
} from '../src/util/encoding'

describe('encoding', () => {
  describe('base64', () => {
    it('should round-trip binary data', () => {
      // Arrange
      const bytes = new Uint8Array(256).map((_, i) => i)

      // Act
      const actual = decodeBase64(encodeBase64(bytes))

      // Assert
      expect(actual).toEqual(bytes)
    })

    it('should produce output identical to Buffer base64 for all padding lengths', () => {
      // Arrange
      // Lengths mod 3 of 0, 1 and 2 exercise every padding variant.
      const inputs = [0, 1, 2, 3, 31, 32, 33].map((len) =>
        new Uint8Array(len).map((_, i) => (i * 7 + len) % 256)
      )

      inputs.forEach((bytes) => {
        // Act
        const encoded = encodeBase64(bytes)

        // Assert
        expect(encoded).toBe(Buffer.from(bytes).toString('base64'))
        expect(decodeBase64(encoded)).toEqual(bytes)
      })
    })

    it('should decode multi-megabyte payloads', () => {
      // Arrange
      // Regression guard for tweetnacl-util's regex-based validation, which
      // exceeded the call stack on large attachments in some JS engines.
      const bytes = new Uint8Array(10 * 1024 * 1024).map((_, i) => i % 251)
      const encoded = Buffer.from(bytes).toString('base64')

      // Act
      const actual = decodeBase64(encoded)

      // Assert
      // Buffer.equals instead of toEqual: jest deep-compares typed arrays
      // element-wise, which takes ~45s at this size.
      expect(Buffer.from(actual).equals(Buffer.from(bytes))).toBe(true)
    })

    it('should throw on invalid base64 input', () => {
      // Assert
      expect(() => decodeBase64('not@valid+base64!')).toThrow()
    })
  })

  describe('utf8', () => {
    it('should round-trip multi-byte strings', () => {
      // Arrange
      const input = 'héllo wörld — 你好 🎉'

      // Act
      const actual = encodeUTF8(decodeUTF8(input))

      // Assert
      expect(actual).toBe(input)
    })

    it('should encode strings identically to Buffer utf8', () => {
      // Arrange
      const input = 'héllo wörld — 你好 🎉'

      // Act
      const actual = decodeUTF8(input)

      // Assert
      expect(actual).toEqual(new Uint8Array(Buffer.from(input, 'utf8')))
    })
  })
})
