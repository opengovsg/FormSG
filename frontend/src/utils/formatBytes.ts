// Retrieved from: https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
export const formatBytes = (bytes?: number, precision?: number): string => {
  // Singular form required...
  if (bytes === 0 || bytes === 1) return `${bytes} Byte`
  if (!bytes || bytes < 0) return '-'
  const k = 1024
  const decimalPoints = precision || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPoints)) + ' ' + sizes[i]
  )
}
