import { Request } from 'express'
import { IncomingHttpHeaders } from 'http'

export const getRequestIp = (req: Request) => {
  return req.get('cf-connecting-ip') ?? req.ip
}

export const getTrace = (req: Request) => {
  return req.get('cf-ray') ?? req.id // trace using cloudflare cf-ray header, with x-request-id header as backup
}

export const createReqMeta = (req: Request) => {
  return {
    ip: req.get('cf-connecting-ip') ?? req.ip,
    trace: req.get('cf-ray') ?? req.id, // trace using cloudflare cf-ray header, with x-request-id header as backup
    url: req.url,
    headers: req.headers,
  }
}
