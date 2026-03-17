import { Either } from 'fp-ts/lib/Either'

/**
 * A function which validates a response of type T and returns an error message on left if invalid.
 * Otherwise, returns type U.
 */
export type ResponseValidator<T, U = T> = (response: T) => Either<string, U>

/**
 * A function which constructs a response validator for a specific field type.
 */
export type ResponseValidatorConstructor<T, U, V = U> = (
  formField: T,
) => ResponseValidator<U, V>
