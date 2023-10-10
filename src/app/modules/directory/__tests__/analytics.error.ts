/**
 * Error thrown only in the analytic module's testing code.
 */
export class AnalyticsTestError extends Error {
  constructor(message?: string) {
    super(message)
  }
}
