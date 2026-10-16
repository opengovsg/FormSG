import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import {
  AdminFormDto,
  BasicField,
  FormFieldDto,
  FormResponseMode,
  SubmissionMetadata,
  WorkflowStatus,
} from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'

export const getIsPaymentsForm = (form: AdminFormDto | undefined): boolean => {
  if (
    form?.responseMode === FormResponseMode.Encrypt ||
    form?.responseMode === FormResponseMode.Multirespondent
  ) {
    return form.payments_field.enabled
  }
  return false
}

export const getNetAmount = (payments: SubmissionMetadata['payments']) => {
  if (!payments) {
    return ''
  }
  if (payments.transactionFee == null) {
    return ''
  }
  if (payments.transactionFee < 0) {
    return ''
  }
  const grossAmt = centsToDollars(payments.paymentAmt - payments.transactionFee)
  const isFinalTransactionFee = payments.payoutDate
  if (!isFinalTransactionFee) {
    return `Est. ${grossAmt}`
  }
  return `${grossAmt}`
}

export const getReminderButtonState = (
  mrf: SubmissionMetadata['mrf'],
): 'hidden' | 'disabled' | 'enabled' => {
  if (
    mrf?.workflowStatus !== WorkflowStatus.PENDING ||
    !mrf.hasNextStepRecipientEmails
  ) {
    return 'hidden'
  }
  return mrf.stoppedAt ? 'disabled' : 'enabled'
}

const NON_ANSWERABLE_FIELD_TYPES = new Set<BasicField>([
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
])

export interface FieldColumnSource {
  id: string
  title: string
  fieldType: BasicField
}

/**
 * The form's answerable fields in form order, then every field a decrypted
 * response still answers that the form no longer has, so deleting a field
 * keeps its earlier answers in the table. A deleted field takes its question
 * from the newest response that has it, as the CSV export does.
 */
export const getFieldColumnSources = ({
  formFields,
  responsesBySubmissionId,
  submissionIdsNewestFirst,
}: {
  formFields: FormFieldDto[]
  responsesBySubmissionId?: Map<string, FormField[]>
  submissionIdsNewestFirst: string[]
}): FieldColumnSource[] => {
  const isAnswerable = (fieldType: BasicField) =>
    !NON_ANSWERABLE_FIELD_TYPES.has(fieldType)

  const current = formFields
    .filter(({ fieldType }) => isAnswerable(fieldType))
    .map(({ _id, title, fieldType }) => ({ id: _id, title, fieldType }))

  const formFieldIds = new Set(formFields.map(({ _id }) => _id))
  const deleted = new Map<string, FieldColumnSource>()
  for (const submissionId of submissionIdsNewestFirst) {
    for (const response of responsesBySubmissionId?.get(submissionId) ?? []) {
      if (
        response.isHeader ||
        formFieldIds.has(response._id) ||
        deleted.has(response._id) ||
        !isAnswerable(response.fieldType as BasicField)
      ) {
        continue
      }
      deleted.set(response._id, {
        id: response._id,
        title: response.question,
        fieldType: response.fieldType as BasicField,
      })
    }
  }

  return [...current, ...deleted.values()]
}
