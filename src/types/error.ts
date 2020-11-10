export interface IMongoError {
  name?: string
  message?: string
  code?: number
  errmsg?: string
  err?: string
  errors?: {
    [subError: string]: { message: string }
  }
  [propName: string]: any
}
