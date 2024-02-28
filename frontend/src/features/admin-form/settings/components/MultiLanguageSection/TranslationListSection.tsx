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

import { ADMINFORM_ROUTE } from '~constants/routes'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FieldListOption } from '~features/admin-form/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/FieldListOption'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { isMyInfo } from '~features/myinfo/utils'

import { CategoryHeader } from '../CategoryHeader'

interface QuestionRowProps {
  toTranslateString: string
  icon: As
  isMyInfoField: boolean
  formFieldNum: number
  hasTranslations: boolean
}

export const QuestionRow = ({
  toTranslateString,
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
    <Flex
      direction="row"
      justifyItems="center"
      alignContent="center"
      whiteSpace="nowrap"
    >
      <Tooltip
        label={isMyInfoField ? 'Myinfo fields cannot be translated' : ''}
        hasArrow
        placement="top"
      >
        <FieldListOption
          isDisabled={isTranslationRowDisabled}
          onClick={() => handleOnListClick()}
          minW="100%"
          paddingX="1.5rem"
          maxH="3.5rem"
          display="flex"
        >
          <Icon fontSize="1.5rem" as={icon} />
          <Text textStyle="body-1" overflow="hidden" textOverflow="ellipsis">
            {toTranslateString}
          </Text>
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

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      <Flex>
        <IconButton
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          size="sm"
          icon={<BiArrowBack fontSize="1.25rem" />}
          onClick={handleOnBackClick}
          marginRight="2.25rem"
        />
        <Flex direction="column">
          <CategoryHeader>{uppercaseLanguage}</CategoryHeader>
          {form?.form_fields.map((form_field, id, arr) => {
            const hasTranslations = form_field?.titleTranslations.length !== 0
            return (
              <>
                <QuestionRow
                  key={id}
                  toTranslateString={form_field.title}
                  icon={BASICFIELD_TO_DRAWER_META[form_field.fieldType].icon}
                  isMyInfoField={isMyInfo(form_field)}
                  formFieldNum={id}
                  hasTranslations={hasTranslations}
                />
                {id < arr.length - 1 && <Divider />}
              </>
            )
          })}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
