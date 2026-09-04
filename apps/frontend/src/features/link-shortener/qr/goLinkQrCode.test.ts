import { describe, expect, it } from 'vitest'

import {
  buildGoLinkQrCodeSvg,
  getGoLinkQrCodeFilename,
  QR_CODE_DIMENSIONS,
  QR_FONT_SIZE,
  QR_IMAGE_WIDTH,
  QR_LINE_HEIGHT,
  QR_MARGIN_VERTICAL,
  QR_MAX_CHARS_PER_LINE,
  rasteriseSvgToPngBlob,
  splitCaptionLines,
} from './goLinkQrCode'

describe('splitCaptionLines', () => {
  it('returns a single line when the short link fits within the max chars per line', () => {
    const shortLink = 'go.gov.sg/short'
    expect(splitCaptionLines(shortLink)).toEqual([shortLink])
  })

  it('splits into exactly two lines when the short link needs it', () => {
    const shortLink = 'a'.repeat(QR_MAX_CHARS_PER_LINE + 5)
    const result = splitCaptionLines(shortLink)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('a'.repeat(QR_MAX_CHARS_PER_LINE))
    expect(result[1]).toBe('a'.repeat(5))
  })

  it('keeps a link exactly QR_MAX_CHARS_PER_LINE long on one line', () => {
    const shortLink = 'b'.repeat(QR_MAX_CHARS_PER_LINE)
    const result = splitCaptionLines(shortLink)
    expect(result).toEqual([shortLink])
  })
})

describe('buildGoLinkQrCodeSvg', () => {
  // Literal canvas sizes rather than a re-derivation of the implementation's own
  // formula, so a coordinated drift in the layout constants still fails here.
  // 85 top + 800 code + 85 gap + n * 43.2 caption + 85 bottom.
  it('sizes the canvas to 1000x1098 for a single-line caption', async () => {
    const shortLink = 'go.gov.sg/my-form'
    const { svg, width, height } = await buildGoLinkQrCodeSvg(shortLink)

    expect(splitCaptionLines(shortLink)).toHaveLength(1)
    expect(width).toBe(1000)
    expect(height).toBe(1098)
    expect(svg).toContain('viewBox="0 0 1000 1098"')
  })

  it('grows the canvas to 1000x1141 when the caption wraps to two lines', async () => {
    const shortLink = `go.gov.sg/${'a'.repeat(QR_MAX_CHARS_PER_LINE)}`
    const { width, height } = await buildGoLinkQrCodeSvg(shortLink)

    expect(splitCaptionLines(shortLink)).toHaveLength(2)
    expect(width).toBe(1000)
    expect(height).toBe(1141)
  })

  it('leaves the last caption baseline inside the canvas', async () => {
    const shortLink = `go.gov.sg/${'a'.repeat(QR_MAX_CHARS_PER_LINE)}`
    const { svg, height } = await buildGoLinkQrCodeSvg(shortLink)

    const baselines = [...svg.matchAll(/<text[^>]*\sy="([\d.]+)"/g)].map((m) =>
      Number(m[1]),
    )
    expect(baselines).toHaveLength(2)
    expect(Math.max(...baselines)).toBeLessThan(height)
  })

  it('keeps the exported layout constants consistent with those literals', () => {
    expect(QR_IMAGE_WIDTH).toBe(1000)
    expect(QR_CODE_DIMENSIONS).toBe(800)
    expect(QR_MARGIN_VERTICAL).toBe(85)
    expect(QR_FONT_SIZE).toBe(32)
    expect(QR_LINE_HEIGHT).toBe(1.35)
  })

  it('starts with <svg and ends with </svg>', async () => {
    const { svg } = await buildGoLinkQrCodeSvg('go.gov.sg/abc')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('contains the short link text', async () => {
    const shortLink = 'go.gov.sg/abc'
    const { svg } = await buildGoLinkQrCodeSvg(shortLink)
    expect(svg).toContain(shortLink)
  })

  it('contains a transform scaling the QR code', async () => {
    const { svg } = await buildGoLinkQrCodeSvg('go.gov.sg/abc')
    expect(svg).toMatch(/transform="translate\([^)]+\) scale\([^)]+\)"/)
  })

  it('contains no @import and no http URL other than the xmlns declaration', async () => {
    const { svg } = await buildGoLinkQrCodeSvg('go.gov.sg/abc')
    expect(svg).not.toContain('@import')
    const httpMatches = svg.match(/http[s]?:\/\/\S+?(?=["'])/g) ?? []
    for (const match of httpMatches) {
      expect(match.startsWith('http://www.w3.org/2000/svg')).toBe(true)
    }
  })

  it('XML-escapes a caption containing &', async () => {
    const shortLink = 'go.gov.sg/a&b'
    const { svg } = await buildGoLinkQrCodeSvg(shortLink)
    expect(svg).toContain('go.gov.sg/a&amp;b')
    expect(svg).not.toContain('go.gov.sg/a&b<')
  })
})

describe('getGoLinkQrCodeFilename', () => {
  it('builds the svg filename from the last segment', () => {
    expect(getGoLinkQrCodeFilename('go.gov.sg/my-form', 'svg')).toBe(
      'my-form-qr-code.svg',
    )
  })

  it('builds the png filename from the last segment', () => {
    expect(getGoLinkQrCodeFilename('go.gov.sg/my-form', 'png')).toBe(
      'my-form-qr-code.png',
    )
  })

  it('falls back to go-link when the last segment is empty (trailing slash)', () => {
    expect(getGoLinkQrCodeFilename('go.gov.sg/', 'png')).toBe(
      'go-link-qr-code.png',
    )
  })
})

describe('rasteriseSvgToPngBlob', () => {
  it('rejects with an Error instead of hanging, since jsdom does not implement canvas rendering', async () => {
    const { svg, width, height } = await buildGoLinkQrCodeSvg('go.gov.sg/abc')
    await expect(rasteriseSvgToPngBlob(svg, width, height)).rejects.toThrow(
      Error,
    )
  })
})
