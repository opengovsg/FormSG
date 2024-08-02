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
        const hasLastRow = contentRows.length >= 1
        if (hasLastRow) {
          const lastRowCols = contentRows[contentRows.length - 1]
          const isLastRowEmpty =
            lastRowCols.length === 0 || lastRowCols.every((col) => col === '')
          // What: remove last row if empty
          // Why: On excel and text editors, the last row may be empty but cannot be seen since it is a \n character.
          // This causes admins to submit empty rows unintentionally for the last row which we will remove.
          if (isLastRowEmpty) {
            contentRows.splice(-1, 1)
          }
        }
        const csvString = Papa.unparse(contentRows, { delimiter: ',' })
        if (!csvString) {
          reject(new Error('Your CSV file body cannot be empty.'))
        }
        resolve(csvString)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
