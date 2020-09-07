import { Response } from 'express'

export type ResponseWithLocals<T> = Omit<Response, 'locals'> & { locals: T }
