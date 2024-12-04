import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  isPaymentsProducts,
} from '../../../../../shared/types'
import { IPopulatedForm } from '../../../../types'
import {
  EncryptAttachmentResponse,
  EncryptFormFieldResponse,
  EncryptFormLoadedDto,
  ParsedClearFormFieldResponse,
} from '../../../../types/api'
import { isDev } from '../../../config/config'
import { paymentConfig } from '../../../config/features/payment.config'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import { JoiPaymentProduct } from '../../form/admin-form/admin-form.payments.constants'
import * as FormService from '../../form/form.service'
import { MyInfoService } from '../../myinfo/myinfo.service'
import { extractMyInfoLoginJwt } from '../../myinfo/myinfo.util'
import * as PaymentsService from '../../payments/payments.service'
import { IPopulatedStorageFormWithResponsesAndHash } from '../email-submission/email-submission.types'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import { sharedSubmissionParams } from '../submission.constants'
import {
  DownloadCleanFileFailedError,
  MaliciousFileDetectedError,
  VirusScanFailedError,
} from '../submission.errors'
import * as SubmissionService from '../submission.service'
import {
  getEncryptedAttachmentsMapFromAttachmentsMap,
  isAttachmentResponse,
  isQuarantinedAttachmentResponse,
  mapRouteError,
} from '../submission.utils'

import {
  EncryptedPayloadExistsError,
  FormsgReqBodyExistsError,
} from './encrypt-submission.errors'
import { checkFormIsEncryptMode } from './encrypt-submission.service'
import {
  CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  CreateFormsgAndRetrieveFormMiddlewareHandlerType,
  EncryptSubmissionMiddlewareHandlerRequest,
  EncryptSubmissionMiddlewareHandlerType,
  StorageSubmissionMiddlewareHandlerRequest,
  StorageSubmissionMiddlewareHandlerType,
  ValidateSubmissionMiddlewareHandlerRequest,
} from './encrypt-submission.types'
import { formatMyInfoStorageResponseData } from './encrypt-submission.utils'
import IncomingEncryptSubmission from './IncomingEncryptSubmission.class'

const logger = createLoggerWithLabel(module)

const JoiInt = Joi.number().integer()
/**
 * Celebrate middleware for verifying shape of encrypted submission
 */
export const validateEncryptSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    responses: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().required(),
          answer: Joi.string().allow('').required(),
          fieldType: Joi.string()
            .required()
            .valid(...Object.values(BasicField)),
          signature: Joi.string().allow(''),
        }),
      )
      .required(),
    encryptedContent: Joi.string()
      .custom((value, helpers) => {
        const parts = String(value).split(/;|:/)
        if (
          parts.length !== 3 ||
          parts[0].length !== 44 || // public key
          parts[1].length !== 32 || // nonce
          !parts.every((part) => Joi.string().base64().validate(part))
        ) {
          return helpers.message({ custom: 'Invalid encryptedContent.' })
        }
        return value
      }, 'encryptedContent')
      .required(),
    attachments: Joi.object()
      .pattern(
        /^[a-fA-F0-9]{24}$/,
        Joi.object().keys({
          encryptedFile: Joi.object()
            .keys({
              binary: Joi.string().required(),
              nonce: Joi.string().required(),
              submissionPublicKey: Joi.string().required(),
            })
            .required(),
        }),
      )
      .optional(),
    paymentProducts: Joi.array().items(
      Joi.object().keys({
        data: JoiPaymentProduct.required(),
        selected: Joi.boolean(),
        quantity: JoiInt.positive().required(),
      }),
    ),
    paymentReceiptEmail: Joi.string(),
    payments: Joi.object({
      amount_cents: Joi.number()
        .integer()
        .positive()
        .min(paymentConfig.minPaymentAmountCents)
        .max(paymentConfig.maxPaymentAmountCents),
    }),
    version: Joi.number().required(),
    responseMetadata: Joi.object({
      responseTimeMs: Joi.number(),
      numVisibleFields: Joi.number(),
    }),
    /**
     * @deprecated unused key, but frontend may still send it.
     */
    isPreview: Joi.boolean(),
  }),
})

/**
 * Celebrate middleware for verifying shape of encrypted submission
 */
export const validateStorageSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    ...sharedSubmissionParams,
    paymentProducts: Joi.array().items(
      Joi.object().keys({
        data: JoiPaymentProduct.required(),
        selected: Joi.boolean(),
        quantity: JoiInt.positive().required(),
      }),
    ),
    paymentReceiptEmail: Joi.string(),
    payments: Joi.object({
      amount_cents: Joi.number()
        .integer()
        .positive()
        .max(paymentConfig.maxPaymentAmountCents),
    }),
    version: Joi.number().required(),
  }),
})

