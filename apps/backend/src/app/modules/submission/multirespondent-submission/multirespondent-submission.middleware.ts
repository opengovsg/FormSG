import type { FieldResponsesV4 } from '@opengovsg/formsg-sdk'
import {
  adaptV3ToV4,
  adaptV4ToV3,
  isFieldResponsesV4,
} from '@opengovsg/formsg-sdk/adapters'
import { celebrate, Joi, Segments } from 'celebrate'
import crypto from 'crypto'
import { NextFunction } from 'express'
import { featureFlags } from 'formsg-shared/constants'
import {
  BasicField,
  FieldResponsesV3,
  FormAuthType,
  FormDto,
  FormFieldDto,
  FormResponseMode,
  SubmissionType,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  IAttachmentInfo,
  IMultirespondentSubmissionSchema,
  IPopulatedMultirespondentForm,
} from 'src/types'

import {
  ParsedClearAttachmentFieldResponseV4,
  ParsedClearFormFieldResponsesV4,
  ParsedClearFormFieldResponseV4,
} from '../../../../types/api'
import {
  MultirespondentFormLoadedDto,
  SnapshottedFormDef,
} from '../../../../types/api/multirespondent_submission'
import { isDev } from '../../../config/config'
import { paymentConfig } from '../../../config/features/payment.config'
import formsgSdk from '../../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../../config/logger'
import {
  getLogicUnitPreventingSubmitV3,
  getVisibleFieldIdsV3,
} from '../../../utils/logic-adaptor'
import { createReqMeta } from '../../../utils/request'
import { isFieldResponseV4Equal } from '../../../utils/response-v4'
import { DatabaseError } from '../../core/core.errors'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import { JoiPaymentProduct } from '../../form/admin-form/admin-form.payments.constants'
import { assertFormAvailable } from '../../form/admin-form/admin-form.utils'
import * as FormService from '../../form/form.service'
import { MyInfoService } from '../../myinfo/myinfo.service'
import { extractMyInfoLoginJwt } from '../../myinfo/myinfo.util'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import { createNdiResponsesV4FromRecord } from '../../spcp/spcp.util'
import * as VerifiedContentService from '../../verified-content/verified-content.service'
import { VerifiedContentV3 } from '../../verified-content/verified-content.types'
import { getWebhookType } from '../../webhook/webhook.service'
import { FormsgReqBodyExistsError } from '../encrypt-submission/encrypt-submission.errors'
import { CreateFormsgAndRetrieveFormMiddlewareHandlerType } from '../encrypt-submission/encrypt-submission.types'
import {
  InvalidSubmissionTypeError,
  MissingSubmitterIdError,
  MrfWorkflowOverflowError,
  ProcessingError,
  StepTokenVerificationError,
  SubmissionEncryptionVerificationError,
  SubmissionNotFoundError,
} from '../submission.errors'
import * as SubmissionService from '../submission.service'
import {
  generateHashedSubmitterId,
  getEncryptedAttachmentsMapFromAttachmentsMap,
  isAttachmentResponseV4,
  mapRouteError,
  sendRouteError,
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
  StrippedAttachmentResponseV4,
} from './multirespondent-submission.types'
import {
  getMrfVersion,
  validateMrfFieldResponses,
} from './multirespondent-submission.utils'
import * as stepToken from './step-token'

const logger = createLoggerWithLabel(module)

const multirespondentSubmissionBodySchema = Joi.object({
  responses: Joi.object().pattern(
    /^[a-fA-F0-9]{24}$/,
    Joi.object({
      fieldType: Joi.string().valid(...Object.values(BasicField)),
      answer: Joi.required(),
      question: Joi.any().strip(),
      provenance: Joi.object().default({}),
      myInfo: Joi.object({ attr: Joi.string().required() }).optional(),
    }),
  ),
  responseMetadata: Joi.object({
    responseTimeMs: Joi.number(),
    numVisibleFields: Joi.number(),
  }),
  version: Joi.number().required(),
  respondentEmails: Joi.array().items(Joi.string()),
})

