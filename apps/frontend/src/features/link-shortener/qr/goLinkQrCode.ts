import QRCode from 'qrcode'

export type GoLinkQrCodeFormat = 'svg' | 'png'

export const QR_IMAGE_WIDTH = 1000
export const QR_CODE_DIMENSIONS = 800
export const QR_MARGIN_VERTICAL = 85
export const QR_FONT_SIZE = 32
export const QR_LINE_HEIGHT = 1.35
export const QR_MAX_CHARS_PER_LINE = 36
/** go.gov.sg's own QR module colour, so the downloaded code matches the one go.gov.sg would hand out. */
const QR_DARK_COLOUR = '#384A51'

/** Splits a short link into caption lines of at most QR_MAX_CHARS_PER_LINE characters. */
export const splitCaptionLines = (shortLink: string): string[] => {
  const lines: string[] = []
  for (let i = 0; i < shortLink.length; i += QR_MAX_CHARS_PER_LINE) {
    lines.push(shortLink.slice(i, i + QR_MAX_CHARS_PER_LINE))
  }
  return lines.length > 0 ? lines : ['']
}

const escapeXml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Composes the branded QR image as a standalone SVG document string. */
export const buildGoLinkQrCodeSvg = async (
  shortLink: string,
): Promise<{ svg: string; width: number; height: number }> => {
  const rawSvg = await QRCode.toString(shortLink, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 0,
    color: { dark: QR_DARK_COLOUR, light: '#ffffff' },
  })

  const viewBoxMatch = rawSvg.match(/viewBox="0 0 (\d+) \1"/)
  if (!viewBoxMatch) {
    throw new Error(
      'buildGoLinkQrCodeSvg: could not find a square viewBox in the generated QR SVG',
    )
  }
  const moduleCount = Number(viewBoxMatch[1])

  const openTagEnd = rawSvg.indexOf('>')
  const closeTagStart = rawSvg.lastIndexOf('</svg>')
  if (
    openTagEnd === -1 ||
    closeTagStart === -1 ||
    closeTagStart <= openTagEnd
  ) {
    throw new Error(
      'buildGoLinkQrCodeSvg: could not extract inner markup from the generated QR SVG',
    )
  }
  const innerMarkup = rawSvg.slice(openTagEnd + 1, closeTagStart)

  const captionLines = splitCaptionLines(shortLink)
  const lineAdvance = QR_FONT_SIZE * QR_LINE_HEIGHT

  const width = QR_IMAGE_WIDTH
  // Margin above the code, margin between code and caption, margin below the caption.
  const height = Math.round(
    QR_MARGIN_VERTICAL +
      QR_CODE_DIMENSIONS +
      QR_MARGIN_VERTICAL +
      captionLines.length * lineAdvance +
      QR_MARGIN_VERTICAL,
  )

  const qrX = (width - QR_CODE_DIMENSIONS) / 2
  const qrY = QR_MARGIN_VERTICAL
  const scale = QR_CODE_DIMENSIONS / moduleCount

  const captionStartY =
    QR_MARGIN_VERTICAL + QR_CODE_DIMENSIONS + QR_MARGIN_VERTICAL

  const textElements = captionLines
    .map((line, index) => {
      const y =
        captionStartY + (index + 1) * lineAdvance - (lineAdvance - QR_FONT_SIZE)
      return `<text text-anchor="middle" x="${
        QR_IMAGE_WIDTH / 2
      }" y="${y}" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="${QR_FONT_SIZE}" fill="#2C2E34">${escapeXml(
        line,
      )}</text>`
    })
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />` +
    `<g transform="translate(${qrX}, ${qrY}) scale(${scale})">${innerMarkup}</g>` +
    textElements +
    `</svg>`

  return { svg, width, height }
}

/** Rasterises a composed SVG into a PNG blob using an offscreen canvas. */
export const rasteriseSvgToPngBlob = async (
  svg: string,
  width: number,
  height: number,
): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(
      new Error('rasteriseSvgToPngBlob: failed to get 2d canvas context'),
    )
  }

  return new Promise<Blob>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(image, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(
            new Error('rasteriseSvgToPngBlob: canvas.toBlob returned null'),
          )
          return
        }
        resolve(blob)
      }, 'image/png')
    }
    image.onerror = () => {
      reject(
        new Error(
          'rasteriseSvgToPngBlob: failed to load composed SVG into an Image',
        ),
      )
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

/** e.g. getGoLinkQrCodeFilename('go.gov.sg/my-form', 'png') === 'my-form-qr-code.png' */
export const getGoLinkQrCodeFilename = (
  shortLink: string,
  format: GoLinkQrCodeFormat,
): string => {
  const segments = shortLink.split('/')
  const slug = segments[segments.length - 1] || 'go-link'
  return `${slug}-qr-code.${format}`
}
