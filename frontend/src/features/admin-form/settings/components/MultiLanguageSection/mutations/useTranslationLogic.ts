import { useCallback, useEffect } from 'react'
import { UseFormGetValues } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import _ from 'lodash'

import {
  AdminFormDto,
  BasicField,
  FormEndPage,
  FormFieldDto,
  FormStartPage,
} from '~shared/types'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  updateEditStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'

import { TranslationInput } from '../TranslationSection'
import {
  updateFormEndPageTranslations,
  updateFormFieldTranslations,
  updateFormStartPageTranslations,
  updateTableTranslations,
} from '../utils/translationUtils'

interface UseTranslationLogicProps {
  form: AdminFormDto | undefined
  language: string
  formFieldNumToBeTranslated: number
  isStartPageTranslations: boolean
  isEndPageTranslations: boolean
  isFormField: boolean
  getValues: UseFormGetValues<TranslationInput>
}

export const useTranslationLogic = ({
  form,
  language,
  formFieldNumToBeTranslated,
  isStartPageTranslations,
  isEndPageTranslations,
  isFormField,
  getValues,
}: UseTranslationLogicProps) => {
  const [, setSearchParams] = useSearchParams()
  const { editFieldMutation } = useEditFormField()
  const { endPageMutation, startPageMutation } = useMutateFormPage()
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const formFieldData =
    formFieldNumToBeTranslated !== -1
      ? form?.form_fields[formFieldNumToBeTranslated]
      : undefined
  const formStartPage = form?.startPage
  const formEndPage = form?.endPage
  const fieldId = formFieldData?._id

  useEffect(() => {
    if (formFieldData) updateEditState(formFieldData)
  }, [formFieldData, updateEditState])

  const handleOnBackClick = useCallback(() => {
    setSearchParams({ unicodeLocale: language })
  }, [language, setSearchParams])

  const handleOnSaveClick = useCallback(() => {
    const updatedTitleTranslation = getValues('titleTranslation')
    const updatedDescriptionTranslation = getValues('descriptionTranslation')
    const updatedParagraphTranslation = getValues('paragraphTranslations')
    const updatedFieldOptionsTranslation = getValues('fieldOptionsTranslations')
    const updatedTableColumnTitleTranslation = getValues(
      'tableColumnTitleTranslations',
    )
    const updatedTableColumnDropdownTranslation = getValues(
      'tableColumnDropdownTranslations',
    )

    if (isFormField && formFieldData) {
      if (formFieldData.fieldType === BasicField.Table) {
        const updatedTableData = updateTableTranslations({
          data: formFieldData,
          language,
          updatedTableColumnTitleTranslation,
          updatedTableColumnDropdownTranslation,
          updatedTitleTranslation,
          updatedDescriptionTranslation,
        })

        editFieldMutation.mutate(
          { ...updatedTableData, _id: fieldId } as FormFieldDto,
          { onSuccess: handleOnBackClick },
        )
      } else {
        let updatedFieldOptionsTranslationArr =
          updatedFieldOptionsTranslation.split('\n')

        updatedFieldOptionsTranslationArr =
          updatedFieldOptionsTranslationArr.filter(
            (optionsTranslation) => !_.isEmpty(optionsTranslation),
          )

        const updatedFormData = updateFormFieldTranslations({
          data: formFieldData,
          language,
          updatedTitleTranslation,
          updatedDescriptionTranslation,
          updatedFieldOptionsTranslation: updatedFieldOptionsTranslationArr,
        })

        editFieldMutation.mutate(
          { ...updatedFormData, _id: fieldId } as FormFieldDto,
          { onSuccess: handleOnBackClick },
        )
      }
    }

    if (isStartPageTranslations && formStartPage) {
      const updatedFormStartPage = updateFormStartPageTranslations({
        data: formStartPage,
        language,
        updatedParagraphTranslation,
      })
      console.log(updatedFormStartPage)
      startPageMutation.mutate(updatedFormStartPage as FormStartPage, {
        onSuccess: handleOnBackClick,
      })
    }

    if (isEndPageTranslations && formEndPage) {
      const updatedFormEndPage = updateFormEndPageTranslations({
        data: formEndPage,
        language,
        updatedTitleTranslation,
        updatedParagraphTranslation,
      })

      console.log(updatedFormEndPage)

      endPageMutation.mutate(updatedFormEndPage as FormEndPage, {
        onSuccess: handleOnBackClick,
      })
    }
  }, [
    getValues,
    isFormField,
    formFieldData,
    isStartPageTranslations,
    formStartPage,
    isEndPageTranslations,
    formEndPage,
    language,
    editFieldMutation,
    fieldId,
    handleOnBackClick,
    startPageMutation,
    endPageMutation,
  ])

  return {
    handleOnSaveClick,
    formFieldData,
    formStartPage,
    formEndPage,
    handleOnBackClick,
  }
}
