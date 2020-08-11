import { Request } from 'express'

export const getRequestIp = (req: Request) => {
  return req.get('cf-connecting-ip') || req.ip
}
