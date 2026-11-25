export function requireParam(name: string): string {
  const value = __ENV[name]
  if (!value) {
    throw new Error(`Missing required --env ${name}`)
  }
  return value
}

export function optionalParam(name: string, fallback: string): string {
  return __ENV[name] || fallback
}

export function intParam(name: string, fallback: number): number {
  const raw = __ENV[name]
  if (!raw) {
    return fallback
  }
  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) {
    throw new Error(`--env ${name} must be an integer, got "${raw}"`)
  }
  return parsed
}

export function boolParam(name: string, fallback: boolean): boolean {
  const raw = __ENV[name]
  if (!raw) {
    return fallback
  }
  if (raw !== 'true' && raw !== 'false') {
    throw new Error(`--env ${name} must be "true" or "false", got "${raw}"`)
  }
  return raw === 'true'
}
