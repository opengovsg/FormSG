import { encode as encodeBase64 } from '@stablelib/base64'
import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { chain, omit } from 'lodash'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { featureFlags } from '../../../../../shared/constants'
import {
  BasicField,
  StorageModeAttachment,
  StorageModeAttachmentsMap,
} from '../../../../../shared/types'
import {
  EncryptAttachmentResponse,
  EncryptFormFieldResponse,
  FormLoadedDto,
} from '../../../../types/api'
import { paymentConfig } from '../../../config/features/payment.config'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import { JoiPaymentProduct } from '../../form/admin-form/admin-form.payments.constants'
import * as FormService from '../../form/form.service'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import { sharedSubmissionParams } from '../submission.constants'
import * as SubmissionService from '../submission.service'
import {
  isAttachmentResponse,
  isQuarantinedAttachmentResponse,
} from '../submission.utils'

import {
  EncryptedPayloadExistsError,
  FormsgReqBodyExistsError,
} from './encrypt-submission.errors'
import {
  checkFormIsEncryptMode,
  triggerVirusScanning,
} from './encrypt-submission.service'
import {
  CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  CreateFormsgAndRetrieveFormMiddlewareHandlerType,
  EncryptSubmissionMiddlewareHandlerRequest,
  EncryptSubmissionMiddlewareHandlerType,
  StorageSubmissionMiddlewareHandlerRequest,
  StorageSubmissionMiddlewareHandlerType,
  ValidateSubmissionMiddlewareHandlerRequest,
} from './encrypt-submission.types'
import { mapRouteError } from './encrypt-submission.utils'
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
        .min(paymentConfig.minPaymentAmountCents)
        .max(paymentConfig.maxPaymentAmountCents),
    }),
    version: Joi.number().required(),
  }),
})

/**
 * Guardrail to prevent new endpoint from being used for regular storage mode forms.
 * TODO (FRM-1232): remove this guardrail when encryption boundary is shifted.
 */
export const checkNewBoundaryEnabled = async (
  req: StorageSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const logMeta = {
    action: 'checkNewBoundaryEnabled',
    ...createReqMeta(req),
  }

  const newBoundaryEnabled = req.formsg.featureFlags.includes(
    featureFlags.encryptionBoundaryShift,
  )

  if (!newBoundaryEnabled) {
    logger.warn({
      message: 'Encryption boundary shift is not enabled.',
      meta: logMeta,
    })

    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: 'This endpoint has not been enabled for this form.' })
  }

  return next()
}

/**
 * Guardrail to prevent virus scanner code from being run if not enabled on frontend.
 * TODO (FRM-1232): remove this guardrail when encryption boundary is shifted.
 */
