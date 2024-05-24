import { useCallback, useEffect } from 'react'
import { useForm, UseFormRegister } from 'react-hook-form'
import { BiChevronLeft } from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Divider,
  Flex,
  FormControl,
  Input,
  Skeleton,
  Text,
  Textarea,
} from '@chakra-ui/react'
import _ from 'lodash'

import {
  BasicField,
  FormEndPage,
  FormField,
  FormFieldDto,
  FormStartPage,
  Language,
  TranslationMapping,
  TranslationOptionMapping,
} from '~shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  updateEditStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'

type TranslationInput = {
  titleTranslation: string
  descriptionTranslation: string
  paragraphTranslations: string
  fieldOptionsTranslations: string
}

export const TranslationContainer = ({
  language,
  defaultString,
  register,
  editingTranslation,
  previousTranslation,
}: {
  language: string
  defaultString: string | undefined
  register: UseFormRegister<TranslationInput>
  editingTranslation: keyof TranslationInput
  previousTranslation?: string
}): JSX.Element => {
  return (
    <Flex direction="column" width="100%">
      <Flex alignItems="center" mb="2rem">
        <Text
          color="secondary.700"
          fontWeight="400"
          mr="7.5rem"
          width="6.25rem"
        >
          Default
        </Text>
        <Textarea
          placeholder={defaultString}
          width="100%"
          isDisabled={true}
          padding="0.75rem"
          resize="none"
        />
      </Flex>
      <Flex alignItems="center">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {language}
        </Text>
        <FormControl>
          <Input
            type="text"
            width="100%"
            {...register(editingTranslation)}
            defaultValue={previousTranslation}
          />
        </FormControl>
      </Flex>
    </Flex>
  )
}

const OptionsTranslationContainer = ({
  language,
  defaultString,
  register,
  editingTranslation,
  previousTranslation,
}: {
  language: string
  defaultString: string | undefined
  register: UseFormRegister<TranslationInput>
  editingTranslation: keyof TranslationInput
  previousTranslation?: string
}) => {
  return (
    <Flex direction="column" width="100%">
      <Flex alignItems="center" mb="2rem">
        <Text
          color="secondary.700"
          fontWeight="400"
          mr="7.5rem"
          width="6.25rem"
        >
          Default
        </Text>
        <Textarea
          placeholder={defaultString}
          width="100%"
          isDisabled={true}
          padding="0.75rem"
          resize="none"
          height="max-content"
        />
      </Flex>
      <Flex alignItems="center">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {language}
        </Text>
        <FormControl>
          <Textarea
            width="100%"
            {...register(editingTranslation)}
            defaultValue={previousTranslation}
          />
        </FormControl>
      </Flex>
    </Flex>
  )
}

const StartPageTranslationContainer = ({
  startPage,
  capitalisedLanguage,
  register,
}: {
  startPage?: FormStartPage
  capitalisedLanguage: string
  register: UseFormRegister<TranslationInput>
}): JSX.Element | null => {
  if (_.isUndefined(startPage)) {
    return null
  }

  const currentTranslations = startPage.translations ?? []

  const previousTranslation =
    currentTranslations.find(
      (translation) => translation.language === capitalisedLanguage,
    )?.translation ?? ''

  return (
    <>
      <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
        <Text
          color="secondary.500"
          fontSize="1.25rem"
          fontWeight="600"
          mb="1rem"
        >
          Question
        </Text>
        <TranslationContainer
          language={capitalisedLanguage}
          defaultString={startPage.paragraph}
          register={register}
          editingTranslation={'titleTranslation'}
          previousTranslation={previousTranslation}
        />
      </Flex>
    </>
  )
}

