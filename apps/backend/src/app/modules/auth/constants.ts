const MIN_SALT_ROUNDS = 10
const FALLBACK_SALT_ROUNDS = 12
const configuredSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS)

const defaultSaltRounds =
  Number.isFinite(configuredSaltRounds) && configuredSaltRounds > 0
    ? configuredSaltRounds
    : FALLBACK_SALT_ROUNDS

export const DEFAULT_SALT_ROUNDS =
  process.env.NODE_ENV === 'test'
    ? defaultSaltRounds
    : Math.max(MIN_SALT_ROUNDS, defaultSaltRounds)
