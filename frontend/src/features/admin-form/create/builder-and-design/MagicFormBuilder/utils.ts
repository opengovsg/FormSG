import * as pdfjs from 'pdfjs-dist/'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export const pdfBinaryToImageDataUrls = async (
  pdfData: ArrayBuffer,
): Promise<string[]> => {
  const pdfDoc = await pdfjs.getDocument({ data: pdfData }).promise
  const numPages = pdfDoc.numPages

  const images = []

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    // Increase scale for higher resolution
    const viewport = page.getViewport({ scale: 3 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    if (!context) {
      throw new Error('Failed to fetch canvas 2D context.')
    }

    // Enable text rendering optimization to retain text pixel sharpness
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.textRendering = 'optimizeLegibility'

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise

    const jpgImage = canvas.toDataURL('image/jpeg', 0.7)
    images.push({
      pageNum,
      dataUrl: jpgImage,
    })
  }

  return images.map((image) => image.dataUrl)
}
