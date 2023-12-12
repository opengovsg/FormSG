import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'

import { FormResponseMode } from '../../../../../shared/types'
import { MultirespondentFormLoadedDto } from '../../../../types/api/multirespondent_submission'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import * as FormService from '../../form/form.service'
import { FormsgReqBodyExistsError } from '../encrypt-submission/encrypt-submission.errors'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'
import { mapRouteError } from '../encrypt-submission/encrypt-submission.utils'
import { isAttachmentResponse } from '../submission.utils'

import { checkFormIsMultirespondent } from './multirespondent-submission.service'
import {
  CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerType,
} from './multirespondent-submission.types'

const logger = createLoggerWithLabel(module)

export const validateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    responses: Joi.object(), //TODO(MRF): Improve this validation, should match FieldResponsesV3
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

/**
 * Encrypt submission content before saving to DB.
 */
export const encryptSubmission = async (
  req: MultirespondentSubmissionMiddlewareHandlerRequest,
  res: Parameters<MultirespondentSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const formDef = req.formsg.formDef
  const formPublicKey = formDef.publicKey

  // const attachmentsMap: Record<string, Buffer> = {}

  // Populate attachment map
  //TODO(MRF): Attachments
  // req.body.responses.filter(isAttachmentResponse).forEach((response) => {
  //   const fieldId = response._id
  //   attachmentsMap[fieldId] = response.content
  // })

  // const encryptedAttachments =
  //   await getEncryptedAttachmentsMapFromAttachmentsMap(
  //     attachmentsMap,
  //     publicKey,
  //   )

  // const strippedBodyResponses = req.body.responses.map((response) => {
  //   if (isAttachmentResponse(response)) {
  //     return {
  //       ...response,
  //       filename: undefined,
  //       content: undefined, //Strip out attachment content
  //     }
  //   } else {
  //     return response
  //   }
  // })

  // const encryptedContent = formsgSdk.crypto.encrypt(
  //   strippedBodyResponses,
  //   publicKey,
  // )

  const {
    encryptedContent,
    encryptedSubmissionSecretKey,
    submissionSecretKey,
    submissionPublicKey,
  } = formsgSdk.cryptoV3.encrypt(req.body.responses, formPublicKey)

  //TODO(MRF): Workflow here

  req.formsg.encryptedPayload = {
    // attachments: encryptedAttachments,
    // responses: req.body.responses,
    responseMetadata: req.body.responseMetadata,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    version: req.body.version,
  }

  return next()
}
