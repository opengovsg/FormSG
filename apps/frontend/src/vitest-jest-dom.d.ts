import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// jest-dom 6.5 augments Vitest's old `Assertion<T>`. Vitest 5's `Assertion`
// is `<R, T>`, and skipLibCheck drops the mismatched merge, so DOM matchers
// disappear from an `expect` imported from `vitest`.
declare module 'vitest' {
  // Empty on purpose: this merges matchers onto Vitest's interface.
  // A type alias would replace it. `T` has to stay so the signature matches.
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
  interface Assertion<
    R extends void | Promise<void> = void,
    T = unknown,
  > extends TestingLibraryMatchers<string | RegExp, R> {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
}
