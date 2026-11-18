/**
 * Progress tracing for the responses table on large forms, where the only
 * signal today is a spinner that does not say which stage it is waiting on.
 */
const PREFIX = '[responses]'

export const logProgress = (
  stage: string,
  detail: Record<string, unknown> = {},
): void => {
  // eslint-disable-next-line no-console
  console.log(`${PREFIX} ${stage}`, detail)
}

export const secondsSince = (startedAt: number): number =>
  Math.round((performance.now() - startedAt) / 100) / 10

export const perSecond = (count: number, startedAt: number): number => {
  const elapsed = (performance.now() - startedAt) / 1000
  return elapsed > 0 ? Math.round(count / elapsed) : 0
}
