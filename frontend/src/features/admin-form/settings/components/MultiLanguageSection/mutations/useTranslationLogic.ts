import { useCallback, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import _ from 'lodash'

import {
  AdminFormDto,
  BasicField,
  FormEndPage,
  FormFieldDto,
  FormStartPage,
  LogicType,
  PreventSubmitLogicDto,
} from '~shared/types'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  updateEditStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'
import {
  setToInactiveSelector,
  useAdminLogicStore,
} from '~features/admin-form/create/logic/adminLogicStore'
import { useLogicMutations } from '~features/admin-form/create/logic/mutations'

import { TranslationInput } from '../TranslationSection'
import {
  updateFormEndPageTranslations,
  updateFormFieldTranslations,
  updateFormStartPageTranslations,
  updateTableTranslations,
  updateTranslations,
} from '../utils/translationUtils'

interface UseTranslationLogicProps {
  form: AdminFormDto | undefined
  language: string
  formFieldNumToBeTranslated: number
  isStartPageTranslations: boolean
  isEndPageTranslations: boolean
  isFormLogicTranslations: boolean
  isFormField: boolean
  methods: UseFormReturn<TranslationInput>
}

export const useTranslationLogic = ({
  form,
  language,
  formFieldNumToBeTranslated,
  isStartPageTranslations,
  isEndPageTranslations,
  isFormLogicTranslations,
  isFormField,
  methods,
}: UseTranslationLogicProps) => {
  const { getValues, setError, clearErrors } = methods
  const [, setSearchParams] = useSearchParams()
  const { editFieldMutation } = useEditFormField()
  const { updateLogicMutation } = useLogicMutations()
  const { endPageMutation, startPageMutation } = useMutateFormPage()
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)
  const setToInactive = useAdminLogicStore(setToInactiveSelector)

  const formFieldData =
    formFieldNumToBeTranslated !== -1
      ? form?.form_fields[formFieldNumToBeTranslated]
      : undefined
  const formStartPage = form?.startPage
  const formEndPage = form?.endPage
  const formLogicsPreventSubmissions = form?.form_logics.filter(
    (formLogic) => formLogic.logicType === LogicType.PreventSubmit,
  ) as PreventSubmitLogicDto[]
  const fieldId = formFieldData?._id

  useEffect(() => {
    if (formFieldData) updateEditState(formFieldData)
  }, [formFieldData, updateEditState])

  const handleOnBackClick = useCallback(() => {
    setSearchParams({ unicodeLocale: language })
  }, [language, setSearchParams])

  const handleUpdateFormLogics = (
    updatedFormLogics: PreventSubmitLogicDto[],
  ) => {
    updatedFormLogics.forEach((updatedFormLogic) => {
      updateLogicMutation.mutate(
        { ...updatedFormLogic, _id: updatedFormLogic._id },
        {
          onSuccess: () => setToInactive(),
        },
      )
    })

    handleOnBackClick()
  }

  const handleOnSaveClick = () => {
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
    const updatedPreventSubmitTranslations = getValues(
      'preventSubmitMessageTranslations',
    )

    if (isFormField && formFieldData) {
      if (formFieldData.fieldType === BasicField.Table) {
        clearErrors('tableColumnDropdownTranslations')
        const updatedTableData = updateTableTranslations({
          data: formFieldData,
          language,
          updatedTableColumnTitleTranslation,
          updatedTableColumnDropdownTranslation,
          updatedTitleTranslation,
          updatedDescriptionTranslation,
        })

        const tableColumns = updatedTableData.columns

        tableColumns.forEach((column, index) => {
          if (column.columnType !== BasicField.Dropdown) return

          const translationIndex =
            column.fieldOptionsTranslations?.findIndex(
              (t) => t.language === language,
            ) ?? -1

          if (
            column.fieldOptionsTranslations &&
            translationIndex !== -1 &&
            column.fieldOptionsTranslations[translationIndex].translation
              .length !== column.fieldOptions.length
          ) {
            setError(`tableColumnDropdownTranslations.${index}`, {
              type: 'custom',
              message:
                'Make sure the number of translated options match the options in the question.',
            })
            return
          }
        })

        for (const [index, tableColumn] of tableColumns.entries()) {
          if (tableColumn.columnType === BasicField.Dropdown) {
            const translationIndex =
              tableColumn.fieldOptionsTranslations?.findIndex(
                (t) => t.language === language,
              ) ?? -1

            if (
              tableColumn.fieldOptionsTranslations &&
              translationIndex !== -1 &&
              tableColumn.fieldOptionsTranslations[translationIndex].translation
                .length !== tableColumn.fieldOptions.length
            ) {
              setError(`tableColumnDropdownTranslations.${index}`, {
                type: 'custom',
                message:
                  'Make sure the number of translated options match the options in the question.',
              })
              return
            }
          }
        }

        editFieldMutation.mutate(
          { ...updatedTableData, _id: fieldId } as FormFieldDto,
          { onSuccess: handleOnBackClick },
        )
      } else {
        let updatedFieldOptionsTranslationArr = updatedFieldOptionsTranslation
          ? updatedFieldOptionsTranslation.split('\n')
          : []

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

        if (
          updatedFormData.fieldType === BasicField.Dropdown ||
          updatedFormData.fieldType === BasicField.Checkbox ||
          updatedFormData.fieldType === BasicField.Radio
        ) {
          clearErrors('fieldOptionsTranslations')
          const translationIndex =
            updatedFormData.fieldOptionsTranslations?.findIndex(
              (t) => t.language === language,
            ) ?? -1
          if (
            updatedFormData.fieldOptionsTranslations &&
            translationIndex !== -1 &&
            updatedFormData.fieldOptionsTranslations[translationIndex]
              .translation.length !== 0 &&
            updatedFormData.fieldOptionsTranslations[translationIndex]
              .translation.length !== updatedFormData.fieldOptions.length
          ) {
            setError('fieldOptionsTranslations', {
              type: 'custom',
              message:
                'Make sure the number of translated options match the options in the question.',
            })
            return
          }
        }

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
      startPageMutation.mutate(updatedFormStartPage as FormStartPage, {
        onSuccess: handleOnBackClick,
      })
    }

    if (isFormLogicTranslations && formLogicsPreventSubmissions) {
      const updatedFormLogics = formLogicsPreventSubmissions.map(
        (preventSubmission, id) => {
          const updatedTranslation = updatedPreventSubmitTranslations[id]
          const updatedPreventSubmitMessageTranslations = updateTranslations({
            translations: preventSubmission.preventSubmitMessageTranslations,
            language,
            newTranslation: updatedTranslation,
          })

          return {
            ...preventSubmission,
            preventSubmitMessageTranslations:
              updatedPreventSubmitMessageTranslations,
          }
        },
      )

      handleUpdateFormLogics(updatedFormLogics)
    }
    if (isEndPageTranslations && formEndPage) {
      const updatedFormEndPage = updateFormEndPageTranslations({
        data: formEndPage,
        language,
        updatedTitleTranslation,
        updatedParagraphTranslation,
      })

      endPageMutation.mutate(updatedFormEndPage as FormEndPage, {
        onSuccess: handleOnBackClick,
      })
    }
  }

  return {
    handleOnSaveClick,
    formFieldData,
    formStartPage,
    formEndPage,
    formLogicsPreventSubmissions,
    handleOnBackClick,
  }
}