// Payment fields are only accepted on submission creation: a payment-enabled
// form is necessarily zero-step, so there are no later steps to update.
const submitMultirespondentSubmissionBodySchema =
  multirespondentSubmissionBodySchema.keys({
    paymentProducts: Joi.array().items(
      Joi.object().keys({
        data: JoiPaymentProduct.required(),
        selected: Joi.boolean(),
        quantity: Joi.number().integer().positive().required(),
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
  })

export const validateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: submitMultirespondentSubmissionBodySchema,
})

const multirespondentSubmissionKeySchema = Joi.object({
  submissionSecretKey: Joi.string().required(),
  // RATIONALE: step token is optional for backwards compatibility with in-flight submissions
  // and allow `mrf-step-write-token` gb flag to be off.
  stepToken: Joi.string().optional(),
})

const updateMultirespondentSubmissionBodySchema =
  multirespondentSubmissionBodySchema.concat(multirespondentSubmissionKeySchema)

export const validateUpdateMultirespondentSubmissionParams = celebrate({
  [Segments.BODY]: updateMultirespondentSubmissionBodySchema,
})

export const validateMultirespondentRemindBody = celebrate({
  [Segments.BODY]: multirespondentSubmissionKeySchema,
})

const retrieveMultirespondentSubmissionIfExists = (
  submissionId?: string,
): ResultAsync<
  IMultirespondentSubmissionSchema | undefined,
  DatabaseError | SubmissionNotFoundError
> => {
  if (submissionId) {
    return getMultirespondentSubmission(submissionId)
  }
  return okAsync(undefined)
}

const getSnapshottedFormDef = (
  mrfSubmission: IMultirespondentSubmissionSchema,
  currentFormDef: IPopulatedMultirespondentForm,
): SnapshottedFormDef => ({
  _id: mrfSubmission.form.toString(),
  title: currentFormDef.title,
  form_fields: mrfSubmission.form_fields,
  form_logics: mrfSubmission.form_logics,
  workflow: mrfSubmission.workflow,
  webhook: currentFormDef.webhook,
  admin: currentFormDef.admin,
  emails: currentFormDef.emails,
  stepOneEmailNotificationFieldId:
    currentFormDef.stepOneEmailNotificationFieldId,
  stepsToNotify: currentFormDef.stepsToNotify,
  hasStatusTracker: currentFormDef.hasStatusTracker,
})

/**
 * Creates formsg namespace in req.body and populates it with featureFlags, formDef and encryptedFormDef.
 */
export const createFormsgAndRetrieveForm = (
  req: CreateFormsgAndRetrieveFormMiddlewareHandlerRequest,
  res: Parameters<CreateFormsgAndRetrieveFormMiddlewareHandlerType>[1],
  next: NextFunction,
) => {
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'createFormsgAndRetrieveForm',
    ...createReqMeta(req),
    formId,
  }

  // Step 1: Create formsg namespace in req.body
  if (req.formsg) return res.send(new FormsgReqBodyExistsError())
  const formsg = {
    responseMode: FormResponseMode.Multirespondent,
    respondentEmails: req.body.respondentEmails, // retrive and include respondent copy emails into formsg
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
    .andThen((featureFlags) => {
      // Step 2b: Set formsg.featureFlags
      formsg.featureFlags = featureFlags
      // Step 3: Retrieve mrf submission if exists
      return retrieveMultirespondentSubmissionIfExists(submissionId)
        .mapErr((error) => {
          logger.error({
            message: 'Error occurred whilst retrieving mrf submission',
            meta: logMeta,
            error,
          })
          return sendRouteError(res, mapRouteError(error))
        })
        .map((mrfSubmission) => {
          formsg.mrfSubmission = mrfSubmission
          return mrfSubmission
        })
        .andThen((mrfSubmission) => {
          // Step 4: Retrieve latest form definition
          return FormService.retrieveFullFormById(formId)
            .mapErr((error) => {
              logger.warn({
                message: 'Failed to retrieve form from database',
                meta: logMeta,
                error,
              })
              return sendRouteError(res, mapRouteError(error))
            })
            .andThen((latestFormDef) => {
              // Step 4a: Check form is multirespondent form
              return checkFormIsMultirespondent(latestFormDef).mapErr(
                (error) => {
                  logger.error({
                    message:
                      'Trying to submit non-multirespondent submission on multirespondent submission endpoint',
                    meta: logMeta,
                    error,
                  })
                  return sendRouteError(res, mapRouteError(error))
                },
              )
            })
            .map((latestMrfFormDef) => {
              // Step 4b: Set formsg.latestFormDef
              formsg.formDef = latestMrfFormDef
              // Step 4c: Set formsg.snapshottedFormDef if mrfSubmission exists
              if (mrfSubmission) {
                formsg.snapshottedFormDef = getSnapshottedFormDef(
                  mrfSubmission,
                  latestMrfFormDef,
                )
              }
            })
            .map(async () => {
              const formDef = formsg.formDef
              // Step 5: Check that the form def has a public key
              if (!formDef.publicKey) {
                const message = 'Form does not have a public key'
                logger.warn({ message, meta: logMeta })
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                  message,
                })
              }

              // Step 6: Set req.formsg
              req.formsg = formsg

              // Step 7: Inject growthbook attributes to selectively whitelist.
              const existingAttributes = req.growthbook?.getAttributes() ?? {}
              await req.growthbook?.setAttributes({
                ...existingAttributes,
                formId,
                adminEmail: formsg.formDef.admin.email,
              })

              return next()
            })
        })
    })
}

