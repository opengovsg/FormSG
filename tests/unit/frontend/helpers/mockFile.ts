export default function ({
  name = 'file.txt',
  size = 1024,
  type = 'plain/txt',
  lastModified = Date.now(),
}: {
  name?: string
  size?: number
  type?: string
  lastModified?: number
} = {}): File {
  const blob = new Blob(['a'.repeat(size)], { type })

  return new File([blob], name, { lastModified })
}
