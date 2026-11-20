import { TFunction } from 'i18next'

import { DropdownFieldBase, FormFieldDto } from 'formsg-shared/types'
import { checkIsOptionsMismatched } from 'formsg-shared/utils/options-recipients-map-validation'

import { FormFieldWithQuestionNo } from '~features/form/types'

export type DropdownFormField = FormFieldWithQuestionNo<
  FormFieldDto<DropdownFieldBase>
>

export const getMappingMismatchError = (
  field: DropdownFormField | undefined,
  t: TFunction,
): string | undefined => {
  const mappedOptions = Object.keys(field?.optionsToRecipientsMap ?? {})
  if (mappedOptions.length <= 0) return
  if (checkIsOptionsMismatched(mappedOptions, field?.fieldOptions ?? [])) {
    return t(
      'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.mismatchedOptions',
    )
  }
}

export const getMissingMappingError = (
  field: DropdownFormField | undefined,
  t: TFunction,
): string | undefined =>
  field?.optionsToRecipientsMap
    ? undefined
    : t(
        'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.addEmailsBeforeSave',
      )