type IdTaggedParsedClearAttachmentResponseV4 =
  ParsedClearAttachmentFieldResponseV4 & { id: string }

/**
 * Asynchronous virus scanning for storage submissions v2.1+. This is used for non-dev environments.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const asyncVirusScanning = (
  responses: IdTaggedParsedClearAttachmentResponseV4[],
  formId: string,
): ResultAsync<
  IdTaggedParsedClearAttachmentResponseV4,
  SubmissionService.TriggerGuardDutyScanThenDownloadCleanFileChainError
>[] => {
  return responses.map((response) => {
    // we'll invoke both lambdas and one of them will be in-shadow in order
    // for us to compare the reliability of the services

    // use guardduty scan results
    const { id, ...attachmentResponse } = response
    return SubmissionService.triggerGuardDutyScanThenDownloadCleanFileChainV4(
      attachmentResponse,
      formId,
    ).map(
      (scannedResponse) =>
        ({
          ...scannedResponse,
          id,
        }) as IdTaggedParsedClearAttachmentResponseV4,
    )
  })
}

/**
 * Synchronous virus scanning for storage submissions v2.1+. This is used for dev environment.
 * @param responses all responses in the storage submissions v2.1+ request.
 * @returns all responses with clean attachments and their filename populated for any attachment fields.
 */
const devModeSyncVirusScanning = async (
  responses: IdTaggedParsedClearAttachmentResponseV4[],
  formId: string,
): Promise<
  Result<
    IdTaggedParsedClearAttachmentResponseV4,
    SubmissionService.TriggerGuardDutyScanThenDownloadCleanFileChainError
  >[]
