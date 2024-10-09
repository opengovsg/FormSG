import { useCallback, useMemo } from 'react'
import { BiArrowBack, BiCheck, BiError } from 'react-icons/bi'
import { useNavigate, useParams } from 'react-router-dom'
import {
  As,
  Divider,
  Flex,
  Icon,
  IconButton,
  Skeleton,
  Text,
  Tooltip,
} from '@chakra-ui/react'

import {
  BasicField,
  CheckboxFieldBase,
  DropdownFieldBase,
  FormField,
  FormFieldDto,
  Language,
  RadioFieldBase,
} from '~shared/types'

import { PhHandsClapping } from '~assets/icons'
import { BxsDockTop } from '~assets/icons/BxsDockTop'
import { ADMINFORM_ROUTE } from '~constants/routes'
import { convertUnicodeLocaleToLanguage } from '~utils/multiLanguage'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FieldListOption } from '~features/admin-form/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/FieldListOption'
import {
  BASICFIELD_TO_DRAWER_META,
  MYINFO_FIELD_TO_DRAWER_META,
} from '~features/admin-form/create/constants'
import { isMyInfo } from '~features/myinfo/utils'

import { CategoryHeader } from '../CategoryHeader'

interface QuestionRowProps {
  questionTitle: string
  icon: As
  isMyInfoField: boolean
  formFieldNum: number
  hasTranslations: boolean
  isStartPage?: boolean
  isEndPage?: boolean
}

export const QuestionRow = ({
  questionTitle,
  icon,
  isMyInfoField,
  formFieldNum,
  hasTranslations,
  isStartPage,
  isEndPage,
}: QuestionRowProps): JSX.Element => {
  const { formId, language } = useParams()
  const navigate = useNavigate()
  const isTranslationRowDisabled = isMyInfoField

  const handleOnListClick = useCallback(() => {
    // check if translation row is not disabled
    if (!isTranslationRowDisabled)
      navigate(
        `${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${language}`,
        {
          state: {
            isTranslation: true,
            formFieldNum,
            isStartPage: isStartPage ?? false,
            isEndPage: isEndPage ?? false,
          },
        },
      )
  }, [
    formFieldNum,
    formId,
    isEndPage,
    isStartPage,
    isTranslationRowDisabled,
    language,
    navigate,
  ])

  return (
    <Flex direction="row">
      <Tooltip
        label={isMyInfoField ? 'Myinfo fields cannot be translated' : ''}
        hasArrow
        placement="top"
      >
        <FieldListOption
          onClick={handleOnListClick}
          w="100%"
          justifyItems="stretch"
          disabled={isTranslationRowDisabled}
        >
          <Flex direction="row" alignItems="center" mr="auto" gap={6}>
            <Icon fontSize="1.5rem" as={icon} />
            <Text
              textStyle="body-1"
              overflow="hidden"
              textOverflow="ellipsis"
              color="secondary.500"
            >
              {questionTitle}
            </Text>
          </Flex>

          {!isMyInfoField && !hasTranslations && (
            <Icon fontSize="1.5rem" as={BiError} color="warning.600" />
          )}
          {!isMyInfoField && hasTranslations && (
            <Icon
              fontSize="1.5rem"
              as={BiCheck}
              color="success.500"
              ml="auto"
            />
          )}
        </FieldListOption>
      </Tooltip>
    </Flex>
  )
}

