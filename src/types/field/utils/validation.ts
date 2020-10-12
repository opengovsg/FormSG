import { Either } from 'fp-ts/lib/Either'

export type ResponseValidator<T> = (response: T) => Either<string, T>
