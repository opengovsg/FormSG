import Papa from 'papaparse'

export const parseCsvFile = (
  file: File,
  validateHeader?: (headerRow: string[]) => {
    isValid: boolean
    invalidReason: string
  },
): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
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
        const nonEmptyContentRows = contentRows
          .map((row) => row.map((cell) => cell.trim()))
          .filter((row) => !row.every((cell) => cell === ''))
        if (nonEmptyContentRows.length === 0) {
          reject(new Error('Your CSV file body cannot be empty.'))
        }
        resolve(nonEmptyContentRows)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