/**
 * Asynchronous virus scanning for storage submissions v2.1+. This is used for non-dev environments.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const asyncVirusScanning = (
  responses: ParsedClearFormFieldResponse[],
  formId: string,
): ResultAsync<
  ParsedClearFormFieldResponse,
  | VirusScanFailedError
  | DownloadCleanFileFailedError
  | MaliciousFileDetectedError
>[] => {
  return responses.map((response) => {
    if (isQuarantinedAttachmentResponse(response)) {
      return SubmissionService.triggerVirusScanThenDownloadCleanFileChain(
        response,
        formId,
      )
    }

    // If field is not an attachment, return original response.
    return okAsync(response)
  })
}

/**
 * Synchronous virus scanning for storage submissions v2.1+. This is used for dev environment.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const devModeSyncVirusScanning = async (
  responses: ParsedClearFormFieldResponse[],
  formId: string,
): Promise<
  Result<
    ParsedClearFormFieldResponse,
    | VirusScanFailedError
    | DownloadCleanFileFailedError
    | MaliciousFileDetectedError
  >[]
> => {
  const results: Result<
    ParsedClearFormFieldResponse,
    VirusScanFailedError | DownloadCleanFileFailedError
  >[] = []
  for (const response of responses) {
    if (isQuarantinedAttachmentResponse(response)) {
      // await to pause for...of loop until the virus scanning and downloading of clean file is completed.
      const attachmentResponse =
        await SubmissionService.triggerVirusScanThenDownloadCleanFileChain(
          response,
          formId,
        )
      results.push(attachmentResponse)
      if (attachmentResponse.isErr()) break
    } else {
      // If field is not an attachment, return original response.
      results.push(ok(response))
    }
  }
  return results
}

/**
 * Scan attachments on quarantine bucket and retrieve attachments from the clean bucket.
 */
