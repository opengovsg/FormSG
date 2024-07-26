import Papa from 'papaparse'

export const parseCsvFileToCsvStringWithoutChunking = (
  file: File,
  validateHeader?: (headerRow: string[]) => {
    isValid: boolean
    invalidReason: string
  },
): Promise<string> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ',',
      complete: ({ data }: { data: string[][] }) => {
        const hasHeader = !!validateHeader
        const headerRow = hasHeader ? data[0] : null
        const contentRows = hasHeader ? data.slice(1) : data
        if (validateHeader && headerRow) {
          const { isValid, invalidReason } = validateHeader(headerRow)
          if (!isValid) {
            reject(new Error(invalidReason))
          }
        }
        const csvString = Papa.unparse(contentRows, { delimiter: ',' })
        resolve(csvString)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