const FormFieldTranslationContainer = ({
  formFieldData,
  capitalisedLanguage,
  register,
}: {
  formFieldData: FormField | undefined
  capitalisedLanguage: string
  register: UseFormRegister<TranslationInput>
}): JSX.Element | null => {
  if (_.isUndefined(formFieldData)) {
    return null
  }

  const hasDescription =
    !_.isUndefined(formFieldData?.description) &&
    formFieldData?.description !== ''

  const titleTranslations = formFieldData.titleTranslations ?? []
  const descriptionTranslations = formFieldData.descriptionTranslations ?? []

  const prevTitleTranslations =
    titleTranslations.find(
      (translation) => translation.language === capitalisedLanguage,
    )?.translation ?? ''

  const prevDescriptionTranslations =
    descriptionTranslations.find(
      (translation) => translation.language === capitalisedLanguage,
    )?.translation ?? ''

  let hasFieldOptions = false
  let defaultFieldOptions = ''
  let previousFieldOptionsTranslations = ''

  if (
    formFieldData.fieldType === BasicField.Radio ||
    formFieldData.fieldType === BasicField.Checkbox ||
    formFieldData.fieldType === BasicField.Dropdown
  ) {
    hasFieldOptions = true
    defaultFieldOptions = formFieldData.fieldOptions.join('\n')

    const existingFieldOptionsTranslations =
      formFieldData?.fieldOptionsTranslations ?? []

    const idx = existingFieldOptionsTranslations.findIndex((translation) => {
      return translation.language === capitalisedLanguage
    })

    if (idx !== -1) {
      previousFieldOptionsTranslations =
        existingFieldOptionsTranslations[idx].translation.join('\n')
    }
  }

  return (
    <>
      <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
        <Text
          color="secondary.500"
          fontSize="1.25rem"
          fontWeight="600"
          mb="1rem"
        >
          Question
        </Text>
        <TranslationContainer
          language={capitalisedLanguage}
          defaultString={formFieldData?.title}
          register={register}
          editingTranslation={'titleTranslation'}
          previousTranslation={prevTitleTranslations}
        />
      </Flex>
      {hasDescription && (
        <>
          <Divider mb="2.5rem" />
          <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              Description
            </Text>
            <TranslationContainer
              language={capitalisedLanguage}
              defaultString={formFieldData?.description}
              register={register}
              editingTranslation={'descriptionTranslation'}
              previousTranslation={prevDescriptionTranslations}
            />
          </Flex>
        </>
      )}
      {hasFieldOptions && (
        <>
          <Divider mb="2.5rem" />
          <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
            <Text
              color="secondary.500"
              fontSize="1.25rem"
              fontWeight="600"
              mb="1rem"
            >
              Options
            </Text>
            <OptionsTranslationContainer
              language={capitalisedLanguage}
              defaultString={defaultFieldOptions}
              register={register}
              editingTranslation={'fieldOptionsTranslations'}
              previousTranslation={previousFieldOptionsTranslations}
            />
          </Flex>
        </>
      )}
    </>
  )
}

const EndPageTranslationsContainer = ({
  endPage,
  capitalisedLanguage,
  register,
}: {
  endPage?: FormEndPage
  capitalisedLanguage: string
  register: UseFormRegister<TranslationInput>
}): JSX.Element | null => {
  if (_.isUndefined(endPage)) {
    return null
  }

  const hasParagraph = !_.isEmpty(endPage.paragraph)

  const currentTitleTranslations = endPage.titleTranslations ?? []
  const currentParagraphTranslations = endPage.paragraphTranslations ?? []

  const previousTranslation =
    currentTitleTranslations.find(
      (translation) => translation.language === capitalisedLanguage,
    )?.translation ?? ''

  const prevParagraphTranslations =
    currentParagraphTranslations.find(
      (translation) => translation.language === capitalisedLanguage,
    )?.translation ?? ''

  return (
    <>
      <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
        <Text
          color="secondary.500"
          fontSize="1.25rem"
          fontWeight="600"
          mb="1rem"
        >
          Question
        </Text>
        <TranslationContainer
          language={capitalisedLanguage}
          defaultString={endPage.title}
          register={register}
          editingTranslation={'titleTranslation'}
          previousTranslation={previousTranslation}
        />
      </Flex>
      <Divider mb="2.5rem" />
      {hasParagraph && (
        <Flex justifyContent="flex-start" mb="2.5rem" direction="column">
          <Text
            color="secondary.500"
            fontSize="1.25rem"
            fontWeight="600"
            mb="1rem"
          >
            Follow-up instructions
          </Text>
          <TranslationContainer
            language={capitalisedLanguage}
            defaultString={endPage.paragraph}
            register={register}
            editingTranslation={'paragraphTranslations'}
            previousTranslation={prevParagraphTranslations}
          />
        </Flex>
      )}
    </>
  )
}

