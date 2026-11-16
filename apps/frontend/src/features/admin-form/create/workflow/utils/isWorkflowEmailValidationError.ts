export const isWorkflowEmailValidationError = (error: unknown): boolean =>
  error instanceof Error &&
  /^"emails(?:\[\d+\])?" must be a valid email$/.test(error.message)
