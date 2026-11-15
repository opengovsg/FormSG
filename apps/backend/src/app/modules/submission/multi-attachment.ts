import { MAX_ATTACHMENTS_PER_FIELD } from 'formsg-shared/constants'
import { BasicField } from 'formsg-shared/types'
import { NON_RESPONSE_FIELD_SET } from 'formsg-shared/utils/field'
import * as FileValidation from 'formsg-shared/utils/file-validation'
import {
  findClashingFileName,
  getMultiAttachmentZipName,
} from 'formsg-shared/utils/multi-attachment'
import omit from 'lodash/omit'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearFormFieldResponse,
} from '../../../types/api'
import { createLoggerWithLabel } from '../../config/logger'

import { InvalidMultiAttachmentError } from './submission.errors'
import { isAttachmentResponse } from './submission.utils'

const logger = createLoggerWithLabel(module)

type FormWithFields = {
  form_fields: {
    _id?: unknown
    fieldType: BasicField
    allowMultiple?: boolean
  }[]
}

const getMultiAttachmentFieldIds = ({ form_fields }: FormWithFields) =>
  new Set(
    form_fields
      .filter(
        (field) =>
          field.fieldType === BasicField.Attachment && field.allowMultiple,
      )
      .map(({ _id }) => String(_id)),
  )

/**
 * Numbers each multi-file attachment field by its place among `items`,
 * skipping fields that take no answer, as the responses page numbers
 * questions.
 */
const getMultiAttachmentQuestionNumbers = (
  form: FormWithFields,
  items: { _id?: unknown; fieldType: BasicField }[],
): Map<string, number> => {
  const multiAttachmentFieldIds = getMultiAttachmentFieldIds(form)
  const questionNumbers = new Map<string, number>()
  let questionNumber = 0
  for (const { _id, fieldType } of items) {
    if (NON_RESPONSE_FIELD_SET.has(fieldType)) continue
    questionNumber += 1
    if (multiAttachmentFieldIds.has(String(_id))) {
      questionNumbers.set(String(_id), questionNumber)
    }
  }
  return questionNumbers
}

export const getMultiAttachmentFilenames = (
  content: Buffer,
): ResultAsync<string[], InvalidMultiAttachmentError> => {
  const logMeta = { action: 'getMultiAttachmentFilenames' }
  const toError = (error: unknown) => {
    logger.error({
      message: 'Error reading multi-file attachment zip',
      meta: logMeta,
      error,
    })
    return new InvalidMultiAttachmentError()
  }
  const reject = (meta: Record<string, unknown>) => {
    logger.error({
      message: 'Invalid multi-file attachment zip',
      meta: { ...logMeta, ...meta },
    })
    return errAsync(new InvalidMultiAttachmentError())
  }
  return ResultAsync.fromPromise(FileValidation.inspectZip(content), toError)
    .andThen(
      ({
        entryNames,
        entryCount,
        isUncompressed,
        hasExtraBytes,
        getInvalidExtensions,
      }) => {
        // A zip separates folders with `/` only, so a `\` is part of a file name
        const hasFolders = entryNames.some((name) => name.includes('/'))
        const clashingName = findClashingFileName(entryNames)
        if (
          hasFolders ||
          !isUncompressed ||
          hasExtraBytes ||
          clashingName !== undefined ||
          entryCount !== entryNames.length ||
          entryNames.length === 0 ||
          entryNames.length > MAX_ATTACHMENTS_PER_FIELD
        ) {
          return reject({
            hasFolders,
            isUncompressed,
            hasExtraBytes,
            clashingName,
            entryCount,
            fileCount: entryNames.length,
          })
        }
        return ResultAsync.fromPromise(getInvalidExtensions(), toError).map(
          (invalidExtensions) => ({ entryNames, invalidExtensions }),
        )
      },
    )
    .andThen(({ entryNames, invalidExtensions }) =>
      invalidExtensions.length > 0
        ? reject({ invalidExtensions })
        : okAsync(entryNames),
    )
}

/**
 * Lists the files in each multi-file answer's zip as `answerArray`. Any other
 * attachment loses an `answerArray` the client sent. The zip is named later,
 * by nameMultiAttachmentResponses, once the stored responses are known.
 */
export const readMultiAttachmentResponses = (
  form: FormWithFields,
  responses: ParsedClearFormFieldResponse[],
): ResultAsync<ParsedClearFormFieldResponse[], InvalidMultiAttachmentError> => {
  const multiAttachmentFieldIds = getMultiAttachmentFieldIds(form)
  return ResultAsync.combine(
    responses.map(
      (
        response,
      ): ResultAsync<
        ParsedClearFormFieldResponse,
        InvalidMultiAttachmentError
      > => {
        if (response.fieldType !== BasicField.Attachment) {
          return okAsync(response)
        }
        if (
          !multiAttachmentFieldIds.has(response._id) ||
          !isAttachmentResponse(response)
        ) {
          return okAsync(omit(response, 'answerArray'))
        }
        return getMultiAttachmentFilenames(response.content).map(
          (filenames) => ({ ...response, answerArray: filenames }),
        )
      },
    ),
  )
}

/**
 * Names each multi-file answer `Question <n>.zip`, counting questions down
 * the responses as stored, as the responses page numbers them.
 */
export const nameMultiAttachmentResponses = <
  T extends ParsedClearFormFieldResponse,
>(
  form: FormWithFields,
  responses: T[],
): T[] => {
  const questionNumbers = getMultiAttachmentQuestionNumbers(form, responses)
  return responses.map((response) => {
    const questionNumber = questionNumbers.get(response._id)
    if (questionNumber === undefined || !isAttachmentResponse(response)) {
      return response
    }
    const zipName = getMultiAttachmentZipName(questionNumber)
    return { ...response, answer: zipName, filename: zipName }
  })
}

/**
 * Names each multi-file answer `Question <n>.zip`, numbered by the form's
 * field order as the responses page lists MRF answers, and lists the files in
 * its zip as `filenames`. Any other attachment loses `filenames`.
 */
export const nameMultiAttachmentAnswersV4 = <
  T extends { id: string; answer: ParsedClearAttachmentAnswerV4 },
>(
  form: FormWithFields,
  responses: T[],
): ResultAsync<T[], InvalidMultiAttachmentError> => {
  const questionNumbers = getMultiAttachmentQuestionNumbers(
    form,
    form.form_fields,
  )
  return ResultAsync.combine(
    responses.map((response): ResultAsync<T, InvalidMultiAttachmentError> => {
      const questionNumber = questionNumbers.get(response.id)
      if (questionNumber === undefined) {
        return okAsync({
          ...response,
          answer: omit(response.answer, 'filenames'),
        })
      }
      const zipName = getMultiAttachmentZipName(questionNumber)
      return getMultiAttachmentFilenames(response.answer.content).map(
        (filenames) => ({
          ...response,
          answer: {
            ...response.answer,
            value: zipName,
            filename: zipName,
            filenames,
          },
        }),
      )
    }),
  )
}