export const TranslationSection = ({
  language,
  formFieldNumToBeTranslated,
  isStartPageTranslations,
  isEndPageTranslations,
  isFormField,
}: {
  language: string
  formFieldNumToBeTranslated: number
  isStartPageTranslations?: boolean
  isEndPageTranslations?: boolean
  isFormField: boolean
}): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { editFieldMutation } = useEditFormField()
  const { endPageMutation, startPageMutation } = useMutateFormPage()
  const { register, watch } = useForm<TranslationInput>()
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const titleTranslationInput = watch('titleTranslation')
  const descriptionTranslationInput = watch('descriptionTranslation')
  const paragraphTranslationInput = watch('paragraphTranslations')
  const fieldOptionsTranslationInput = watch('fieldOptionsTranslations')

  const toast = useToast({ status: 'danger' })

  if (!isLoading && !form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
  }

  const formFieldData = form?.form_fields[formFieldNumToBeTranslated]
  const formStartPage = form?.startPage
  const formEndPage = form?.endPage
  const fieldId = formFieldData?._id
  const capitalisedLanguage =
    language.charAt(0).toUpperCase() + language.slice(1)

  useEffect(() => {
    if (formFieldData) updateEditState(formFieldData)
  }, [formFieldData, updateEditState])

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${language}`)
  }, [formId, language, navigate])

  const handleOnSaveStartPageTranslation = useCallback(
    (startPage: FormStartPage): TranslationMapping[] => {
      // get current translations if any
      const translations = startPage?.translations ?? []

      // get index of current translations if any
      const translationIdx = translations.findIndex(
        (translation: TranslationMapping) =>
          translation.language === capitalisedLanguage,
      )

      let updatedTranslations = translations

      if (translationIdx !== -1) {
        updatedTranslations[translationIdx].translation = titleTranslationInput
      } else {
        updatedTranslations = [
          ...updatedTranslations,
          {
            language: capitalisedLanguage as Language,
            translation: titleTranslationInput,
          },
        ]
      }
      return updatedTranslations
    },
    [capitalisedLanguage, titleTranslationInput],
  )

  const handleOnSaveEndPageTitleTranslations = useCallback(
    (endPage: FormEndPage) => {
      // get current title translations if any
      const translations = endPage?.titleTranslations ?? []

      // get index of current title translations if any
      const translationIdx = translations.findIndex(
        (translation: TranslationMapping) =>
          translation.language === capitalisedLanguage,
      )

      let updatedTranslations = translations

      if (translationIdx !== -1) {
        updatedTranslations[translationIdx].translation = titleTranslationInput
      } else {
        updatedTranslations = [
          ...updatedTranslations,
          {
            language: capitalisedLanguage as Language,
            translation: titleTranslationInput,
          },
        ]
      }

      return updatedTranslations
    },
    [capitalisedLanguage, titleTranslationInput],
  )

  const handleOnSaveEndPageParagraphTranslation = useCallback(
    (endPage: FormEndPage) => {
      // get current paragraph translations if any
      const translations = endPage?.paragraphTranslations ?? []

      // get index of current paragraph translations if any
      const translationIdx = translations.findIndex(
        (translation: TranslationMapping) =>
          translation.language === capitalisedLanguage,
      )

      let updatedTranslations = translations

      if (translationIdx !== -1) {
        updatedTranslations[translationIdx].translation =
          paragraphTranslationInput
      } else {
        updatedTranslations = [
          ...updatedTranslations,
          {
            language: capitalisedLanguage as Language,
            translation: titleTranslationInput,
          },
        ]
      }

      return updatedTranslations
    },
    [capitalisedLanguage, paragraphTranslationInput, titleTranslationInput],
  )

  const handleOnSaveTitleTranslation = useCallback(
    (formFieldData: FormFieldDto<FormField>): TranslationMapping[] => {
      const titleTranslations = formFieldData.titleTranslations ?? []

      const translationIdx = titleTranslations.findIndex(
        (translation: TranslationMapping) =>
          translation.language === capitalisedLanguage,
      )

      let updatedTitleTranslations = titleTranslations

      // title translations for this language exists, need to
      // override it with new translations on save
      if (translationIdx !== -1) {
        updatedTitleTranslations[translationIdx].translation =
          titleTranslationInput
      } else {
        updatedTitleTranslations = [
          ...updatedTitleTranslations,
          {
            language: capitalisedLanguage as Language,
            translation: titleTranslationInput,
          },
        ]
      }

      return updatedTitleTranslations
    },
    [capitalisedLanguage, titleTranslationInput],
  )

  const handleOnSaveDescriptionTranslations = useCallback(
    (formFieldData: FormFieldDto<FormField>): TranslationMapping[] => {
      const descriptionTranslations =
        formFieldData.descriptionTranslations ?? []

      const translationIdx = descriptionTranslations.findIndex(
        (translation: TranslationMapping) =>
          translation.language === capitalisedLanguage,
      )

      let updatedDescriptionTranslations = descriptionTranslations

      if (translationIdx !== -1) {
        updatedDescriptionTranslations[translationIdx].translation =
          descriptionTranslationInput
      } else {
        updatedDescriptionTranslations = [
          ...updatedDescriptionTranslations,
          {
            language: capitalisedLanguage as Language,
            translation: descriptionTranslationInput,
          },
        ]
      }

      return updatedDescriptionTranslations
    },
    [capitalisedLanguage, descriptionTranslationInput],
  )

  const handleOnSaveOptionsTranslations = useCallback(
    (formFieldData: FormField): TranslationOptionMapping[] => {
      if (
        formFieldData.fieldType === BasicField.Radio ||
        formFieldData.fieldType === BasicField.Checkbox ||
        formFieldData.fieldType === BasicField.Dropdown
      ) {
        // get existing options translations if any
        const existingOptionsTranslations =
          formFieldData?.fieldOptionsTranslations ?? []

        const translationIdx = existingOptionsTranslations.findIndex(
          (translations) => {
            return translations.language === capitalisedLanguage
          },
        )

        let updatedOptionsTranslations = existingOptionsTranslations

        // there are existing translations for the options
        if (translationIdx !== -1) {
          updatedOptionsTranslations[translationIdx].translation =
            fieldOptionsTranslationInput.split('\n')
        } else {
          updatedOptionsTranslations = [
            ...existingOptionsTranslations,
            {
              language: capitalisedLanguage as Language,
              translation: fieldOptionsTranslationInput.split('\n'),
            },
          ]
        }

        return updatedOptionsTranslations
      }
      return []
    },
    [capitalisedLanguage, fieldOptionsTranslationInput],
  )

  const handleOnSaveClick = useCallback(() => {
    if (formFieldData) {
      const updatedTitleTranslations =
        handleOnSaveTitleTranslation(formFieldData)

      let updatedDescriptionTranslations: TranslationMapping[] = []

      // update translations for form fields
      if (!_.isUndefined(formFieldData.description)) {
        updatedDescriptionTranslations =
          handleOnSaveDescriptionTranslations(formFieldData)
      }

      let updatedFormData = {
        ...formFieldData,
        titleTranslations: updatedTitleTranslations,
        descriptionTranslations: updatedDescriptionTranslations,
      }

      if (
        formFieldData.fieldType === BasicField.Radio ||
        formFieldData.fieldType === BasicField.Checkbox ||
        formFieldData.fieldType === BasicField.Dropdown
      ) {
        let updatedFieldOptionsTranslations: TranslationOptionMapping[] = []

        // check if there are any options to be translated
        if (!_.isEmpty(formFieldData.fieldOptions)) {
          updatedFieldOptionsTranslations =
            handleOnSaveOptionsTranslations(formFieldData)
        }

        updatedFormData = {
          ...updatedFormData,
          fieldOptionsTranslations: updatedFieldOptionsTranslations,
        }
      }

      editFieldMutation.mutate({
        ...updatedFormData,
        _id: fieldId,
      } as FormFieldDto)
    }

    // update translations for start page
    if (isStartPageTranslations && formStartPage) {
      const updatedTranslations =
        handleOnSaveStartPageTranslation(formStartPage)

      const updatedFormStartPage = {
        ...formStartPage,
        translations: updatedTranslations,
      }

      startPageMutation.mutate(
        {
          ...updatedFormStartPage,
        },
        {
          onSuccess: () => handleOnBackClick(),
        },
      )
    }

    // update translations for end page
    if (isEndPageTranslations && formEndPage) {
      const updatedTitleTranslations =
        handleOnSaveEndPageTitleTranslations(formEndPage)

      let updatedParagraphTranslations: TranslationMapping[] = []

      if (!_.isUndefined(formEndPage.paragraph)) {
        updatedParagraphTranslations =
          handleOnSaveEndPageParagraphTranslation(formEndPage)
      }

      const updatedFormEndPage = {
        ...formEndPage,
        titleTranslations: updatedTitleTranslations,
        paragraphTranslations: updatedParagraphTranslations,
      }

      endPageMutation.mutate(
        {
          ...updatedFormEndPage,
        },
        {
          onSuccess: () => handleOnBackClick(),
        },
      )
    }
  }, [
    editFieldMutation,
    endPageMutation,
    fieldId,
    formEndPage,
    formFieldData,
    formStartPage,
    handleOnBackClick,
    handleOnSaveDescriptionTranslations,
    handleOnSaveEndPageParagraphTranslation,
    handleOnSaveEndPageTitleTranslations,
    handleOnSaveOptionsTranslations,
    handleOnSaveStartPageTranslation,
    handleOnSaveTitleTranslation,
    isEndPageTranslations,
    isStartPageTranslations,
    startPageMutation,
  ])

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      <Flex mb="3.75rem">
        <Button
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          size="sm"
          leftIcon={<BiChevronLeft fontSize="1.5rem" />}
          onClick={handleOnBackClick}
          marginRight="2.25rem"
        >
          Back to all questions
        </Button>
      </Flex>
      <Flex ml="6.25rem" direction="column">
        {isStartPageTranslations && (
          <StartPageTranslationContainer
            startPage={formStartPage}
            register={register}
            capitalisedLanguage={capitalisedLanguage}
          />
        )}
        {isFormField && formFieldData && (
          <FormFieldTranslationContainer
            formFieldData={formFieldData}
            register={register}
            capitalisedLanguage={capitalisedLanguage}
          />
        )}
        {isEndPageTranslations && formEndPage && (
          <EndPageTranslationsContainer
            endPage={formEndPage}
            capitalisedLanguage={capitalisedLanguage}
            register={register}
          />
        )}
        <Button variant="solid" width="30%" onClick={handleOnSaveClick}>
          Save Translation
        </Button>
      </Flex>
    </Skeleton>
  )
}
