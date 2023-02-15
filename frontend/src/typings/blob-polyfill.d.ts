declare module 'blob-polyfill' {
  import 'blob-polyfill'

  interface File extends Blob {
    readonly lastModified: number
    readonly name: string
    readonly webkitRelativePath: string
  }
}
