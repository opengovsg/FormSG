import { celebrate, Joi, Segments } from 'celebrate'
import crypto from 'crypto'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FormDto,
  FormFieldDto,
  FormResponseMode,
  SubmissionType,
} from '../../../../../shared/types'
import { isDev } from '../../../../app/config/config'
import {
  ParsedClearAttachmentResponseV3,
  ParsedClearFormFieldResponsesV3,
  ParsedClearFormFieldResponseV3,
} from '../../../../types/api'
import { MultirespondentFormLoadedDto } from '../../../../types/api/multirespondent_submission'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  getLogicUnitPreventingSubmitV3,
  getVisibleFieldIdsV3,
} from '../../../utils/logic-adaptor'
import { createReqMeta } from '../../../utils/request'
import { isFieldResponseV3Equal } from '../../../utils/response-v3'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import { assertFormAvailable } from '../../form/admin-form/admin-form.utils'
import * as FormService from '../../form/form.service'
import { FormsgReqBodyExistsError } from '../encrypt-submission/encrypt-submission.errors'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'
import {
  DownloadCleanFileFailedError,
  InvalidSubmissionTypeError,
  MaliciousFileDetectedError,
  ProcessingError,
  VirusScanFailedError,
} from '../submission.errors'
import {
  getEncryptedSubmissionData,
  triggerVirusScanThenDownloadCleanFileChain,
} from '../submission.service'
import {
  getEncryptedAttachmentsMapFromAttachmentsMap,
  mapRouteError,
} from '../submission.utils'

import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from './multirespondent-submission.service'
import {
  CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerRequest,
  MultirespondentSubmissionMiddlewareHandlerType,
  ProcessedMultirespondentSubmissionHandlerRequest,
  ProcessedMultirespondentSubmissionHandlerType,
  StrippedAttachmentResponseV3,
} from './multirespondent-submission.types'
import { validateMrfFieldResponses } from './multirespondent-submission.utils'

const logger = createLoggerWithLabel(module)

const multirespondentSubmissionBodySchema = Joi.object({
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
})

export const validateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: multirespondentSubmissionBodySchema,
})

const updateMultirespondentSubmissionBodySchema =
  multirespondentSubmissionBodySchema.append({
    submissionSecretKey: Joi.string().required(),
  })

export const validateUpdateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: updateMultirespondentSubmissionBodySchema,
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
          response.fieldType !== BasicField.Attachment
          // TODO: FRM-1839 + FRM-1590 Skip scanning if attachment has already been scanned
          // || response.answer.hasBeenScanned
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
    // TODO: FRM-1839 Skip scanning if attachment has already been scanned
    attachmentResponse.answer.hasBeenScanned = true
    // Store the md5 hash in the DB as well for comparison later on.
    attachmentResponse.answer.md5Hash = crypto
      .createHash('md5')
      .update(Buffer.from(attachmentResponse.answer.content))
      .digest()
      .toString()
    req.body.responses[id] = attachmentResponse
  }

  return next()
}

/**
 * What types of fields are there?
 *              |  Visible                    | Not visible
 * -------------|-----------------------------|-------------------
 * Editable     |  Regular field validation   | Not allowed
 * Non-editable |  Not allowed / prev submiss | Not allowed
 *
 * Initial submission:
 * 1. Retrieve form object
 * 2. Defined editable fields from workflow[0].edit.
 *     a. If no workflow, all fields are editable.
 * 3. Get visible fields by logic
 * 4. CHECK: no logic block preventing submit
 * 5. CHECK: response fields subset of visible fields
 * 6. CHECK: response fields subset of editable fields
 * 7. CHECK: for each field, validate by its rules
 *
 * Subsequent submissions:
 * - Identical to initial except in step 6, check that any response fields that
 * were non-editable were indeed not edited (i.e. equality with previous submission)
 *
 * - Attachment names will be replaced with the previousResponse filename
 * @param req
 * @param res
 * @param next
 * @returns
 */
