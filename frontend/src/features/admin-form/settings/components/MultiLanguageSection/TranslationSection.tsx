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
  FormField,
  FormFieldDto,
  Language,
  TranslationMapping,
} from '~shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import {
  updateEditStateSelector,
  useFieldBuilderStore,
} from '~features/admin-form/create/builder-and-design/useFieldBuilderStore'

type TranslationInput = {
  titleTranslation: string
  descriptionTranslation: string
}

export const TranslationContainer = ({
  language,
  defaultString,
  register,
  formField,
  editingTranslation,
}: {
  language: string
  defaultString: string | undefined
  register: UseFormRegister<TranslationInput>
  formField: FormFieldDto<FormField> | undefined
  editingTranslation: keyof TranslationInput
}): JSX.Element => {
  let translationMapping: TranslationMapping[] = []

  switch (editingTranslation) {
    case 'descriptionTranslation':
      translationMapping = formField?.descriptionTranslations ?? []
      break
    case 'titleTranslation':
      translationMapping = formField?.titleTranslations ?? []
      break
  }

  const previousTranslations =
    translationMapping.find((translation) => translation.language === language)
      ?.translation ?? ''

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
            defaultValue={previousTranslations}
          />
        </FormControl>
      </Flex>
    </Flex>
  )
}

export const TranslationSection = ({
  language,
  formFieldNumToBeTranslated,
}: {
  language: string
  formFieldNumToBeTranslated: number
}): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { formId } = useParams()
  const navigate = useNavigate()
  const { editFieldMutation } = useEditFormField()
  const { register, watch } = useForm<TranslationInput>()
  const updateEditState = useFieldBuilderStore(updateEditStateSelector)

  const titleTranslationInput = watch('titleTranslation')
  const descriptionTranslationInput = watch('descriptionTranslation')

  const toast = useToast({ status: 'danger' })

  if (!isLoading && !form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
  }

  const formFieldData = form?.form_fields[formFieldNumToBeTranslated]
  const hasDescription =
    !_.isUndefined(formFieldData?.description) &&
    formFieldData?.description !== ''
  const fieldId = formFieldData?._id
  const capitalisedLanguage =
    language.charAt(0).toUpperCase() + language.slice(1)

  useEffect(() => {
    if (formFieldData) updateEditState(formFieldData)
  }, [formFieldData, updateEditState])

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${language}`)
  }, [formId, language, navigate])

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

  const handleOnSaveClick = useCallback(() => {
    if (formFieldData) {
      const updatedTitleTranslations =
        handleOnSaveTitleTranslation(formFieldData)

      let updatedDescriptionTranslations: TranslationMapping[] = []

      if (formFieldData.description && !_.isEmpty(formFieldData.description)) {
        updatedDescriptionTranslations =
          handleOnSaveDescriptionTranslations(formFieldData)
      }

      const updatedFormData = {
        ...formFieldData,
        titleTranslations: updatedTitleTranslations,
        descriptionTranslations: updatedDescriptionTranslations,
      }

      editFieldMutation.mutate({
        ...updatedFormData,
        _id: fieldId,
      } as FormFieldDto)
    }
  }, [
    editFieldMutation,
    fieldId,
    formFieldData,
    handleOnSaveDescriptionTranslations,
    handleOnSaveTitleTranslation,
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
            formField={formFieldData}
            editingTranslation={'titleTranslation'}
          />
        </Flex>
        <Divider mb="2.5rem" />
        {hasDescription && (
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
              formField={formFieldData}
              editingTranslation={'descriptionTranslation'}
            />
          </Flex>
        )}
        <Button variant="solid" width="30%" onClick={handleOnSaveClick}>
          Save Translation
        </Button>
      </Flex>
    </Skeleton>
  )
}
