import { Result } from 'neverthrow'

import { FieldIdSet, getVisibleFieldIds } from '../../../../shared/util/logic'
import { FieldResponse, IPopulatedEncryptedForm } from '../../../../types'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { IncomingSubmission } from '../IncomingSubmission.class'
import {
  ConflictError,
  ProcessingError,
  ValidateFieldError,
} from '../submission.errors'
import {
  ValidatedFieldMap,
  VerifiableResponseIdSet,
  VisibleResponseIdSet,
} from '../submission.types'
import { getFilteredResponses } from '../submission.utils'

export default class IncomingEncryptSubmission extends IncomingSubmission {
  private constructor(
    responses: FieldResponse[],
    public readonly form: IPopulatedEncryptedForm,
    public readonly encryptedContent: string,
  ) {
    super(responses, form)
  }

  static init(
    form: IPopulatedEncryptedForm,
    responses: FieldResponse[],
    encryptedContent: string,
  ): Result<
    IncomingEncryptSubmission,
    ProcessingError | ConflictError | ValidateFieldError
  > {
    return checkIsEncryptedEncoding(encryptedContent)
      .andThen(() => this.processResponses(responses, form))
      .map(
        (filteredResponses) =>
          new IncomingEncryptSubmission(
            filteredResponses,
            form,
            encryptedContent,
          ),
      )
  }

  private static processResponses(
    responses: FieldResponse[],
    form: IPopulatedEncryptedForm,
  ): Result<
    FieldResponse[],
    ProcessingError | ConflictError | ValidateFieldError
  > {
    return getFilteredResponses(form, responses)
      .andThen((filteredResponses) =>
        this.getFieldMap(form, filteredResponses).map((fieldMap) =>
          this.transformFilteredResponses({
            form,
            filteredResponses,
            fieldMap,
          }),
        ),
      )
      .andThen((responsesAndMetadata) =>
        this.validateResponses({ ...responsesAndMetadata, form }).map(
          () => responsesAndMetadata.responses,
        ),
      )
  }

  private static transformFilteredResponses({
    form,
    filteredResponses,
    fieldMap,
  }: {
    form: IPopulatedEncryptedForm
    filteredResponses: FieldResponse[]
    fieldMap: ValidatedFieldMap
  }): {
    responses: FieldResponse[]
    fieldMap: ValidatedFieldMap
    visibleFieldIds: FieldIdSet
    verifiableResponseIds: VerifiableResponseIdSet
    visibleResponseIds: VisibleResponseIdSet
  } {
    return {
      responses: filteredResponses,
      fieldMap,
      visibleFieldIds: getVisibleFieldIds(filteredResponses, form),
      verifiableResponseIds: this.getVerifiableResponseIds({
        responses: filteredResponses,
        fieldMap,
      }),
      visibleResponseIds: this.getVisibleResponseIds({
        responses: filteredResponses,
        visibilityPredicate: this.responseVisibilityPredicate,
      }),
    }
  }

  private static responseVisibilityPredicate(response: FieldResponse): boolean {
    return (
      'answer' in response &&
      typeof response.answer === 'string' &&
      response.answer.trim() !== ''
    )
  }
}
