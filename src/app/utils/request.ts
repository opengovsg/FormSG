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

export const createReqMeta = <R extends LooseRequest>(req: R): ReqMeta => {
  return {
    ip: getRequestIp(req),
    trace: getTrace(req), // trace using cloudflare cf-ray header, with x-request-id header as backup
    url: req.baseUrl + req.path,
    urlWithQueryParams: req.originalUrl,
    headers: req.headers,
  }
}
