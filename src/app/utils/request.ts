import { Request } from 'express'

export const getRequestIp = (req: Request) => {
  if (req.get) {
    return req.get('cf-connecting-ip')
  }
  return req.ip
}
