import { Opaque } from 'type-fest'

import { HttpError } from '~services/ApiService'

export type ApiError = HttpError | Error

export type JsonDate = Opaque<string, 'JsonDate'>