export const scanAndRetrieveAttachments = async (
  req: StorageSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const logMeta = {
    action: 'scanAndRetrieveAttachments',
    ...createReqMeta(req),
  }

  // For each attachment, trigger lambda to scan and if it succeeds, retrieve attachment from clean bucket. Do this asynchronously.
  const scanAndRetrieveFilesResult: Result<
    ParsedClearFormFieldResponse[], // true for attachment fields, false for non-attachment fields.
    | VirusScanFailedError
    | DownloadCleanFileFailedError
    | MaliciousFileDetectedError
  > =
    // On the local development environment, there is only 1 lambda and the virus scanning service WILL CRASH if multiple lambda invocations are
    // attempted at the same time. Reference: https://www.notion.so/opengov/Encryption-Boundary-Shift-the-journey-so-far-dfc6e15fc65f45eba3dd6a9af48eebea?pvs=4#d0944ba61aad45ce988ed0474f131e59
    // As such, in dev mode, we want to run the virus scanning synchronously. In non-dev mode, as we'll be using the lambdas on AWS, we should
    // run the virus scanning asynchronously for better performance (lower latency).
    // Note on .combine: if any scans or downloads error out, it will short circuit and return the first error.
    isDev
      ? Result.combine(
          await devModeSyncVirusScanning(
            req.body.responses,
            req.formsg.formDef._id.toString(),
          ),
        )
      : await ResultAsync.combine(
          asyncVirusScanning(
            req.body.responses,
            req.formsg.formDef._id.toString(),
          ),
        )

  if (scanAndRetrieveFilesResult.isErr()) {
    logger.error({
      message: 'Error scanning and downloading clean attachments',
      meta: logMeta,
      error: scanAndRetrieveFilesResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(
      scanAndRetrieveFilesResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  logger.info({
    message: 'Successfully scanned and downloaded clean attachments',
    meta: logMeta,
  })

  // Replace req.body.responses with the new responses with populated attachments.
  req.body.responses = scanAndRetrieveFilesResult.value

  return next()
}

/**
 * Middleware to validate payment content
 */
export const validatePaymentSubmission = async (
  req: ValidateSubmissionMiddlewareHandlerRequest,
  res: Parameters<EncryptSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const formDefDoc = req.formsg.formDef as IPopulatedForm

  const formDef = formDefDoc.toObject() // Convert to POJO

  const logMeta = {
    action: 'validatePaymentSubmission',
    formId: String(formDef._id),
    ...createReqMeta(req),
  }

  const formDefProducts = formDef?.payments_field?.products
  const submittedPaymentProducts = req.body.paymentProducts
  if (submittedPaymentProducts) {
    if (!isPaymentsProducts(formDefProducts)) {
      // Payment definition does not allow for payment by product

      logger.error({
        message: 'Invalid form definition for payment by product',
        meta: logMeta,
      })

      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          'The payment settings in this form have been updated. Please refresh and try again.',
      })
    }
    return PaymentsService.validatePaymentProducts(
      formDefProducts,
      submittedPaymentProducts,
    )
      .map(() => next())
      .mapErr((error) => {
        logger.error({
          message: 'Error validating payment submission',
          meta: logMeta,
          error,
        })
        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  }
  return next()
}

/**
 * Validates storage submissions to the new endpoint (/api/v3/forms/:formId/submissions/storage).
 * This uses the same validators as email mode submissions.
 */
export const validateStorageSubmission = async (
  req: ValidateSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const formDef = req.formsg.formDef
  let spcpSubmissionFailure: undefined | true

  const logMeta = {
    action: 'validateStorageSubmission',
    ...createReqMeta(req),
    formId: formDef._id.toString(),
  }

  // Validate submission
  return await SubmissionService.validateAttachments(
    req.body.responses,
    formDef.responseMode,
  )
    .andThen(() =>
      ParsedResponsesObject.parseResponses(formDef, req.body.responses),
    )
    .map((parsedResponses) => {
      const responses = [] as EncryptFormFieldResponse[]
      for (const response of parsedResponses.getAllResponses()) {
        // `isVisible` is being stripped out here. Why: https://github.com/opengovsg/FormSG/pull/6907
        if (response.isVisible) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isVisible: _, ...rest } = response
          if (!isAttachmentResponse(rest)) responses.push(rest)
          else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { filename: __, content: ___, ...restAttachments } = rest
            responses.push({
              ...restAttachments,
            } as EncryptAttachmentResponse)
          }
        }
      }
      req.formsg.filteredResponses = responses
      return { parsedResponses, form: formDef }
    })
    .andThen(({ parsedResponses, form }) => {
      // Validate MyInfo responses
      const { authType } = form
      switch (authType) {
        case FormAuthType.SGID_MyInfo:
        case FormAuthType.MyInfo: {
          return extractMyInfoLoginJwt(req.cookies, authType)
            .andThen(MyInfoService.verifyLoginJwt)
            .asyncAndThen(({ uinFin }) =>
              MyInfoService.fetchMyInfoHashes(uinFin, form._id)
                .andThen((hashes) =>
                  MyInfoService.checkMyInfoHashes(
                    parsedResponses.responses,
                    hashes,
                  ),
                )
                .map<IPopulatedStorageFormWithResponsesAndHash>(
                  (hashedFields) => ({
                    hashedFields,
                    parsedResponses,
                  }),
                ),
            )
            .mapErr((error) => {
              spcpSubmissionFailure = true
              logger.error({
                message: `Error verifying MyInfo${
                  authType === FormAuthType.SGID_MyInfo ? '(over SGID)' : ''
                } hashes`,
                meta: logMeta,
                error,
              })
              return error
            })
        }
        default:
          return ok<IPopulatedStorageFormWithResponsesAndHash, never>({
            parsedResponses,
          })
      }
    })
    .map(({ parsedResponses, hashedFields }) => {
      const storageFormData = formatMyInfoStorageResponseData(
        parsedResponses.getAllResponses(),
        hashedFields,
      )
      req.body.responses = storageFormData
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error saving responses in req.body',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
        spcpSubmissionFailure,
      })
    })
}

/**
 * Encrypt submission content before saving to DB.
 */
export const encryptSubmission = async (
  req: StorageSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const encryptedFormDef = req.formsg.encryptedFormDef
  const publicKey = encryptedFormDef.publicKey

  const attachmentsMap: Record<string, Buffer> = {}

  // Populate attachment map
  req.body.responses.filter(isAttachmentResponse).forEach((response) => {
    const fieldId = response._id
    attachmentsMap[fieldId] = response.content
  })

  const encryptedAttachments =
    await getEncryptedAttachmentsMapFromAttachmentsMap(
      attachmentsMap,
      publicKey,
      req.body.version,
    )

  // Autoreplies are sent after the submission has been saved in the DB,
  // but attachments are stripped here. To ensure that users receive their
  // attachments in the autoreply we keep the attachments in req.formsg
  if (req.formsg) {
    req.formsg.unencryptedAttachments = req.body.responses
      .filter(isAttachmentResponse)
      .map((response) => {
        return {
          filename: response.filename,
          content: response.content,
          fieldId: response._id,
        }
      })
  }

  const strippedBodyResponses = req.body.responses.map((response) => {
    if (isAttachmentResponse(response)) {
      return {
        ...response,
        filename: undefined,
        content: undefined, //Strip out attachment content
      }
    } else {
      return response
    }
  })

  const encryptedContent = formsgSdk.crypto.encrypt(
    strippedBodyResponses,
    publicKey,
  )

  req.formsg.encryptedPayload = {
    attachments: encryptedAttachments,
    responses: req.formsg.filteredResponses,
    encryptedContent,
    version: req.body.version,
    paymentProducts: req.body.paymentProducts,
    paymentReceiptEmail: req.body.paymentReceiptEmail,
    payments: req.body.payments,
  }

  return next()
}

