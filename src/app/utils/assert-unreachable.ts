/**
 * Typescript type guard that asserts that all switch cases are exhaustive.
 * Use to get compile-time safety for making sure all the cases are handled.
 *
 * See:
 * https://stackoverflow.com/questions/39419170/how-do-i-check-that-a-switch-block-is-exhaustive-in-typescript
 */
export const assertUnreachable = (switchCase: never): never => {
  // eslint-disable-next-line
  throw new Error(`This should never be reached in TypeScript: "${switchCase}"`)
}
