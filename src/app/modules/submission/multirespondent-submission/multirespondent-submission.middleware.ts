import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import { BasicField, FormResponseMode } from '../../../../../shared/types'
import { isDev } from '../../../../app/config/config'
import { ParsedClearAttachmentResponseV3 } from '../../../../types/api'
import { MultirespondentFormLoadedDto } from '../../../../types/api/multirespondent_submission'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import * as FormService from '../../form/form.service'
import { FormsgReqBodyExistsError } from '../encrypt-submission/encrypt-submission.errors'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'
import {
  DownloadCleanFileFailedError,
  MaliciousFileDetectedError,
  VirusScanFailedError,
} from '../submission.errors'
import { triggerVirusScanThenDownloadCleanFileChain } from '../submission.service'
import {
  getEncryptedAttachmentsMapFromAttachmentsMap,
  mapRouteError,
} from '../submission.utils'

import { checkFormIsMultirespondent } from './multirespondent-submission.service'
import {
  CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerType,
  ProcessedMultirespondentSubmissionHandlerRequest,
  ProcessedMultirespondentSubmissionHandlerType,
} from './multirespondent-submission.types'

const logger = createLoggerWithLabel(module)

export const validateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    responses: Joi.object().pattern(
      /^[a-fA-F0-9]{24}$/,
      Joi.object({
        fieldType: Joi.string().valid(...Object.values(BasicField)),
        //TODO(MRF/FRM-1592): Improve this validation, should match ParsedClearFormFieldResponseV3
        answer: Joi.required(),
      }),
    ),
    responseMetadata: Joi.object({
      responseTimeMs: Joi.number(),
      numVisibleFields: Joi.number(),
    }),
    version: Joi.number().required(),
  }),
})

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
    responseMode: FormResponseMode.Multirespondent,
  } as MultirespondentFormLoadedDto

  // Step 2a: Retrieve feature flags
  return FeatureFlagService.getEnabledFlags()
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred whilst retrieving enabled feature flags',
        meta: logMeta,
        error,
      })
    })
    .map((featureFlags) => {
      // Step 2b: Set formsg.featureFlags
      formsg.featureFlags = featureFlags

      // Step 3: Retrieve form
      return FormService.retrieveFullFormById(formId)
        .mapErr((error) => {
          logger.warn({
            message: 'Failed to retrieve form from database',
            meta: logMeta,
            error,
          })
          const { errorMessage, statusCode } = mapRouteError(error)
          return res.status(statusCode).json({ message: errorMessage })
        })
        .map((formDef) =>
          // Step 4a: Check form is multirespondent form
          checkFormIsMultirespondent(formDef)
            .mapErr((error) => {
              logger.error({
                message:
                  'Trying to submit non-multirespondent submission on multirespondent submission endpoint',
                meta: logMeta,
              })
              const { statusCode, errorMessage } = mapRouteError(error)
              return res.status(statusCode).json({
                message: errorMessage,
              })
            })
            .map((multirespondentFormDef) => {
              // Step 4b: Set formsg.formDef
              formsg.formDef = multirespondentFormDef

              // Step 5: Check if form has public key
              if (!multirespondentFormDef.publicKey) {
                const message = 'Form does not have a public key'
                logger.warn({ message, meta: logMeta })
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                  message,
                })
              }

              // Step 6: Set req.formsg
              req.formsg = formsg

              return next()
            }),
        )
    })
}

type IdTaggedParsedClearAttachmentResponseV3 =
  ParsedClearAttachmentResponseV3 & { id: string }

/**
 * Asynchronous virus scanning for storage submissions v2.1+. This is used for non-dev environments.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const asyncVirusScanning = (
  responses: IdTaggedParsedClearAttachmentResponseV3[],
): ResultAsync<
  IdTaggedParsedClearAttachmentResponseV3,
  | VirusScanFailedError
  | DownloadCleanFileFailedError
  | MaliciousFileDetectedError
>[] =>
  responses.map((response) =>
    triggerVirusScanThenDownloadCleanFileChain(response.answer).map(
      (attachmentResponse) => ({ ...response, answer: attachmentResponse }),
    ),
  )

/**
 * Synchronous virus scanning for storage submissions v2.1+. This is used for dev environment.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const devModeSyncVirusScanning = async (
  responses: IdTaggedParsedClearAttachmentResponseV3[],
): Promise<
  Result<
    IdTaggedParsedClearAttachmentResponseV3,
    | VirusScanFailedError
    | DownloadCleanFileFailedError
    | MaliciousFileDetectedError
  >[]
> => {
  const results = []
  for (const response of responses) {
    // await to pause for...of loop until the virus scanning and downloading of clean file is completed.
    const attachmentResponse = await triggerVirusScanThenDownloadCleanFileChain(
      response.answer,
    )
    if (attachmentResponse.isErr()) {
      results.push(err(attachmentResponse.error))
      break
    }
    results.push(ok({ ...response, answer: attachmentResponse.value }))
  }
  return results
}

/**
 * Scan attachments on quarantine bucket and retrieve attachments from the clean bucket.
 * Note: Downloading of attachments from the clean bucket is not implemented yet. See Step 4.
 */
