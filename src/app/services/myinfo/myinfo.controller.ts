// // TODO (#144): move these into their respective controllers.
// // A services module should not contain a controller.
// import { RequestHandler } from 'express'
// import { ParamsDictionary } from 'express-serve-static-core'

// import { IForm } from '../../../types'

// import * as MyInfoFactory from './myinfo.factory'

// type ReqWithForm<T> = T & { form: IPopululatedForm }
// export const addMyInfo: RequestHandler<ParamsDictionary, never> = async (
//   req,
//   res,
//   next,
// ) => {
//   const form = (req as ReqWithForm<typeof req>).form
// }
