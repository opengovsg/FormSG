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
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    if (!context) {
      throw new Error('Failed to fetch canvas 2D context.')
    }
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise

    const jpgImage = canvas.toDataURL('image/jpeg', 0.65)
    images.push({
      pageNum,
      dataUrl: jpgImage,
    })
  }

  return images.map((image) => image.dataUrl)
}