export const scanAndRetrieveAttachments = async (
  req: MultirespondentSubmissionMiddlewareHandlerRequest,
  res: Parameters<MultirespondentSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const logMeta = {
    action: 'scanAndRetrieveAttachments',
    ...createReqMeta(req),
  }

  // Step 1: Extract attachment responses into an array to prepare for virus scanning.
  const attachmentResponsesToRetrieve: IdTaggedParsedClearAttachmentResponseV3[] =
    Object.keys(req.body.responses)
      .map((id) => {
        const response = req.body.responses[id]
        if (
          response.fieldType !== BasicField.Attachment ||
          response.answer.hasBeenScanned
        ) {
          return null
        }
        return { id, ...response }
      })
      .filter(
        (value): value is IdTaggedParsedClearAttachmentResponseV3 =>
          value !== null,
      )

  // Step 2: For each attachment, trigger lambda to scan and if it succeeds, retrieve attachment from clean bucket. Do this asynchronously.
  const scanAndRetrieveFilesResult =
    // On the local development environment, there is only 1 lambda and the virus scanning service WILL CRASH if multiple lambda invocations are
    // attempted at the same time. Reference: https://www.notion.so/opengov/Encryption-Boundary-Shift-the-journey-so-far-dfc6e15fc65f45eba3dd6a9af48eebea?pvs=4#d0944ba61aad45ce988ed0474f131e59
    // As such, in dev mode, we want to run the virus scanning synchronously. In non-dev mode, as we'll be using the lambdas on AWS, we should
    // run the virus scanning asynchronously for better performance (lower latency).
    // Note on .combine: if any scans or downloads error out, it will short circuit and return the first error.
    isDev
      ? Result.combine(
          await devModeSyncVirusScanning(attachmentResponsesToRetrieve),
        )
      : await ResultAsync.combine(
          asyncVirusScanning(attachmentResponsesToRetrieve),
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

  // Step 3: Update responses with new values.
  for (const idTaggedAttachmentResponse of scanAndRetrieveFilesResult.value) {
    const { id, ...attachmentResponse } = idTaggedAttachmentResponse
    attachmentResponse.answer.hasBeenScanned = true
    req.body.responses[id] = attachmentResponse
  }

  return next()
}

/**
 * Encrypt submission content before saving to DB.
 */
export const encryptSubmission = async (
  req: ProcessedMultirespondentSubmissionHandlerRequest,
  res: Parameters<ProcessedMultirespondentSubmissionHandlerType>[1],
  next: NextFunction,
) => {
  const formDef = req.formsg.formDef
  const formPublicKey = formDef.publicKey
  const responses = req.body.responses

  const attachmentsMap: Record<string, Buffer> = {}
  const strippedAttachmentResponses: Record<string, any> = {}

  // Populate attachment map
  for (const id of Object.keys(responses)) {
    const response = responses[id]
    if (response.fieldType !== BasicField.Attachment) {
      strippedAttachmentResponses[id] = response
      continue
    }
    attachmentsMap[id] = response.answer.content
    strippedAttachmentResponses[id] = {
      ...response,
      answer: { ...response.answer, filename: undefined, content: undefined },
    }
  }

  const encryptedAttachments =
    await getEncryptedAttachmentsMapFromAttachmentsMap(
      attachmentsMap,
      formPublicKey,
      req.body.version,
    )

  const {
    encryptedContent,
    encryptedSubmissionSecretKey,
    // submissionSecretKey,
    submissionPublicKey,
  } = formsgSdk.cryptoV3.encrypt(responses, formPublicKey)

  //TODO(MRF/FRM-1577): Workflow here using submissionSecretKey

  req.formsg.encryptedPayload = {
    attachments: encryptedAttachments,
    // responses: req.body.responses,
    responseMetadata: req.body.responseMetadata,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    version: req.body.version,
  }

  return next()
}
