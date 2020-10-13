import { Request } from 'express'

interface IRequestWithId extends Request {
  // Need to extend Request interface as id is not present in native express
  id?: string
}

export const getRequestIp = (req: IRequestWithId) => {
  return req.get('cf-connecting-ip') ?? req.ip
}

export const getTrace = (req: IRequestWithId) => {
  return req.get('cf-ray') ?? req.id // trace using cloudflare cf-ray header, with x-request-id header as backup
}