> => {
  const results = []
  for (const response of responses) {
    // await to pause for...of loop until the virus scanning and downloading of clean file is completed.
    const { id, ...attachmentResponse } = response
    const scannedResult =
      await SubmissionService.triggerGuardDutyScanThenDownloadCleanFileChainV4(
        attachmentResponse,
        formId,
      )
    if (scannedResult.isErr()) {
      results.push(err(scannedResult.error))
      break
    }
    results.push(
      ok({
        ...scannedResult.value,
        id,
      } as IdTaggedParsedClearAttachmentResponseV4),
    )
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
  const attachmentResponsesToRetrieve: IdTaggedParsedClearAttachmentResponseV4[] =
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
        return {
          id,
          ...response,
        } as unknown as IdTaggedParsedClearAttachmentResponseV4
      })
      .filter(
        (value): value is IdTaggedParsedClearAttachmentResponseV4 =>
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
          await devModeSyncVirusScanning(
            attachmentResponsesToRetrieve,
            req.formsg.formDef._id.toString(),
          ),
        )
      : await ResultAsync.combine(
          asyncVirusScanning(
            attachmentResponsesToRetrieve,
            req.formsg.formDef._id.toString(),
          ),
        )

  if (scanAndRetrieveFilesResult.isErr()) {
    logger.error({
      message: 'Error scanning and downloading clean attachments',
      meta: logMeta,
      error: scanAndRetrieveFilesResult.error,
    })

    return sendRouteError(res, mapRouteError(scanAndRetrieveFilesResult.error))
  }

  logger.info({
    message: 'Successfully scanned and downloaded clean attachments',
    meta: logMeta,
  })

  // Step 3: Update responses with new values.
  for (const idTaggedAttachmentResponse of scanAndRetrieveFilesResult.value) {
    const { id, ...attachmentResponseRaw } = idTaggedAttachmentResponse
    const attachmentResponse =
      attachmentResponseRaw as ParsedClearAttachmentFieldResponseV4
    // TODO: FRM-1839 Skip scanning if attachment has already been scanned
    attachmentResponse.answer.hasBeenScanned = true
    // Store the md5 hash in the DB as well for comparison later on.
    attachmentResponse.answer.md5Hash = crypto
      .createHash('md5')
      .update(Buffer.from(attachmentResponse.answer.content))
      .digest()
      .toString()
    req.body.responses[id] =
      attachmentResponse as unknown as FieldResponsesV4[string]
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
  const { mrfSubmission } = req.formsg

  const logMeta = {
    action: 'validateMultirespondentSubmission',
    submissionId,
    formId,
    ...createReqMeta(req),
  }

  return (
    // Step 0: Prepare by retrieving relevant reference data
    ok(mrfSubmission)
      // Step 0a: Verify write permissions by verifying step bearer token if exists
      .andThen((mrfSubmission) => {
        const isStepWriteTokenEnabled =
          req.growthbook?.isOn(featureFlags.mrfStepWriteToken) ?? false
        if (isStepWriteTokenEnabled && mrfSubmission?.stepTokenHash) {
          const presentedToken = req.body.stepToken
          if (
            !presentedToken ||
            !stepToken.verify(presentedToken, mrfSubmission.stepTokenHash)
          ) {
            return err(new StepTokenVerificationError())
          }
        }
        return ok(mrfSubmission)
      })
      .andThen((mrfSubmission) =>
        // Step 0b: If its an existing submission, use the reference data from
        // the submission rather than the form
        mrfSubmission
          ? ok({
              previousSubmission: {
                encryptedContent: mrfSubmission.encryptedContent,
                version: mrfSubmission.version,
                mrfVersion: mrfSubmission.mrfVersion,
              },
              workflowStep: mrfSubmission.workflowStep + 1,
              workflow: mrfSubmission.workflow,
              form_fields: mrfSubmission.form_fields,
              form_logics: mrfSubmission.form_logics,
            })
          : ok({
              previousSubmission: undefined,
              workflowStep: 0,
              workflow: req.formsg.formDef.workflow,
              form_fields: req.formsg.formDef.form_fields.map(
                (ff_schema) => ff_schema.toObject() as FormFieldDto,
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
          // Step 0c: Determine editable fields based on the workflow step, if it exists.
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

          // Convert V4 responses to V3 for logic evaluation (logic engine uses V3 format)
          const responsesV3ForLogic = adaptV4ToV3(
            req.body.responses as FieldResponsesV4,
          ) as unknown as FieldResponsesV3

          // Step 0c: Get visible fields based on evaluation of logic
          return getVisibleFieldIdsV3(
            responsesV3ForLogic,
            formPropertiesForLogicComputation,
          ).andThen((visibleFieldIds) =>
            // Step 1: Check prevent submission logic
            getLogicUnitPreventingSubmitV3(
              responsesV3ForLogic,
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

                /**
                 * Since the incoming client responses are in V4,
                 * if previous submission was encrypted in V3 format, convert to V4
                 * to facilitate comparison. Comparison (isFieldResponseV4Equal)
                 * only inspects fieldType + answer, so we skip the formFields
                 * meta — question text and myInfo on the adapted response are
                 * unused; downstream consumers source both from the form field.
                 */
                const previousResponses = (() => {
                  const responses = previousSubmissionDecryptedContent.responses
                  if (
                    !isFieldResponsesV4(responses as Record<string, unknown>)
                  ) {
                    // Response is in V3 format, adapt to V4
                    return adaptV3ToV4(responses, {
                      formFields: {},
                      provenance: {},
                    }) as ParsedClearFormFieldResponsesV4
                  }
                  // Response is in V4 format, return as is
                  return responses as unknown as ParsedClearFormFieldResponsesV4
                })()

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

                    const resp = isFieldResponseV4Equal(
                      incomingResField as FieldResponsesV4[string],
                      prevResField as FieldResponsesV4[string],
                    )

                    if (!resp) {
                      logger.info({
                        message:
                          'Submitted response on a non-editable field which did not match previous response',
                        meta: {
                          ...logMeta,
                          incomingResFieldType: incomingResField.fieldType,
                          prevResFieldType: prevResField.fieldType,
                        },
                      })

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
                      ;(incomingResField.answer as { value: string }).value = (
                        prevResField.answer as { value: string }
                      ).value
                    }

                    return ok(undefined)
                  }),
                ).map(() => {
                  return previousResponses
                })
              })
              .andThen((previousResponses) => {
                return validateMrfFieldResponses({
                  formId,
                  visibleFieldIds,
                  formFields: form_fields,
                  responses: req.body.responses,
                  previousResponses,
                })
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

        return sendRouteError(res, mapRouteError(error))
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
        SubmissionService.getEncryptedSubmissionData(
          form.responseMode,
          formId,
          submissionId,
        ),
      )
      // Step 6: Retrieve presigned URLs for attachments.
      .andThen((submissionData) => {
        if (submissionData.submissionType !== SubmissionType.Multirespondent) {
          return errAsync(new InvalidSubmissionTypeError())
        }
        // Increment previous submission's workflow step by 1 to get workflow step of current submission
        req.body.workflowStep = submissionData.workflowStep + 1
        // If the workflow step is greater than the submission's snapshot workflow length, this is an overflow.
        if (req.body.workflowStep >= submissionData.workflow.length) {
          return errAsync(
            new MrfWorkflowOverflowError(
              'Workflow step cannot be greater than the submission workflow length',
            ),
          )
        }
        return okAsync(undefined)
      })
      .map(() => next())
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: logMeta,
          error,
        })

        return sendRouteError(res, mapRouteError(error))
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
    ParsedClearFormFieldResponseV4 | StrippedAttachmentResponseV4
  > = {}

  const unencryptedAttachments: IAttachmentInfo[] = []

  // Populate attachment map
  for (const id of Object.keys(responses)) {
    const response = responses[id]
    if (!isAttachmentResponseV4(response)) {
      strippedAttachmentResponses[id] = response
      continue
    }
    attachmentsMap[id] = response.answer.content
    const attachmentRes = response as ParsedClearAttachmentFieldResponseV4
    const strippedAttachment = {
      ...attachmentRes,
      answer: {
        value: attachmentRes.answer.value,
        hasBeenScanned: attachmentRes.answer.hasBeenScanned,
        md5Hash: attachmentRes.answer.md5Hash,
        filename: undefined,
        content: undefined,
      },
    } as unknown as StrippedAttachmentResponseV4
    strippedAttachmentResponses[id] = strippedAttachment

    // collect unencrypted attachments to include in email notifications
    unencryptedAttachments.push({
      filename: response.answer.filename,
      content: response.answer.content,
      fieldId: id,
    })
  }

  if (req.formsg) {
    req.formsg.unencryptedAttachments = unencryptedAttachments
  }

  const isStepWriteTokenEnabled =
    req.growthbook?.isOn(featureFlags.mrfStepWriteToken) ?? false

  const webhookUrl = formDef.webhook?.url
  const mrfVersion = getMrfVersion({
    webhookType: webhookUrl ? getWebhookType(webhookUrl) : undefined,
    isStepWriteTokenEnabled,
  })
  const useV4Encryption = mrfVersion === 2

  const responsesToEncrypt = useV4Encryption
    ? strippedAttachmentResponses
    : adaptV4ToV3(strippedAttachmentResponses as unknown as FieldResponsesV4)

  const {
    encryptedContent,
    encryptedSubmissionSecretKey,
    submissionSecretKey,
    submissionPublicKey,
  } = formsgSdk.cryptoV3.encrypt(responsesToEncrypt, formPublicKey)

  // Verify the encrypted content can be decrypted using the generated submission secret key before saving
  const decryptionVerification = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    submissionSecretKey,
    { encryptedContent, version: req.body.version },
  )
  if (!decryptionVerification) {
    const error = new SubmissionEncryptionVerificationError()
    logger.error({
      message: error.message,
      meta: {
        action: 'encryptSubmission',
        formId: req.params.formId,
        submissionId: req.params.submissionId,
        version: req.body.version,
        mrfVersion,
        ...createReqMeta(req),
      },
      error,
    })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'An error occurred while processing your submission',
    })
  }

  const encryptedAttachments =
    await getEncryptedAttachmentsMapFromAttachmentsMap(
      attachmentsMap,
      submissionPublicKey,
      req.body.version,
    )

  let mintedStepToken:
    | {
        stepToken: string
        stepTokenHash: string
        encryptedStepToken: string
      }
    | undefined
  if (isStepWriteTokenEnabled) {
    const rawStepToken = stepToken.generate()
    mintedStepToken = {
      stepToken: rawStepToken,
      stepTokenHash: stepToken.hash(rawStepToken),
      encryptedStepToken: stepToken.wrap(rawStepToken, formPublicKey),
    }
  }

  req.formsg.encryptedPayload = {
    attachments: encryptedAttachments,
    responseMetadata: req.body.responseMetadata,
    submissionPublicKey,
    encryptedSubmissionSecretKey,
    encryptedContent,
    submissionSecretKey,
    version: req.body.version,
    workflowStep: req.body.workflowStep,
    responses: responses as FieldResponsesV4,
    mrfVersion,
    ...mintedStepToken,
    paymentReceiptEmail: req.body.paymentReceiptEmail,
    paymentProducts: req.body.paymentProducts,
    payments: req.body.payments,
  }

  return next()
}

