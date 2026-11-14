/** Joi rejects some addresses accepted by the client, such as reserved TLDs. */
export const isWorkflowEmailValidationError = (error: unknown): boolean =>
  error instanceof Error &&
  /^"emails(?:\[\d+\])?" must be a valid email$/.test(error.message)
