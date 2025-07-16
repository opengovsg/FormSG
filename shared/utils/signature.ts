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

export const convertToSignatureDataUrl = (
  vectorArray: [number, number, number][][],
  width = 500,
  height = 200,
): string => {
  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''

    // Create a path string like "M x1 y1 L x2 y2 L x3 y3 ..."
    const d = stroke
      .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
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
         width="${width}" height="${height}"
         viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `
  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}
