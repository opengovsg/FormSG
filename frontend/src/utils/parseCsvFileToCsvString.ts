import Papa from 'papaparse'

export const parseCsvFileToCsvStringWithoutChunking = (
  file: File,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: ',',
      complete: ({ data }) => {
        const csvString = Papa.unparse(data, { delimiter: ',' })
        resolve(csvString)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}