export const validateMultirespondentSubmission = async (
  req: ProcessedMultirespondentSubmissionHandlerRequest,
  res: Parameters<MultirespondentSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'validateMultirespondentSubmission',
    submissionId,
    formId,
    ...createReqMeta(req),
  }

  return (
    // Step 0: Prepare by retrieving relevant reference data
    okAsync(submissionId)
      .andThen((submissionId) =>
        // Step 0a: If its an existing submission, use the reference data from
        // the submission rather than the form
        submissionId
          ? getMultirespondentSubmission(submissionId).map((submission) => ({
              previousSubmission: {
                encryptedContent: submission.encryptedContent,
                version: submission.version,
              },
              workflowStep: submission.workflowStep + 1,
              workflow: submission.workflow,
              form_fields: submission.form_fields,
              form_logics: submission.form_logics,
            }))
          : okAsync({
              previousSubmission: undefined,
              workflowStep: 0,
              workflow: req.formsg.formDef.workflow,
              form_fields: req.formsg.formDef.form_fields.map(
                (ff) => ff.toObject() as FormFieldDto,
              ),
              form_logics: req.formsg.formDef.form_logics,
            }),
      )
      .andThen(
        ({
          previousSubmission,
          workflowStep,
          workflow,
          form_fields,
          form_logics,
        }) => {
          // Step 0b: Determine editable fields based on the workflow step, if it exists.
          const editableFieldIds = (
            workflow[workflowStep]
              ? workflow[workflowStep].edit
              : form_fields.map((ff) => ff._id)
          ).map(String)

          const formPropertiesForLogicComputation = {
            _id: formId,
            form_fields,
            form_logics,
          } as Pick<FormDto, '_id' | 'form_fields' | 'form_logics'>

          // Step 0c: Get visible fields based on evaluation of logic
          return getVisibleFieldIdsV3(
            req.body.responses,
            formPropertiesForLogicComputation,
          ).andThen((visibleFieldIds) =>
            // Step 1: Check prevent submission logic
            getLogicUnitPreventingSubmitV3(
              req.body.responses,
              formPropertiesForLogicComputation,
              visibleFieldIds,
            )
              .andThen((logicUnitPreventingSubmit) =>
                logicUnitPreventingSubmit
                  ? err(
                      new ProcessingError('Submission prevented by form logic'),
                    )
                  : ok(undefined),
              )
              .andThen(() =>
                // Step 2: Check that response fields C visible fields
                Object.keys(req.body.responses).every((fieldId) =>
                  visibleFieldIds.has(fieldId),
                )
                  ? ok(undefined)
                  : err(
                      new ProcessingError(
                        'Attempted to submit response on a hidden field',
                      ),
                    ),
              )
              .andThen(() => {
                // Step 3: Match non-editable response fields to previous version

                const nonEditableFieldIdsWithResponses = Object.keys(
                  req.body.responses,
                ).filter((fieldId) => !editableFieldIds.includes(fieldId))

                // If it's the first submission, just check that response fields C editable fields
                if (!previousSubmission) {
                  return nonEditableFieldIdsWithResponses.length === 0
                    ? ok(undefined)
                    : err(
                        new ProcessingError(
                          'Attempted to submit response on a non-editable field',
                        ),
                      )
                }

                // If it's not the first submission, need to check that the responses match existing values from the DB
                if (!req.body.submissionSecretKey) {
                  return err(
                    new ProcessingError('Submission secret key is required'),
                  )
                }

                const previousSubmissionDecryptedContent =
                  formsgSdk.cryptoV3.decryptFromSubmissionKey(
                    req.body.submissionSecretKey,
                    previousSubmission,
                  )

                if (!previousSubmissionDecryptedContent) {
                  return err(
                    new ProcessingError('Unable to decrypt previous response'),
                  )
                }

                const previousResponses =
                  previousSubmissionDecryptedContent.responses as ParsedClearFormFieldResponsesV3

                const previousNonEditableFieldIdsWithResponses = Object.keys(
                  previousResponses,
                ).filter((fieldId) => !editableFieldIds.includes(fieldId))

                for (const fieldId of previousNonEditableFieldIdsWithResponses) {
                  // ensure that respondents cannot alter a non-editable field by omitting the field in the submission by re-inserting the previous fields that are non-editable
                  if (!req.body.responses[fieldId]) {
                    req.body.responses[fieldId] = previousResponses[fieldId]
                  }
                }

                return Result.combine(
                  nonEditableFieldIdsWithResponses.map((fieldId) => {
                    const incomingResField = req.body.responses[fieldId]
                    const prevResField = previousResponses[fieldId]

                    if (
                      prevResField.fieldType === BasicField.ShortText ||
                      prevResField.fieldType === BasicField.LongText
                    ) {
                      // NOTE: LEGACY ISSUE
                      // Since text fields were saved without trimming prior to https://github.com/opengovsg/FormSG/pull/7937.
                      // Without this, isFieldResponseV3Equal fails since the prevResField was not trimmed,
                      // causing a mismatch between the newly trimmed incomingResField.
                      prevResField.answer = prevResField.answer.trim()
                    }

                    const resp = isFieldResponseV3Equal(
                      incomingResField,
                      prevResField,
                    )

                    if (!resp) {
                      return err(
                        new ProcessingError(
                          'Submitted response on a non-editable field which did not match previous response',
                        ),
                      )
                    }

                    /**
                     * Files are verified to have the same md5 hash, so we can safely assume that the files are the same.
                     * We should also ignore attachment names from submissions as handleDuplicatesInAttachments may rename files
                     */
                    if (
                      incomingResField.fieldType === BasicField.Attachment &&
                      prevResField.fieldType === BasicField.Attachment
                    ) {
                      incomingResField.answer.answer =
                        prevResField.answer.answer

                      incomingResField.answer.filename =
                        prevResField.answer.answer
                    }

                    return ok(undefined)
                  }),
                ).map(() => {
                  return previousResponses
                })
              })
              .andThen((previousResponses) => {
                // TODO: (FRM-1688) Set to block after sure that validation logic works as expected.
                validateMrfFieldResponses({
                  formId,
                  visibleFieldIds,
                  formFields: form_fields,
                  responses: req.body.responses,
                  previousResponses,
                })

                return ok(req.body.responses)
              }),
          )
        },
      )
      .map(() => next())
      .mapErr((error) => {
        logger.error({
          message: 'Validation failed on incoming multirespondent submission',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}

export const setCurrentWorkflowStep = async (
  req: ProcessedMultirespondentSubmissionHandlerRequest,
  res: Parameters<MultirespondentSubmissionMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const { formId, submissionId } = req.params
  if (!submissionId) {
    return errAsync(new InvalidSubmissionTypeError())
  }
  const logMeta = {
    action: 'setCurrentWorkflowStep',
    submissionId,
    formId,
    ...createReqMeta(req),
  }

  return (
    // Step 1: Retrieve the full form object.
    FormService.retrieveFullFormById(formId)
      //Step 2: Check whether form is archived.
      .andThen((form) => assertFormAvailable(form).map(() => form))
      // Step 3: Check whether form is multirespondent mode.
      .andThen(checkFormIsMultirespondent)
      // Step 4: Is multirespondent mode form, retrieve submission data.
      .andThen((form) =>
        getEncryptedSubmissionData(form.responseMode, formId, submissionId),
      )
      // Step 6: Retrieve presigned URLs for attachments.
      .map((submissionData) => {
        if (submissionData.submissionType !== SubmissionType.Multirespondent) {
          return errAsync(new InvalidSubmissionTypeError())
        }
        // Increment previous submission's workflow step by 1 to get workflow step of current submission
        req.body.workflowStep = submissionData.workflowStep + 1
        return next()
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
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

  const strippedAttachmentResponses: Record<
    string,
    ParsedClearFormFieldResponseV3 | StrippedAttachmentResponseV3
  > = {}

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

  const {
    encryptedContent,
    encryptedSubmissionSecretKey,
    submissionSecretKey,
    submissionPublicKey,
  } = formsgSdk.cryptoV3.encrypt(strippedAttachmentResponses, formPublicKey)

  const encryptedAttachments =
    await getEncryptedAttachmentsMapFromAttachmentsMap(
      attachmentsMap,
      submissionPublicKey,
      req.body.version,
    )

  req.formsg.encryptedPayload = {
    attachments: encryptedAttachments,
    responseMetadata: req.body.responseMetadata,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    submissionSecretKey,
    version: req.body.version,
    workflowStep: req.body.workflowStep,
    responses,
    /**
     * MRF Version: 1
     * ====================
     * - Encrypted payload does not contain attachment contents
     * - Encrypted Attachment now encrypted by mrf / submission Public Key instead of Form Public Key
     */
    mrfVersion: 1,
  }

  return next()
}
