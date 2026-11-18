import { redactSecretQueryParams } from '../urls'

describe('redactSecretQueryParams', () => {
  it('should redact key and token query params', () => {
    const url =
      'https://form.gov.sg/6543210fedcba9876543210f/edit/0123456789abcdef01234567?key=abc%2Bdef%3D&token=xyz'

    expect(redactSecretQueryParams(url)).toEqual(
      'https://form.gov.sg/6543210fedcba9876543210f/edit/0123456789abcdef01234567?key=REDACTED&token=REDACTED',
    )
  })

  it('should keep other query params and the fragment', () => {
    const url = 'https://form.gov.sg/abc?key=secret&lang=en#section'

    expect(redactSecretQueryParams(url)).toEqual(
      'https://form.gov.sg/abc?key=REDACTED&lang=en#section',
    )
  })

  it('should return the url unchanged when it has no secret params', () => {
    const url = 'https://form.gov.sg/abc?lang=en'

    expect(redactSecretQueryParams(url)).toBe(url)
  })

  it('should return the input unchanged when it is not an absolute url', () => {
    expect(redactSecretQueryParams('/abc?key=secret')).toBe('/abc?key=secret')
    expect(redactSecretQueryParams('')).toBe('')
  })
})
