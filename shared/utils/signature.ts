export const convertToSignatureStringOutput = (
  input: [number, number, number][][],
): string => {
  return JSON.stringify(input)
}

export const convertToSignatureVectorArray = (
  input: string,
): [number, number, number][][] => {
  return JSON.parse(input)
}

export const isDataUrl = (data: string): boolean => {
  return typeof data === 'string' && data.startsWith('data:image/')
}

type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const getBoundingBox = (
  vectorArray: [number, number, number][][],
): BoundingBox => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const stroke of vectorArray) {
    for (const [x, y] of stroke) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return { minX, minY, maxX, maxY }
}

export const convertToSignatureSvgBuffer = (
  vectorArray: [number, number, number][][],
  targetWidth = 500,
  targetHeight = 300,
  padding = 10,
): Buffer => {
  if (vectorArray.length === 0) return Buffer.alloc(0)

  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray) // shrink the whitespace around signature
  const boxWidth = maxX - minX || 1
  const boxHeight = maxY - minY || 1

  const scaleX = (targetWidth - 2 * padding) / boxWidth
  const scaleY = (targetHeight - 2 * padding) / boxHeight
  const scale = Math.min(scaleX, scaleY)

  const scaledWidth = boxWidth * scale + 2 * padding
  const scaledHeight = boxHeight * scale + 2 * padding

  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''
    const d = stroke
      .map(([x, y]) => {
        const normX = (x - minX) * scale + padding
        const normY = (y - minY) * scale + padding
        return `${normX.toFixed(2)} ${normY.toFixed(2)}`
      })
      .join(' L ')
    return `<path
      d="M ${d}"
      stroke="black"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />`
  })

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${scaledWidth}" height="${scaledHeight}"
         viewBox="0 0 ${scaledWidth} ${scaledHeight}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `.trim()

  // const base64 = Buffer.from(svg).toString('base64')
  // return `data:image/svg+xml;base64,${base64}`
  const base64 = Buffer.from(svg)
  return base64
}

export const getSignatureFileName = ({
  fieldId,
  timestamp,
}: {
  fieldId: string
  timestamp?: string
}): string => {
  return `Signature_Captured_${fieldId}${timestamp ? `_${timestamp}` : ''}.svg`
}

export const convertToSignatureSvgString = (
  vectorArray: [number, number, number][][],
  targetWidth = 500,
  targetHeight = 300,
  padding = 10,
): string => {
  if (vectorArray.length === 0) return ''

  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray) // shrink the whitespace around signature
  const boxWidth = maxX - minX || 1
  const boxHeight = maxY - minY || 1

  const scaleX = (targetWidth - 2 * padding) / boxWidth
  const scaleY = (targetHeight - 2 * padding) / boxHeight
  const scale = Math.min(scaleX, scaleY)

  const scaledWidth = boxWidth * scale + 2 * padding
  const scaledHeight = boxHeight * scale + 2 * padding

  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''
    const d = stroke
      .map(([x, y]) => {
        const normX = (x - minX) * scale + padding
        const normY = (y - minY) * scale + padding
        return `${normX.toFixed(2)} ${normY.toFixed(2)}`
      })
      .join(' L ')
    return `<path
      d="M ${d}"
      stroke="black"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />`
  })

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${scaledWidth}" height="${scaledHeight}"
         viewBox="0 0 ${scaledWidth} ${scaledHeight}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `.trim()

  return svg
}
