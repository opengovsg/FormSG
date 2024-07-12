import crypto from 'crypto'
import mongoose from 'mongoose'
import { err, ok, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  ResponseMetadata,
  SubmissionType,
} from '../../../../../shared/types'
import {
  EmailAdminDataField,
  IAttachmentInfo,
  IEmailSubmissionSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
} from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { getEmailSubmissionModel } from '../../../models/submission.server.model'
import { ApplicationError, DatabaseError } from '../../core/core.errors'
import { isEmailModeForm, transformEmails } from '../../form/form.utils'
import { ResponseModeError } from '../submission.errors'
import { ProcessedFieldResponse } from '../submission.types'

import {
  DIGEST_TYPE,
  HASH_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
} from './email-submission.constants'
import { SubmissionHashError } from './email-submission.errors'
import {
  EmailSubmissionContent,
  SubmissionHash,
} from './email-submission.types'
import { concatAttachmentsAndResponses } from './email-submission.util'

const EmailSubmissionModel = getEmailSubmissionModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Creates hash of a submission
 * @param formData Responses sent to admin
 * @param attachments Attachments in response
 * @returns okAsync(hash and salt) if hashing was successful
 * @returns errAsync(SubmissionHashError) if error occurred while hashing
 */
export const hashSubmission = (
  formData: EmailAdminDataField[],
  attachments: IAttachmentInfo[],
): ResultAsync<SubmissionHash, SubmissionHashError> => {
  const baseString = concatAttachmentsAndResponses(formData, attachments)
  const salt = crypto.randomBytes(SALT_LENGTH).toString('base64')
  const hashPromise = new Promise<SubmissionHash>((resolve, reject) => {
    crypto.pbkdf2(
      baseString,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      DIGEST_TYPE,
      (err, hash) => {
        if (err) {
          return reject(err)
        }
        return resolve({
          hash: hash.toString('base64'),
          salt,
        })
      },
    )
  })
  return ResultAsync.fromPromise(hashPromise, (error) => {
    logger.error({
      message: 'Error while hashing submission',
      meta: {
        action: 'hashSubmission',
      },
      error,
    })
    return new SubmissionHashError()
  })
}

/**
 * Saves an email submission to the database.
 * @param form
 * @param submissionHash Hash of submission and salt
 * @returns okAsync(the saved document) if submission was saved successfully
 * @returns errAsync(DatabaseError) if submission failed to be saved
 */
export const saveSubmissionMetadata = (
  form: IPopulatedEmailForm,
  submissionHash: SubmissionHash,
  responseMetadata?: ResponseMetadata,
  submitterId?: string,
): ResultAsync<IEmailSubmissionSchema | null, DatabaseError> => {
  const params: EmailSubmissionContent = {
    form: form._id,
    authType: form.authType,
    submitterId,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    recipientEmails: transformEmails(form.emails),
    responseHash: submissionHash.hash,
    responseSalt: submissionHash.salt,
    submissionType: SubmissionType.Email,
    responseMetadata,
  }

  const saveEmailSubmissionMetadataBasedOnFormSettings =
    async (): Promise<IEmailSubmissionSchema | null> => {
      if (form.isSingleSubmission && form.authType !== FormAuthType.NIL) {
        if (!submitterId) {
          return Promise.reject(
            new ApplicationError(
              'submitterId must be defined for isSingleSubmission enabled form',
            ),
          )
        }
        return EmailSubmissionModel.saveIfSubmitterIdIsUnique(
          form._id,
          submitterId,
          params,
        )
      }
      return EmailSubmissionModel.create(params)
    }

  return ResultAsync.fromPromise(
    saveEmailSubmissionMetadataBasedOnFormSettings(),
    (error) => {
      logger.error({
        message: 'Error while saving submission to database',
        meta: {
          action: 'saveSubmissionMetadata',
          formId: form._id,
        },
        error,
      })
      return new DatabaseError('Error while saving submission to database')
    },
  )
}

/**
 * Extracts an array of answers to email fields
 * @param parsedResponses All form responses
 * @returns an array of all email field responses
 */
export const extractEmailAnswers = (
  parsedResponses: ProcessedFieldResponse[],
): string[] => {
  return parsedResponses.reduce<string[]>((acc, response) => {
    if (response.fieldType === BasicField.Email && response.answer) {
      acc.push(response.answer)
    }
    return acc
  }, [])
}

export const checkFormIsEmailMode = (
  form: IPopulatedForm,
): Result<IPopulatedEmailForm, ResponseModeError> => {
  if (isEmailModeForm(form)) {
    return ok(form)
  }
  return err(new ResponseModeError(FormResponseMode.Email, form.responseMode))
}

/**
 * Creates an email submission without saving it to the database.
 * @param form Form document
 * @param responseHash Hash of response
 * @param responseSalt Salt used to hash response
 * @returns Submission document which has not been saved to database
 */
export const createEmailSubmissionWithoutSave = (
  form: IPopulatedEmailForm,
  responseHash: string,
  responseSalt: string,
): IEmailSubmissionSchema => {
  return new EmailSubmissionModel({
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    recipientEmails: transformEmails(form.emails),
    responseHash,
    responseSalt,
  })
}
