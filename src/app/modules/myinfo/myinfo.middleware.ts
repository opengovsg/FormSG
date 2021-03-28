// TODO (#144): move these into their respective controllers when
// those controllers are being refactored.
// A services module should not contain a controller.
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../config/logger'
import { AuthType, WithForm, WithJsonForm } from '../../../types'
import { createReqMeta } from '../../utils/request'

import { MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS } from './myinfo.constants'
import { MyInfoFactory } from './myinfo.factory'
import { MyInfoCookiePayload, MyInfoCookieState } from './myinfo.types'
import { extractMyInfoCookie, validateMyInfoForm } from './myinfo.util'

const logger = createLoggerWithLabel(module)

/**
 * Middleware for prefilling MyInfo values.
 * @returns next, always. If any error occurs, res.locals.myInfoError is set to true.
 */
export const addMyInfo: RequestHandler<ParamsDictionary> = async (
  req,
  res,
  next,
) => {
  // TODO (#42): add proper types here when migrating away from middleware pattern
  const formDocument = (req as WithForm<typeof req>).form
  const formJson = formDocument.toJSON()
  const myInfoCookieResult = extractMyInfoCookie(req.cookies)

  // No action needed if no cookie is present, this just means user is not signed in
  if (formDocument.authType !== AuthType.MyInfo || myInfoCookieResult.isErr())
    return next()
  const myInfoCookie = myInfoCookieResult.value

  // Error occurred while retrieving access token
  if (myInfoCookie.state !== MyInfoCookieState.Success) {
    res.locals.myInfoError = true
    // Important - clear the cookie so that user will not see error on refresh
    res.clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
    return next()
  }

  // Access token is already used
  if (myInfoCookie.usedCount > 0) {
    res.clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
    return next()
  }

  const requestedAttributes = (req as WithForm<
    typeof req
  >).form.getUniqueMyInfoAttrs()
  return validateMyInfoForm(formDocument)
    .asyncAndThen((form) =>
      MyInfoFactory.fetchMyInfoPersonData(
        myInfoCookie.accessToken,
        requestedAttributes,
        form.esrvcId,
      ),
    )
    .andThen((myInfoData) => {
      // Increment count in cookie
      const cookiePayload: MyInfoCookiePayload = {
        ...myInfoCookie,
        usedCount: myInfoCookie.usedCount + 1,
      }
      res.cookie(MYINFO_COOKIE_NAME, cookiePayload, MYINFO_COOKIE_OPTIONS)
      return MyInfoFactory.prefillMyInfoFields(
        myInfoData,
        formJson.form_fields,
      ).asyncAndThen((prefilledFields) => {
        formJson.form_fields = prefilledFields
        ;(req as WithJsonForm<typeof req>).form = formJson
        res.locals.spcpSession = { userName: myInfoData.getUinFin() }
        return MyInfoFactory.saveMyInfoHashes(
          myInfoData.getUinFin(),
          formDocument._id,
          prefilledFields,
        )
      })
    })
    .map(() => next())
    .mapErr((error) => {
      // No need for cookie if data could not be retrieved
      res.clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
      logger.error({
        message: error.message,
        meta: {
          action: 'addMyInfo',
          ...createReqMeta(req),
          formId: formDocument._id,
          esrvcId: formDocument.esrvcId,
          requestedAttributes,
        },
        error,
      })
      res.locals.myInfoError = true
      return next()
    })
}
