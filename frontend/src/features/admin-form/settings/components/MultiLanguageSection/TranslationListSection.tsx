import { useCallback } from 'react'
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
import _ from 'lodash'

import { FormField, FormFieldDto } from '~shared/types'

import { ADMINFORM_ROUTE } from '~constants/routes'

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
}

export const QuestionRow = ({
  questionTitle,
  icon,
  isMyInfoField,
  formFieldNum,
  hasTranslations,
}: QuestionRowProps): JSX.Element => {
  const { formId, language } = useParams()
  const navigate = useNavigate()
  const isTranslationRowDisabled = isMyInfoField

  const handleOnListClick = useCallback(() => {
    if (!isTranslationRowDisabled)
      navigate(
        `${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${language}`,
        { state: { isTranslation: true, formFieldNum } },
      )
  }, [formFieldNum, formId, isTranslationRowDisabled, language, navigate])

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
          disabled={isMyInfoField}
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
}): JSX.Element => {
  const { formId } = useParams()
  const { data: form, isLoading } = useAdminForm()
  const navigate = useNavigate()

  const uppercaseLanguage = language.charAt(0).toUpperCase() + language.slice(1)

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/multi-language`)
  }, [formId, navigate])

  const getHasTranslations = useCallback(
    (form_field: FormFieldDto<FormField>): boolean => {
      let hasTranslations = true
      if (!_.isEmpty(form_field.title) && form_field.titleTranslations) {
        hasTranslations =
          hasTranslations &&
          (form_field.titleTranslations?.some(
            (titleTranslation) =>
              titleTranslation.language === uppercaseLanguage &&
              !_.isEmpty(titleTranslation.translation),
          ) ??
            false)
      }

      if (
        !_.isEmpty(form_field.description) &&
        form_field.descriptionTranslations
      ) {
        hasTranslations =
          hasTranslations &&
          (form_field.descriptionTranslations?.some(
            (descriptionTranslation) =>
              descriptionTranslation.language === uppercaseLanguage &&
              !_.isEmpty(descriptionTranslation.translation),
          ) ??
            false)
      }

      return hasTranslations
    },
    [uppercaseLanguage],
  )

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
        <Flex direction="column">
          <CategoryHeader py={2}>{uppercaseLanguage}</CategoryHeader>
          {form?.form_fields.map((form_field, id, arr) => {
            const isLastQuestion = arr.length - 1 === id
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
                {!isLastQuestion && <Divider />}
              </>
            )
          })}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
