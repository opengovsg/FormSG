// // import { createCanvas } from 'canvas'

// import { getBoundingBox } from '../../../shared/utils/signature'

// export const convertToPngBuffer = (
//   vectorArray: [number, number, number][][],
//   targetWidth = 500,
//   targetHeight = 300,
//   padding = 10,
// ): Buffer => {
//   const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
//   const boxWidth = maxX - minX || 1
//   const boxHeight = maxY - minY || 1

//   const scaleX = (targetWidth - 2 * padding) / boxWidth
//   const scaleY = (targetHeight - 2 * padding) / boxHeight
//   const scale = Math.min(scaleX, scaleY)

//   const canvasWidth = boxWidth * scale + 2 * padding
//   const canvasHeight = boxHeight * scale + 2 * padding

//   const canvas = createCanvas(canvasWidth, canvasHeight)
//   const ctx = canvas.getContext('2d')

//   // White background
//   ctx.fillStyle = 'white'
//   ctx.fillRect(0, 0, canvasWidth, canvasHeight)

//   // Draw strokes
//   ctx.strokeStyle = 'black'
//   ctx.lineWidth = 2
//   ctx.lineCap = 'round'
//   ctx.lineJoin = 'round'

//   vectorArray.forEach((stroke) => {
//     if (stroke.length < 2) return
//     ctx.beginPath()
//     stroke.forEach(([x, y], i) => {
//       const normX = (x - minX) * scale + padding
//       const normY = (y - minY) * scale + padding
//       if (i === 0) {
//         ctx.moveTo(normX, normY)
//       } else {
//         ctx.lineTo(normX, normY)
//       }
//     })
//     ctx.stroke()
//   })

//   return canvas.toBuffer('image/png')
// }