export const scanAttachments = async (
  req: StorageSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const logMeta = {
    action: 'scanAttachments',
    ...createReqMeta(req),
  }

  // Step 1: If virus scanner is not enabled, skip this middleware.

  const virusScannerEnabled = req.formsg.featureFlags.includes(
    featureFlags.encryptionBoundaryShiftVirusScanner,
  )

  if (!virusScannerEnabled) {
    logger.warn({
      message: 'Virus scanner is not enabled.',
      meta: logMeta,
    })

    return next()
  }

  // Step 2: If virus scanner is enabled, check if storage submission v2.1+. Storage submission v2.1 onwards
  // should have virus scanning enabled. If not, skip this middleware.
  // Note: Version number is sent by the frontend and should only be >=2.1 if virus scanning is enabled on the frontend.

  if (req.body.version < 2.1) return next()

  // At this point, virus scanner is enabled and storage submission v2.1+. This means that both the FE and BE
  // have virus scanning enabled.

  // Step 3: Trigger lambda to scan attachments.
  const triggerLambdaResult = await ResultAsync.combine(
    req.body.responses.map((response) => {
      if (isQuarantinedAttachmentResponse(response)) {
        return triggerVirusScanning(response.filename).andThen((data) => {
          const { statusCode, body } = JSON.parse(
            Buffer.from(data?.Payload ?? '').toString(),
          ) as {
            statusCode: number
            body: string
          }
          const parsedBody = JSON.parse(body)
          const returnPayload = {
            statusCode,
            body: parsedBody,
          }
          logger.info({
            message: 'Successfully invoked lambda function',
            meta: {
              ...logMeta,
              responseMetadata: data?.$metadata,
              returnPayload,
            },
          })

          // If return payload is not OK, either file cannot be found or virus scan failed. This should be
          // treated as a fatal error we should investigate.
          if (statusCode !== StatusCodes.OK) {
            logger.warn({
              message: 'Some lambda invocations failed',
              meta: {
                ...logMeta,
                responseMetadata: data?.$metadata,
                returnPayload,
              },
            })
            return errAsync(returnPayload)
          }

          return okAsync(returnPayload)
        })
      }
      // If response is not an attachment, return ok.
      return okAsync(true)
    }),
  )

  // If any of the lambda invocations failed, return an errored response.
  if (triggerLambdaResult.isErr()) {
    logger.error({
      message: 'Error scanning attachments',
      meta: logMeta,
      error: triggerLambdaResult.error,
    })

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
      message:
        'Something went wrong while scanning your attachments. Please try again.',
    })
  }

  // TODO(FRM-1302): Step 4: Retrieve attachments from the clean bucket.

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
        if (response.isVisible) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isVisible: _, ...rest } = response
          if (!isAttachmentResponse(rest)) responses.push(rest)
          else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { filename: __, content: ___, ...restAttachments } = rest
            responses.push({ ...restAttachments } as EncryptAttachmentResponse)
          }
        }
      }
      req.formsg.filteredResponses = responses
      return next()
    })
    .mapErr((error) => {
      // TODO(FRM-1318): Set DB flag to true to harden submission validation after validation has similar error rates as email mode forms.
      if (
        req.formsg.featureFlags.includes(
          featureFlags.encryptionBoundaryShiftHardValidation,
        )
      ) {
        logger.error({
          message: 'Error processing responses',
          meta: logMeta,
          error,
        })
        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      }
      logger.warn({
        message:
          'Error processing responses, but proceeding with submission as submission have been validated client-side',
        meta: logMeta,
        error,
      })
      req.formsg.filteredResponses = req.body.responses
      return next()
    })
}

const encryptAttachment = async (
  attachment: Buffer,
  { id, publicKey }: { id: string; publicKey: string },
): Promise<StorageModeAttachment & { id: string }> => {
  let label

  try {
    label = 'Read file content'

    const fileContentsView = new Uint8Array(attachment)

    label = 'Encrypt content'
    const encryptedAttachment = await formsgSdk.crypto.encryptFile(
      fileContentsView,
      publicKey,
    )

    label = 'Base64-encode encrypted content'
    const encodedEncryptedAttachment = {
      ...encryptedAttachment,
      binary: encodeBase64(encryptedAttachment.binary),
    }

    return { id, encryptedFile: encodedEncryptedAttachment }
  } catch (error) {
    logger.error({
      message: 'Error encrypting attachment',
      meta: {
        action: 'encryptAttachment',
        label,
        error,
      },
    })
    throw error
  }
}

const getEncryptedAttachmentsMapFromAttachmentsMap = async (
  attachmentsMap: Record<string, Buffer>,
  publicKey: string,
): Promise<StorageModeAttachmentsMap> => {
  const attachmentPromises = Object.entries(attachmentsMap).map(
    ([id, attachment]) => encryptAttachment(attachment, { id, publicKey }),
  )

  return Promise.all(attachmentPromises).then((encryptedAttachmentsMeta) =>
    chain(encryptedAttachmentsMeta)
      .keyBy('id')
      // Remove id from object.
      .mapValues((v) => omit(v, 'id'))
      .value(),
  )
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
    )

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
  const formsg = {} as FormLoadedDto

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
