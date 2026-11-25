import { requireParam } from './params'

const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'host.docker.internal',
  'uat.form.gov.sg',
]

function extractHost(url: string): string {
  const withScheme = /^https?:\/\//i.exec(url)
  if (!withScheme) {
    throw new Error(
      `TARGET_URL must start with http:// or https://, got "${url}"`,
    )
  }

  let rest = url.slice(withScheme[0].length)

  const authorityEnd = rest.search(/[/?#]/)
  if (authorityEnd !== -1) {
    rest = rest.slice(0, authorityEnd)
  }

  const lastAt = rest.lastIndexOf('@')
  if (lastAt !== -1) {
    rest = rest.slice(lastAt + 1)
  }

  if (rest.startsWith('[')) {
    throw new Error(`TARGET_URL must not use an IPv6 literal, got "${url}"`)
  }

  const colon = rest.indexOf(':')
  const host = colon === -1 ? rest : rest.slice(0, colon)

  return host.toLowerCase().replace(/\.+$/, '')
}

export function resolveTargetUrl(): string {
  const raw = requireParam('TARGET_URL')
  const host = extractHost(raw)

  if (ALLOWED_HOSTS.indexOf(host) === -1) {
    throw new Error(
      `Refusing to load test "${host}". Allowed hosts are: ${ALLOWED_HOSTS.join(
        ', ',
      )}. If this is a new non-production target, add it to ALLOWED_HOSTS in src/lib/target.ts.`,
    )
  }

  return raw.replace(/\/+$/, '')
}
