import { Request } from 'express'

type ReqMeta = {
  ip: ReturnType<typeof getRequestIp>
  trace: ReturnType<typeof getTrace>
  url: string
  urlWithQueryParams: string
  headers: Request['headers']
}

/**
 * Typing for a request that is loosely typed.
 * Should be used solely in `utils/request.ts` as the types are not being used
 * to generate request metas.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseRequest = Request<any, any, any, any>

export const getRequestIp = <R extends LooseRequest>(req: R): string => {
  // Define our own token for client ip
  // req.headers['cf-connecting-ip'] : Cloudflare
  // req.ip : Contains the remote IP address of the request.
  // If trust proxy setting is true, the value of this property is
  // derived from the left-most entry in the X-Forwarded-For header.
  // This header can be set by the client or by the proxy.
  // If trust proxy setting is false, the app is understood as directly
  // facing the Internet and the client’s IP address is derived from
  // req.connection.remoteAddress.
  return req.get('cf-connecting-ip') ?? req.ip
}

export const getTrace = <R extends LooseRequest>(
  req: R,
): string | undefined => {
  return req.get('cf-ray') ?? req.id // trace using cloudflare cf-ray header, with x-request-id header as backup
}

// Masks the last 24 characters of a secret with asterisks, keeping a prefix
// so log lines carrying the same secret can still be correlated.
const MASK_REPLACEMENT = '************************'

const HEADERS_RULES = {
  referer: {
    // Match the referer URL and replace the last 24 characters of the key with asterisks
    // e.g.                  /edit/<form_id>/?key=12345678901234567890123456789012345678901234567890
    // will be replaced with /edit/<form_id>/?key=12345678901234567890123456************************
    regex: /(?<=\/edit\/[a-zA-Z0-9]{24}\?key=.+).{24}$/i,
    replacement: MASK_REPLACEMENT,
  },
}

const maskRefererHeaders = (
  headers: ReqMeta['headers'],
): ReqMeta['headers'] => {
  if (typeof headers === 'string') {
    return headers
  }
  if (!headers?.referer) {
    return headers
  }
  for (const [headerKey, { regex, replacement }] of Object.entries(
    HEADERS_RULES,
  )) {
    const value = headers[headerKey]
    if (typeof value === 'string') {
      headers[headerKey] = value.replace(regex, replacement)
    }
  }
  return headers
}

/**
 * Masks the OAuth exchange code that Singpass and Corppass append when
 * redirecting a respondent back to our login callbacks, in the same way as the
 * referer key masking above. The code is a single-use credential and must not
 * be logged in full.
 *
 * Note that the Datadog sensitive data scanner only redacts `code=` inside
 * url-shaped strings, so parsed values (`req.query.code`, `meta.code`) must be
 * masked here before they are logged.
 */
export const maskOAuthCode = (code: unknown): unknown => {
  if (typeof code !== 'string') {
    return code
  }

  const maskLength = Math.min(code.length, MASK_REPLACEMENT.length)

  return (
    code.slice(0, code.length - maskLength) +
    MASK_REPLACEMENT.slice(0, maskLength)
  )
}

export const createReqMeta = <R extends LooseRequest>(req: R): ReqMeta => {
  return {
    ip: getRequestIp(req),
    trace: getTrace(req), // trace using cloudflare cf-ray header, with x-request-id header as backup
    url: req.baseUrl + req.path,
    urlWithQueryParams: req.originalUrl,
    headers: maskRefererHeaders(req.headers),
  }
}
