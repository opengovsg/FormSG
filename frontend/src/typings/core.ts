import { Blob } from 'blob-polyfill'
import { Opaque } from 'type-fest'

import { HttpError } from '~services/ApiService'

export type ApiError = HttpError | Error

export type JsonDate = Opaque<string, 'JsonDate'>

export interface File extends Blob {
  readonly lastModified: number
  readonly name: string
  readonly webkitRelativePath: string
}
