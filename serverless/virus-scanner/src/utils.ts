export const decodeS3URI = (uri: string) => {
  return decodeURIComponent(uri).replace(/\+/g, ' ')
}
