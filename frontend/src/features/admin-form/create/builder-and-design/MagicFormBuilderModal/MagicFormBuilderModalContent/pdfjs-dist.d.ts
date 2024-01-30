declare module 'pdfjs-dist' {}
declare module 'pdfjs-dist/build/pdf.js' {
  // Declare the type for pdfjs.GlobalWorkerOptions.workerSrc as any
  const GlobalWorkerOptions: {
    workerSrc: any
  }

  export { GlobalWorkerOptions }
}
declare module 'pdfjs-dist/build/pdf.worker.entry.js' {}
