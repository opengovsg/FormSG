// Retrieved from: https://gist.github.com/zentala/1e6f72438796d74531803cc3833c039c
export const formatBytes = (bytes: number, precision?: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const decimalPoints = precision || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPoints)) + ' ' + sizes[i]
  )
}
