// TODO (#144): move these into their respective controllers when
// those controllers are being refactored.
// A services module should not contain a controller.
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, IPopulatedForm, SpcpSession } from '../../../types'
import { createReqMeta } from '../../utils/request'

import { MyInfoFactory } from './myinfo.factory'
import { extractRequestedAttributes } from './myinfo.util'

const logger = createLoggerWithLabel(module)

type ReqWithForm<T> = T & { form: IPopulatedForm }
type ResWithSpcpSession<T> = T & {
  locals: { spcpSession?: SpcpSession }
}

export const addMyInfo: RequestHandler<ParamsDictionary> = async (
  req,
  res,
  next,
) => {
  // TODO (#42): add proper types here when migrating away from middleware pattern
  const form = (req as ReqWithForm<typeof req>).form.toJSON()
  const uinFin = (res as ResWithSpcpSession<typeof res>).locals.spcpSession
    ?.userName
  const { esrvcId, authType, form_fields: formFields, _id: formId } = form

  // Early return if nothing needs to be done.
  const requestedAttributes = extractRequestedAttributes(formFields)
  if (!uinFin || authType !== AuthType.SP || requestedAttributes.length === 0) {
    return next()
  }

  // Step 1: Fetch the data from MyInfo server
  MyInfoFactory.fetchMyInfoPersonData({
    uinFin,
    requestedAttributes,
    singpassEserviceId: esrvcId,
  })
    // Step 2: Prefill the fields
    .andThen((myInfoData) =>
      MyInfoFactory.prefillMyInfoFields(myInfoData, formFields),
    )
    // Step 3: Hash the values and save them
    .andThen((prefilledFields) => {
      form.formFields = prefilledFields
      ;(req as ReqWithForm<typeof req>).form = form
      return MyInfoFactory.saveMyInfoHashes(uinFin, formId, prefilledFields)
    })
    .map(() => next())
    .mapErr((error) => {
      logger.error({
        message: error.message,
        meta: {
          action: 'addMyInfo',
          ...createReqMeta(req),
          formId,
          esrvcId,
        },
        error,
      })
      res.locals.myInfoError = true
      return next()
    })
}
