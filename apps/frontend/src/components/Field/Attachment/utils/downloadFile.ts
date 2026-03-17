export const downloadFile = (value: File) => {
  const url = URL.createObjectURL(value)
  const a = document.createElement('a')
  a.href = url
  a.download = value.name
  a.click()
  URL.revokeObjectURL(url)
}
