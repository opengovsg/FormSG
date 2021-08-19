export const getReadableFileSize = (fileSizeInBytes: number): string => {
  const i = Math.floor(Math.log(fileSizeInBytes) / Math.log(1000))
  const size = Number((fileSizeInBytes / Math.pow(1000, i)).toFixed(2))
  return size + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}
