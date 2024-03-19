import { DeepPartialSkipArrayKey, UnpackNestedValue } from 'react-hook-form'
import { CamelCasedProperties } from 'type-fest'

import { FormDto } from '~shared/types'
import { isNonEmpty } from '~shared/utils/isNonEmpty'
import {
  FieldIdSet,
  getLogicUnitPreventingSubmit as sharedGetLogicUnitPreventingSubmit,
  getVisibleFieldIds as sharedGetVisibleFieldIds,
} from '~shared/utils/logic'

import { FormFieldValues } from '~templates/Field'

import { filterHiddenInputs } from '~features/public-form/utils'

import { isLogicableField, isNotLogicableField } from './typeguards'

/**
 * Determines whether the submission should be prevented by form logic. If so,
 * return the condition preventing the submission. If not, return undefined.
 * @param params.formInputs the responses to retrieve logic units for.
 * @param params.formLogics the logic conditions on the form
 * @param params.visibleFieldIds the set of currently visible fields id.
 * @returns a condition if submission is to prevented, otherwise `undefined`
 */
export const getLogicUnitPreventingSubmit = ({
  formFields,
  formInputs,
  formLogics,
}: {
  formFields: FormDto['form_fields']
  formLogics: FormDto['form_logics']
  formInputs: FormFieldValues
}) => {
  const filteredFormInputs = filterHiddenInputs({
    formFields,
    formInputs,
    formLogics,
  })

  const responseData = Object.keys(filteredFormInputs)
    .map((_id) => {
      const field = formFields.find((ff) => ff._id === _id)
      if (!field) return null
      const fieldTypeAndInput = {
        fieldType: field.fieldType,
        input: filteredFormInputs[_id],
      }
      // Type narrowing to help the typechecker along with complex if-else types
      // Unfortunately, this requires the runtime check where isNotLogicableField
      // is defined as !isLogicableField, allowing the final "else" case to be
      // an unreachable code path.
      if (isNotLogicableField(fieldTypeAndInput)) {
        return { _id, fieldType: fieldTypeAndInput.fieldType }
      } else if (isLogicableField(fieldTypeAndInput)) {
        return { _id, ...fieldTypeAndInput }
      } else {
        // Unreachable branch
        throw new Error('Unexpected fallthrough')
      }
    })
    .filter(isNonEmpty)

  const visibleFieldIds = new Set(Object.keys(filteredFormInputs))

  return sharedGetLogicUnitPreventingSubmit(
    responseData,
    { form_fields: formFields, form_logics: formLogics },
    visibleFieldIds,
  )
}

/**
 * Gets the IDs of visible fields in a form according to its responses.
 * This function loops through all the form fields until the set of visible
 * fields no longer changes. The first loop adds all the fields with no
 * conditions attached, the second adds fields which are made visible due to fields added in the previous loop, and so on.
 * @param formInputs the field responses to retrieve logic units for.
 * @param formProps the form fields and form logics to determine visible field ids.
 * @returns a set of IDs of visible fields in the submission
 */
export const getVisibleFieldIds = (
  formInputs: UnpackNestedValue<DeepPartialSkipArrayKey<FormFieldValues>>,
  {
    formFields,
    formLogics,
  }: CamelCasedProperties<Pick<FormDto, 'form_fields' | 'form_logics'>>,
): FieldIdSet => {
  const responseData = formFields
    .map((ff) => {
      const input = formInputs[ff._id]
      if (!input) return null
      const fieldTypeAndInput = {
        fieldType: ff.fieldType,
        input,
      }
      // Type narrowing to help the typechecker along with complex if-else types
      // Unfortunately, this requires the runtime check where isNotLogicableField
      // is defined as !isLogicableField, allowing the final "else" case to be
      // an unreachable code path.
      if (isNotLogicableField(fieldTypeAndInput)) {
        return { _id: ff._id, fieldType: fieldTypeAndInput.fieldType }
      } else if (isLogicableField(fieldTypeAndInput)) {
        return { _id: ff._id, ...fieldTypeAndInput }
      } else {
        // Unreachable branch
        throw new Error('Unexpected fallthrough')
      }
    })
    .filter(isNonEmpty)

  return sharedGetVisibleFieldIds(responseData, {
    form_fields: formFields,
    form_logics: formLogics,
  })
}