export const TranslationListSection = ({
  language,
}: {
  language: string
}): JSX.Element | null => {
  const { formId } = useParams()
  const { data: form, isLoading } = useAdminForm()
  const navigate = useNavigate()

  const unicodeLocale = language as Language

  console.log(unicodeLocale)

  const hasStartPageTranslations = useMemo(() => {
    const startPageTranslations = form?.startPage?.paragraphTranslations ?? []
    return startPageTranslations.some(
      (translation) => translation.language === unicodeLocale,
    )
  }, [form?.startPage?.paragraphTranslations, unicodeLocale])

  const hasEndPageTranslations = useMemo(() => {
    if (!form?.endPage) return false

    const {
      titleTranslations = [],
      paragraph,
      paragraphTranslations = [],
    } = form.endPage

    const hasEndPageTitleTranslations = titleTranslations.some(
      (translations) => translations.language === unicodeLocale,
    )

    const hasEndPageParagraphTranslations =
      !paragraph ||
      paragraphTranslations.some(
        (translations) => translations.language === unicodeLocale,
      )

    return hasEndPageTitleTranslations && hasEndPageParagraphTranslations
  }, [form?.endPage, unicodeLocale])

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/multi-language`)
  }, [formId, navigate])

  const getHasTranslations = useCallback(
    (formField: FormFieldDto<FormField>): boolean => {
      const {
        title,
        titleTranslations,
        description,
        descriptionTranslations,
        fieldType,
      } = formField

      const hasTitleTranslation =
        !title ||
        (titleTranslations ?? []).some(
          (titleTranslation) =>
            titleTranslation.language === unicodeLocale &&
            titleTranslation.translation,
        )

      const hasDescriptionTranslation =
        !description ||
        (descriptionTranslations ?? []).some(
          (descriptionTranslation) =>
            descriptionTranslation.language === unicodeLocale &&
            descriptionTranslation.translation,
        )

      let hasFieldOptionsTranslation = true
      if (
        fieldType === BasicField.Checkbox ||
        fieldType === BasicField.Radio ||
        fieldType === BasicField.Dropdown
      ) {
        const { fieldOptions, fieldOptionsTranslations } =
          formField as FormFieldDto<
            CheckboxFieldBase | RadioFieldBase | DropdownFieldBase
          >

        if (fieldOptions && fieldOptions.length > 0) {
          const relevantTranslation = fieldOptionsTranslations?.find(
            (translation) => translation.language === unicodeLocale,
          )
          hasFieldOptionsTranslation =
            (relevantTranslation?.translation?.length ?? 0) ===
            fieldOptions.length
        }
      }

      return (
        hasTitleTranslation &&
        hasDescriptionTranslation &&
        hasFieldOptionsTranslation
      )
    },
    [unicodeLocale],
  )

  const languageToDisplay = convertUnicodeLocaleToLanguage(unicodeLocale)

  if (!form) {
    return null
  }

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      <Flex>
        <IconButton
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          icon={<BiArrowBack fontSize="1.25rem" />}
          onClick={handleOnBackClick}
          marginRight="2.25rem"
        />
        <Flex direction="column" w="full">
          <CategoryHeader py={2}>{languageToDisplay}</CategoryHeader>

          {/* Start Page Translation */}
          {form.startPage.paragraph && (
            <>
              <QuestionRow
                questionTitle="Instructions"
                icon={BxsDockTop}
                isMyInfoField={false}
                hasTranslations={hasStartPageTranslations}
                formFieldNum={-1}
                isStartPage={true}
              />
              <Divider />
            </>
          )}

          {form?.form_fields.map((form_field, id) => {
            const isMyInfoField = isMyInfo(form_field)

            const questionIcon = isMyInfoField
              ? MYINFO_FIELD_TO_DRAWER_META[form_field.myInfo.attr].icon
              : BASICFIELD_TO_DRAWER_META[form_field.fieldType].icon
            return (
              <>
                <QuestionRow
                  key={id}
                  questionTitle={form_field.title}
                  icon={questionIcon}
                  isMyInfoField={isMyInfoField}
                  formFieldNum={id}
                  hasTranslations={getHasTranslations(form_field)}
                />
                <Divider />
              </>
            )
          })}

          {/* End Page Translation */}
          {form.endPage && (
            <QuestionRow
              questionTitle={form.endPage?.title ?? ''}
              icon={PhHandsClapping}
              isMyInfoField={false}
              hasTranslations={hasEndPageTranslations}
              formFieldNum={-1}
              isEndPage={true}
            />
          )}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
