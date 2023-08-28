import { ok, Result } from 'neverthrow'

import { FieldResponse, IPopulatedEncryptedForm } from '../../../../types'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { IncomingSubmission } from '../IncomingSubmission.class'
import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../submission.errors'
import { FilteredResponse, ValidatedFieldMap } from '../submission.types'
import { getFilteredResponses } from '../submission.utils'

export default class IncomingEncryptSubmission extends IncomingSubmission {
  public readonly encryptedContent: string
  private constructor({
    responses,
    fieldMap,
    form,
    encryptedContent,
  }: {
    responses: FilteredResponse[]
    fieldMap: ValidatedFieldMap
    form: IPopulatedEncryptedForm
    encryptedContent: string
  }) {
    super(responses, form, fieldMap)
    this.encryptedContent = encryptedContent
  }

  static init(
    form: IPopulatedEncryptedForm,
    responses: FieldResponse[],
    encryptedContent: string,
  ): Result<
    IncomingEncryptSubmission,
    ProcessingError | ConflictError | ValidateFieldError[]
  > {
    return checkIsEncryptedEncoding(encryptedContent)
      .andThen(() => {
        if (form.encryptionBoundaryShift)
          return ok(responses as FilteredResponse[])
        else return getFilteredResponses(form, responses)
      })
      .andThen((filteredResponses) =>
        this.getFieldMap(form, filteredResponses).map((fieldMap) => ({
          responses: filteredResponses,
          fieldMap,
          form,
          encryptedContent,
        })),
      )
      .map((metadata) => new IncomingEncryptSubmission(metadata))
      .andThen((incomingEncryptSubmission) =>
        incomingEncryptSubmission
          .validate()
          .map(() => incomingEncryptSubmission),
      )
  }

  responseVisibilityPredicate(response: FieldResponse): boolean {
    return (
      ('answer' in response &&
        typeof response.answer === 'string' &&
        response.answer.trim() !== '') ||
      ('answerArray' in response &&
        Array.isArray(response.answerArray) &&
        response.answerArray.length > 0)
    )
  }
}
