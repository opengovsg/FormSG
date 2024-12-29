import _ from 'lodash'

import {
  FormEndPage,
  FormField,
  FormStartPage,
  Language,
  TranslationMapping,
  TranslationOptionMapping,
} from '~shared/types'
import { BasicField, TableFieldBase } from '~shared/types/field'

export const updateFormFieldTranslations = ({
  data,
  language,
  updatedTitleTranslation,
  updatedDescriptionTranslation,
  updatedFieldOptionsTranslation,
}: {
  data: FormField
  language: string
  updatedTitleTranslation: string
  updatedDescriptionTranslation: string
  updatedFieldOptionsTranslation: string[]
}): FormField => {
  let updatedFormFieldData = { ...data }

  const doesFormFieldHaveOptions =
    data.fieldType === BasicField.Dropdown ||
    data.fieldType === BasicField.Checkbox ||
    data.fieldType === BasicField.Radio

  // Update title translations
  const updatedTitleTranslations = updateTranslations({
    translations: data?.titleTranslations,
    language,
    newTranslation: updatedTitleTranslation,
  })

  // Update description translations
  const updatedDescriptionTranslations = updateTranslations({
    translations: data?.descriptionTranslations,
    language,
    newTranslation: updatedDescriptionTranslation,
  })

  updatedFormFieldData = {
    ...updatedFormFieldData,
    descriptionTranslations: updatedDescriptionTranslations,
    titleTranslations: updatedTitleTranslations,
  }

  // If form field is dropdown, radio or checkbox => update field options translations
  if (doesFormFieldHaveOptions) {
    const updatedFieldOptionsTranslations = updateOptionsTranslations({
      translations: data?.fieldOptionsTranslations,
      language,
      newTranslations: updatedFieldOptionsTranslation,
    })

    updatedFormFieldData = {
      ...updatedFormFieldData,
      ...(doesFormFieldHaveOptions && {
        fieldOptionsTranslations: updatedFieldOptionsTranslations,
      }),
    }
  }

  return updatedFormFieldData
}

export const updateFormStartPageTranslations = ({
  data,
  language,
  updatedParagraphTranslation,
}: {
  data: FormStartPage
  language: string
  updatedParagraphTranslation: string
}): FormStartPage => {
  const updatedParagraphTranslations = updateTranslations({
    translations: data?.paragraphTranslations,
    language,
    newTranslation: updatedParagraphTranslation,
  })

  return { ...data, paragraphTranslations: updatedParagraphTranslations }
}

export const updateFormEndPageTranslations = ({
  data,
  language,
  updatedTitleTranslation,
  updatedParagraphTranslation,
}: {
  data: FormEndPage
  language: string
  updatedTitleTranslation: string
  updatedParagraphTranslation: string
}): FormEndPage => {
  const updatedTitleTranslations = updateTranslations({
    translations: data?.titleTranslations,
    language,
    newTranslation: updatedTitleTranslation,
  })
  const updatedParagraphTranslations = updateTranslations({
    translations: data?.paragraphTranslations,
    language,
    newTranslation: updatedParagraphTranslation,
  })

  return {
    ...data,
    paragraphTranslations: updatedParagraphTranslations,
    titleTranslations: updatedTitleTranslations,
  }
}

export const updateTableTranslations = ({
  data,
  language,
  updatedTableColumnTitleTranslation,
  updatedTableColumnDropdownTranslation,
  updatedTitleTranslation,
  updatedDescriptionTranslation,
}: {
  data: TableFieldBase
  language: string
  updatedTableColumnTitleTranslation: string[]
  updatedTableColumnDropdownTranslation: string[]
  updatedTitleTranslation: string
  updatedDescriptionTranslation: string
}): TableFieldBase => {
  const columns = data.columns

  const updatedTitleTranslations = updateTranslations({
    translations: data?.titleTranslations,
    language,
    newTranslation: updatedTitleTranslation,
  })
  const updatedDescriptionTranslations = updateTranslations({
    translations: data?.descriptionTranslations,
    language,
    newTranslation: updatedDescriptionTranslation,
  })

  const updatedColumns = columns.map((column, columnIdx) => {
    return {
      ...column,
      titleTranslations: updateTranslations({
        translations: column?.titleTranslations,
        language,
        newTranslation: updatedTableColumnTitleTranslation[columnIdx],
      }),
      ...(column.columnType === BasicField.Dropdown && {
        fieldOptionsTranslations: updateOptionsTranslations({
          translations: column?.fieldOptionsTranslations,
          language,
          newTranslations: updatedTableColumnDropdownTranslation[columnIdx]
            .split('\n')
            .filter((optionsTranslation) => !_.isEmpty(optionsTranslation)),
        }),
      }),
    }
  })

  return {
    ...data,
    titleTranslations: updatedTitleTranslations,
    descriptionTranslations: updatedDescriptionTranslations,
    columns: updatedColumns,
  }
}

export const updateTranslations = ({
  translations,
  language,
  newTranslation,
}: {
  translations: TranslationMapping[] | undefined
  language: string
  newTranslation: string
}): TranslationMapping[] => {
  const updatedTranslations = translations || []
  const translationIndex = updatedTranslations.findIndex(
    (t) => t.language === language,
  )

  if (translationIndex !== -1) {
    // Remove translation mapping from array if new translation is an empty string
    if (_.isEmpty(newTranslation)) {
      updatedTranslations.splice(translationIndex, 1)
    } else {
      updatedTranslations[translationIndex].translation = newTranslation
    }
  } else {
    if (!_.isEmpty(newTranslation)) {
      updatedTranslations.push({
        language: language as Language,
        translation: newTranslation,
      })
    }
  }

  return updatedTranslations
}

const updateOptionsTranslations = ({
  translations,
  language,
  newTranslations,
}: {
  translations: TranslationOptionMapping[] | undefined
  language: string
  newTranslations: string[]
}): TranslationOptionMapping[] => {
  const updatedTranslations = translations || []
  const translationIndex = updatedTranslations.findIndex(
    (t) => t.language === language,
  )

  if (translationIndex !== -1) {
    // Remove translation mapping from array if new translation is an empty string
    if (_.isEmpty(newTranslations)) {
      updatedTranslations.splice(translationIndex, 1)
    } else {
      updatedTranslations[translationIndex].translation = newTranslations
    }
  } else {
    if (!_.isEmpty(newTranslations)) {
      updatedTranslations.push({
        language: language as Language,
        translation: newTranslations,
      })
    }
  }

  return updatedTranslations
}
