import { encode as encodeBase64 } from '@stablelib/base64'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { chain, omit } from 'lodash'

import {
  BasicField,
  StorageModeAttachment,
  StorageModeAttachmentsMap,
} from '../../../../../shared/types'
import { EncryptFormFieldResponse, FormLoadedDto } from '../../../../types/api'
import { paymentConfig } from '../../../config/features/payment.config'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { JoiPaymentProduct } from '../../form/admin-form/admin-form.payments.constants'
import * as FormService from '../../form/form.service'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import { sharedSubmissionParams } from '../submission.constants'
import * as SubmissionService from '../submission.service'
import { getFilteredResponses, isAttachmentResponse } from '../submission.utils'

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
} from './encrypt-submission.types'
import { mapRouteError } from './encrypt-submission.utils'

export const logger = createLoggerWithLabel(module)

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
  next: Parameters<StorageSubmissionMiddlewareHandlerType>[2],
) => {
  const formDef = req.formsg.formDef

  if (!formDef.encryptionBoundaryShift) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: 'This endpoint has not been enabled for this form.' })
  }

  return next()
}

export const validateSubmission = async (
  req: StorageSubmissionMiddlewareHandlerRequest,
  res: Parameters<StorageSubmissionMiddlewareHandlerType>[1],
  next: Parameters<StorageSubmissionMiddlewareHandlerType>[2],
) => {
  const formDef = req.formsg.formDef

  const logMeta = {
    action: 'validateSubmission',
    ...createReqMeta(req),
    formId: formDef.id,
  }

  // Validate submission
  return await SubmissionService.validateAttachments(
    req.body.responses,
    formDef.responseMode,
  )
    .andThen(() =>
      ParsedResponsesObject.parseResponses(formDef, req.body.responses),
    )
    .map(() => next())
    .mapErr((error) => {
      logger.error({
        message: 'Error processing responses',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
      })
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
  next: Parameters<StorageSubmissionMiddlewareHandlerType>[2],
) => {
  const formId = req.params.formId
  const encryptedFormDef = req.formsg.encryptedFormDef
  const publicKey = encryptedFormDef.publicKey

  const attachmentsMap: Record<string, Buffer> = {}

  const logMeta = {
    action: 'encryptSubmission',
    ...createReqMeta(req),
    formId,
  }

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

  const filteredResponses = getFilteredResponses(
    encryptedFormDef,
    req.body.responses,
  )

  if (filteredResponses.isErr()) {
    logger.warn({
      message: filteredResponses.error.message,
      meta: logMeta,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: filteredResponses.error.message,
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
    responses: filteredResponses.value as EncryptFormFieldResponse[],
    encryptedContent,
    version: req.body.version,
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
  next: Parameters<EncryptSubmissionMiddlewareHandlerType>[2],
) => {
  if (req.formsg.encryptedPayload) {
    return res.send(new EncryptedPayloadExistsError())
  }

  req.formsg.encryptedPayload = req.body
  return next()
}

export const createFormsgAndRetrieveForm = async (
  req: CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  res: Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[1],
  next: Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[2],
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

  // Step 2a: Retrieve form
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

  // Step 2b: Set formsg.formDef in req.body
  const formDef = formResult.value
  formsg.formDef = formDef

  // Step 3a: Check if form is encrypt mode
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

  // Step 3b: Set formsg.encryptedFormDef in req.body
  formsg.encryptedFormDef = checkFormIsEncryptModeResult.value

  // Step 4: Check if form has public key
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