/**
 * Moves encrypted payload present in req.body to req.formsg.encryptedPayload.
 * Should only be used for the old storage mode submission endpoint (/api/v3/forms/:formId/submissions/encrypt).
 */
export const moveEncryptedPayload = async (
  req: EncryptSubmissionMiddlewareHandlerRequest,
  res: Parameters<EncryptSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  if (req.formsg.encryptedPayload) {
    return res.send(new EncryptedPayloadExistsError())
  }

  req.formsg.encryptedPayload = req.body
  return next()
}

/**
 * Validates mobile and email fields for storage submissions on the old endpoint.
 * Should only be used for the old storage mode submission endpoint (/api/v3/forms/:formId/submissions/encrypt).
 */
export const validateEncryptSubmission = async (
  req: EncryptSubmissionMiddlewareHandlerRequest,
  res: Parameters<EncryptSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const form = req.formsg.encryptedFormDef
  const responses = req.body.responses
  const encryptedContent = req.body.encryptedContent

  const logMeta = {
    action: 'validateEncryptSubmission',
    ...createReqMeta(req),
    formId: form._id.toString(),
  }

  const incomingSubmissionResult = IncomingEncryptSubmission.init(
    form,
    responses,
    encryptedContent,
  )
  if (incomingSubmissionResult.isErr()) {
    logger.error({
      message: 'Error in getting parsed responses for encrypt submission',
      meta: logMeta,
      error: incomingSubmissionResult.error,
    })
    const { statusCode, errorMessage } = mapRouteError(
      incomingSubmissionResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  logger.info({
    message: 'Successfully parsed responses for encrypt submission',
    meta: logMeta,
  })

  req.formsg.filteredResponses = incomingSubmissionResult.value.responses

  return next()
}

/**
 * Creates formsg namespace in req.body and populates it with featureFlags, formDef and encryptedFormDef.
 */
export const createFormsgAndRetrieveForm = async (
  req: CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  res: Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const { formId } = req.params

  const logMeta = {
    action: 'createFormsgAndRetrieveForm',
    ...createReqMeta(req),
    formId,
  }

  // Step 1: Create formsg namespace in req.body
  if (req.formsg) return res.send(new FormsgReqBodyExistsError())
  const formsg = {
    responseMode: FormResponseMode.Encrypt,
  } as EncryptFormLoadedDto

  // Step 2: Retrieve feature flags
  const featureFlagsListResult = await FeatureFlagService.getEnabledFlags()

  if (featureFlagsListResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving enabled feature flags',
      meta: logMeta,
      error: featureFlagsListResult.error,
    })
  } else {
    formsg.featureFlags = featureFlagsListResult.value
  }

  // Step 3a: Retrieve form
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.warn({
      message: 'Failed to retrieve form from database',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Step 3b: Set formsg.formDef in req.body
  const formDef = formResult.value
  formsg.formDef = formDef

  // Step 4a: Check if form is encrypt mode
  const checkFormIsEncryptModeResult = checkFormIsEncryptMode(formDef)
  if (checkFormIsEncryptModeResult.isErr()) {
    logger.error({
      message:
        'Trying to submit non-encrypt mode submission on encrypt-form submission endpoint',
      meta: logMeta,
    })
    const { statusCode, errorMessage } = mapRouteError(
      checkFormIsEncryptModeResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  // Step 4b: Set formsg.encryptedFormDef in req.body
  formsg.encryptedFormDef = checkFormIsEncryptModeResult.value

  // Step 5: Check if form has public key
  if (!formDef.publicKey) {
    logger.warn({
      message: 'Form does not have a public key',
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Form does not have a public key',
    })
  }

  req.formsg = formsg

  return next()
}
