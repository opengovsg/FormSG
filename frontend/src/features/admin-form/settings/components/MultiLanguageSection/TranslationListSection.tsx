import { useCallback, useMemo } from 'react'
import { BiArrowBack, BiCheck, BiError } from 'react-icons/bi'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import _ from 'lodash'

import {
  BasicField,
  FormField,
  FormFieldDto,
  Language,
  TableFieldBase,
  TranslationMapping,
  TranslationOptionMapping,
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
  hasTranslations: boolean
  unicodeLocale: string
  formFieldNum?: number
  isStartPage?: boolean
  isEndPage?: boolean
}

export const QuestionRow = ({
  questionTitle,
  icon,
  isMyInfoField,
  hasTranslations,
  unicodeLocale,
  formFieldNum = -1,
  isStartPage = false,
  isEndPage = false,
}: QuestionRowProps): JSX.Element => {
  const [, setSearchParams] = useSearchParams()

  const isTranslationRowDisabled = isMyInfoField

  const translationInput = isEndPage
    ? 'endPage'
    : isStartPage
      ? 'startPage'
      : formFieldNum.toString()

  const handleOnListClick = useCallback(() => {
    setSearchParams({ unicodeLocale, translationInput })
  }, [setSearchParams, translationInput, unicodeLocale])

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

const getHasFormFieldBaseTranslations = ({
  titleTranslations,
  description,
  descriptionTranslations,
  unicodeLocale,
}: {
  titleTranslations: TranslationMapping[]
  description: string
  descriptionTranslations: TranslationMapping[]
  unicodeLocale: Language
}) => {
  const hasTitleTranslation = titleTranslations.some(
    (titleTranslation) =>
      titleTranslation.language === unicodeLocale &&
      !_.isEmpty(titleTranslation.translation),
  )

  // Value to represent whether or not the required field have translations for description.
  // If form field has no description, resolve to true because no translations are required for the field.
  const hasDescriptionTranslation =
    _.isEmpty(description) ||
    descriptionTranslations.some(
      (descriptionTranslation) =>
        descriptionTranslation.language === unicodeLocale &&
        descriptionTranslation.translation,
    )

  return hasTitleTranslation && hasDescriptionTranslation
}

const getHasFieldOptionsTranslation = ({
  fieldOptions,
  fieldOptionsTranslations,
  unicodeLocale,
}: {
  fieldOptions: string[]
  fieldOptionsTranslations: TranslationOptionMapping[]
  unicodeLocale: Language
}) => {
  if (!_.isEmpty(fieldOptions)) {
    const relevantTranslation = fieldOptionsTranslations?.find(
      (translation) => translation.language === unicodeLocale,
    )
    return (
      (relevantTranslation?.translation?.length ?? 0) === fieldOptions.length
    )
  }

  return true
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

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/language`)
  }, [formId, navigate])

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
      (translations) =>
        translations.language === unicodeLocale &&
        !_.isEmpty(translations.translation),
    )
    const hasEndPageParagraphTranslations = paragraphTranslations.some(
      (translations) =>
        translations.language === unicodeLocale &&
        !_.isEmpty(translations.translation),
    )

    return (
      hasEndPageTitleTranslations &&
      (_.isEmpty(paragraph) || hasEndPageParagraphTranslations)
    )
  }, [form?.endPage, unicodeLocale])

  const getHasTranslations = useCallback(
    (formField: FormFieldDto<FormField>): boolean => {
      const {
        titleTranslations = [],
        description,
        descriptionTranslations = [],
        fieldType,
      } = formField

      const hasFormFieldBaseTranslation = getHasFormFieldBaseTranslations({
        titleTranslations,
        description,
        descriptionTranslations,
        unicodeLocale,
      })

      let hasFieldOptionsTranslation = true
      if (
        fieldType === BasicField.Checkbox ||
        fieldType === BasicField.Radio ||
        fieldType === BasicField.Dropdown
      ) {
        const { fieldOptions, fieldOptionsTranslations = [] } = formField

        hasFieldOptionsTranslation = getHasFieldOptionsTranslation({
          fieldOptions,
          fieldOptionsTranslations,
          unicodeLocale,
        })
      }

      let hasTableColumnTranslations = true
      if (fieldType === BasicField.Table) {
        const { columns } = formField as FormFieldDto<TableFieldBase>

        // Filter out columns that have translations and check if
        // filtered out array length is equal to number of columns of
        // table field
        hasTableColumnTranslations =
          columns.filter((column) => {
            const { titleTranslations = [] } = column

            // ColumnBase does not have description and descriptionTranslations
            const hasColumnBaseTranslations = getHasFormFieldBaseTranslations({
              titleTranslations,
              description: '',
              descriptionTranslations: [],
              unicodeLocale,
            })

            if (column.columnType === BasicField.Dropdown) {
              const { fieldOptions, fieldOptionsTranslations = [] } = column

              return (
                hasColumnBaseTranslations &&
                getHasFieldOptionsTranslation({
                  fieldOptions,
                  fieldOptionsTranslations,
                  unicodeLocale,
                })
              )
            }

            return hasColumnBaseTranslations
          }).length === columns.length
      }

      return (
        hasFormFieldBaseTranslation &&
        hasFieldOptionsTranslation &&
        hasTableColumnTranslations
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
                key="Instructions"
                questionTitle="Instructions"
                icon={BxsDockTop}
                isMyInfoField={false}
                hasTranslations={hasStartPageTranslations}
                isStartPage={true}
                unicodeLocale={language}
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
                  key={form_field._id}
                  questionTitle={form_field.title}
                  icon={questionIcon}
                  isMyInfoField={isMyInfoField}
                  hasTranslations={getHasTranslations(form_field)}
                  formFieldNum={id}
                  unicodeLocale={language}
                />
                <Divider />
              </>
            )
          })}

          {/* End Page Translation */}
          {form.endPage && (
            <QuestionRow
              key="End Page"
              questionTitle={form.endPage?.title ?? ''}
              icon={PhHandsClapping}
              isMyInfoField={false}
              hasTranslations={hasEndPageTranslations}
              isEndPage={true}
              unicodeLocale={language}
            />
          )}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
