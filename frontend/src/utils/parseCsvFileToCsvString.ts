import Papa from 'papaparse'

export const parseCsvFileToCsvString = (
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
        const csvString = Papa.unparse(contentRows, {
          newline: '\r\n',
        })
        // strip quotes to account for mixed CRLF and LF line endings.
        // strip newline/empty spaces at the end of string to account for invisible trailing newlines and empty last rows.
        const strippedCsvString = csvString.replaceAll('"', '').trim()
        if (!strippedCsvString) {
          reject(new Error('Your CSV file body cannot be empty.'))
        }
        resolve(strippedCsvString)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
