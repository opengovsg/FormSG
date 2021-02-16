// TODO (#144): move these into their respective controllers when
// those controllers are being refactored.
// A services module should not contain a controller.
import { RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  AuthType,
  ResWithHashedFields,
  ResWithUinFin,
  WithForm,
  WithJsonForm,
} from '../../../types'
import { createReqMeta } from '../../utils/request'
import { ProcessedFieldResponse } from '../submission/submission.types'

import { MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS } from './myinfo.constants'
import { MyInfoFactory } from './myinfo.factory'
import { MyInfoCookiePayload, MyInfoCookieState } from './myinfo.types'
import {
  extractMyInfoCookie,
  mapVerifyMyInfoError,
  validateMyInfoForm,
} from './myinfo.util'

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
  if (myInfoCookie.state !== MyInfoCookieState.AccessTokenRetrieved) {
    res.locals.myInfoError = true
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
    .andThen(({ data: myInfoData, uinFin }) => {
      // Increment count in cookie
      const cookiePayload: MyInfoCookiePayload = {
        ...myInfoCookie,
        usedCount: myInfoCookie.usedCount + 1,
      }
      res.cookie(MYINFO_COOKIE_NAME, cookiePayload, {
        ...MYINFO_COOKIE_OPTIONS,
      })
      return MyInfoFactory.prefillMyInfoFields(
        myInfoData,
        formJson.form_fields,
      ).asyncAndThen((prefilledFields) => {
        formJson.form_fields = prefilledFields
        ;(req as WithJsonForm<typeof req>).form = formJson
        res.locals.spcpSession = { userName: uinFin }
        return MyInfoFactory.saveMyInfoHashes(
          uinFin,
          formDocument._id,
          prefilledFields,
        )
      })
    })
    .map(() => next())
    .mapErr((error) => {
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

/**
 * Middleware for validating that submitted MyInfo field values match the values
 * originally retrieved from MyInfo.
 * @returns next if all the responses match
 * @returns 401 if res.locals.uinFin is not defined or if the submitted values do not match
 * @returns 503 if there is an error while hashing values or querying the database, or if
 * the MyInfo feature is not activated on the app
 * @returns 410 if the hashes have expired
 * @returns 500 if an unknown error occurs
 */
export const verifyMyInfoVals: RequestHandler<
  ParamsDictionary,
  unknown,
  { parsedResponses: ProcessedFieldResponse[] }
> = async (req, res, next) => {
  // TODO (#42): add proper types here when migrating away from middleware pattern
  const { authType, _id: formId } = (req as WithForm<typeof req>).form.toJSON()
  const uinFin = (res as ResWithUinFin<typeof res>).locals.uinFin
  const requestedAttributes = (req as WithForm<
    typeof req
  >).form.getUniqueMyInfoAttrs()
  if (authType !== AuthType.SP || requestedAttributes.length === 0) {
    return next()
  } else if (!uinFin) {
    return res.status(StatusCodes.UNAUTHORIZED).send({
      message: 'Please log in to SingPass and try again.',
      spcpSubmissionFailure: true,
    })
  }
  return MyInfoFactory.fetchMyInfoHashes(uinFin, formId)
    .andThen((hashes) =>
      MyInfoFactory.checkMyInfoHashes(req.body.parsedResponses, hashes),
    )
    .map((hashedFields) => {
      // eslint-disable-next-line @typescript-eslint/no-extra-semi
      ;(res as ResWithHashedFields<
        typeof res
      >).locals.hashedFields = hashedFields
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error verifying MyInfo hashes',
        meta: {
          action: 'verifyMyInfoVals',
          ...createReqMeta(req),
          formId,
        },
      })
      const { statusCode, errorMessage } = mapVerifyMyInfoError(error)
      return res.status(statusCode).send({
        message: errorMessage,
        spcpSubmissionFailure: true,
      })
    })
}