/**
 * Add and encrypt Ndi responses as verifiedContent, and add unencrypted Ndi responses to responses for email responses
 */
export const handleNdiResponses = async (
  req: ProcessedMultirespondentSubmissionHandlerRequest,
  res: Parameters<ProcessedMultirespondentSubmissionHandlerType>[1],
  next: NextFunction,
) => {
  const formDef = req.formsg.formDef
  const { formId } = req.params
  const { authType } = formDef
  const { submissionPublicKey } = req.formsg.encryptedPayload
  const stepNumber: number = req.body.workflowStep
    ? req.body.workflowStep + 1
    : 1
  let responses = req.formsg.encryptedPayload.responses // to add NDI data to responses (used for email payload downstream)

  let verifiedContent: VerifiedContentV3 | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ndiResponses: Record<string, any> = {}

  const logMeta = {
    action: 'handleNdiResponses',
    ...createReqMeta(req),
    formId,
  }

  const isSingpassAuthType =
    authType === FormAuthType.CP || authType === FormAuthType.MyInfo

  // 1. Handle Ndi data for current step
  if (
    isSingpassAuthType &&
    stepNumber === 1 // TODO: update to handle when subsequent steps are Singpass-enabled
  ) {
    let userName
    let userInfo
    let jwtPayloadResult
    switch (authType) {
      case FormAuthType.CP: {
        const oidcService = getOidcService(FormAuthType.CP)
        jwtPayloadResult = await oidcService
          .extractJwt(req.cookies)
          .asyncAndThen((jwt) => oidcService.extractJwtPayload(jwt))

        if (jwtPayloadResult.isOk()) {
          userName = jwtPayloadResult.value.userName
          userInfo = jwtPayloadResult.value.userInfo
        }
        break
      }
      case FormAuthType.MyInfo: {
        jwtPayloadResult = await extractMyInfoLoginJwt(req.cookies, authType)
          .andThen(MyInfoService.verifyLoginJwt)
          .map(({ uinFin }) => {
            return uinFin
          })

        if (jwtPayloadResult.isOk()) {
          userName = jwtPayloadResult.value
        }
        break
      }
      default:
        logger.error({
          message: `AuthType: ${authType} unsupported for handling NdiResponses (supported: [MyInfo, CP])`,
          meta: logMeta,
        })
    }

    if (jwtPayloadResult?.isErr()) {
      logger.error({
        message: `Failed to verify ${authType} JWT with auth client`,
        meta: logMeta,
        error: jwtPayloadResult.error,
      })
      return sendRouteError(res, mapRouteError(jwtPayloadResult.error), {
        spcpSubmissionFailure: true,
      })
    } else {
      const verifiedContentResult = VerifiedContentService.getVerifiedContent({
        type: authType,
        data: {
          uinFin: userName,
          userInfo,
          stepNumber: stepNumber,
        },
      })

      if (verifiedContentResult.isErr()) {
        const { error } = verifiedContentResult
        logger.error({
          message: 'Unable to get verified content',
          meta: logMeta,
          error,
        })

        return sendRouteError(res, {
          statusCode: StatusCodes.BAD_REQUEST,
          errorMessage: 'Invalid data was found. Please submit again.',
          errorMessageKey:
            'features.publicForm.backendErrors.submission.validation.invalidData',
        })
      }

      const submitterId = userName?.toUpperCase()
      if (!submitterId) {
        const missingSubmitterIdError = new MissingSubmitterIdError()
        return sendRouteError(res, mapRouteError(missingSubmitterIdError))
      }
      const hashedSubmitterId = generateHashedSubmitterId(submitterId, formId)
      req.formsg.encryptedPayload.hashedSubmitterId = hashedSubmitterId
      req.formsg.encryptedPayload.submitterId = submitterId
      verifiedContent = verifiedContentResult.value
    }
  }

  if (formDef.isSubmitterIdCollectionEnabled) {
    ndiResponses = {
      ...verifiedContent,
    }
  }

  // 2. Handle Ndi data for previous steps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mrfSubmission = req.formsg.mrfSubmission
  const prevSubmissionSecretKey = req.body.submissionSecretKey

  if (mrfSubmission?.verifiedContent && prevSubmissionSecretKey) {
    const prevDecryptedSubmission = formsgSdk.cryptoV3.decryptFromSubmissionKey(
      prevSubmissionSecretKey,
      {
        encryptedContent: mrfSubmission.encryptedContent,
        verifiedContent: mrfSubmission.verifiedContent,
        version: mrfSubmission.version,
      },
    )

    if (prevDecryptedSubmission?.verified) {
      ndiResponses = { ...prevDecryptedSubmission.verified, ...ndiResponses }
    } else {
      logger.error({
        message: 'Unable to get verified content',
        meta: logMeta,
      })

      return sendRouteError(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Invalid data was found. Please submit again.',
        errorMessageKey:
          'features.publicForm.backendErrors.submission.validation.invalidData',
      })
    }
  }

  // 3. Add collected Ndi data to responses for email payload
  const emailNdiResponses = createNdiResponsesV4FromRecord(ndiResponses)
  responses = { ...responses, ...emailNdiResponses }
  req.formsg.encryptedPayload.responses = responses

  // 4. Encrypt Ndi data with new submissionKey
  if (Object.keys(ndiResponses).length !== 0) {
    const encryptVerifiedContentResult =
      VerifiedContentService.encryptVerifiedContent({
        verifiedContent: ndiResponses,
        formPublicKey: submissionPublicKey,
      })

    if (encryptVerifiedContentResult.isErr()) {
      const { error } = encryptVerifiedContentResult
      logger.error({
        message: 'Unable to encrypt verified content',
        meta: logMeta,
        error,
      })

      return sendRouteError(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        errorMessage: 'Invalid data was found. Please submit again.',
        errorMessageKey:
          'features.publicForm.backendErrors.submission.validation.invalidData',
      })
    } else {
      req.formsg.encryptedPayload.verifiedContent =
        encryptVerifiedContentResult.value
    }
  }

  return next()
}
