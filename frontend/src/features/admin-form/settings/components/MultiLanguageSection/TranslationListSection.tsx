import { Dispatch, SetStateAction, useCallback } from 'react'
import { BiArrowBack } from 'react-icons/bi'
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

import { Language } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FieldListOption } from '~features/admin-form/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/FieldListOption'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { isMyInfo } from '~features/myinfo/utils'

import { CategoryHeader } from '../CategoryHeader'

interface QuestionRowProps {
  toTranslateString: string
  icon: As
  isMyInfoField: boolean
}

interface TranslationSectionProps {
  language: Language
  setIsFormToggle: Dispatch<SetStateAction<boolean>>
}

export const QuestionRow = ({
  toTranslateString,
  icon,
  isMyInfoField,
}: QuestionRowProps): JSX.Element => {
  return (
    <Flex direction="row" justifyItems="center" alignContent="center">
      <Tooltip
        label={isMyInfoField ? 'Myinfo fields cannot be translated' : ''}
        hasArrow
        placement="top"
      >
        <FieldListOption
          isDisabled={isMyInfoField}
          onClick={() => console.log('click')}
          w="100%"
        >
          <Icon fontSize="1.5rem" as={icon} />
          <Text textStyle="body-1">{toTranslateString}</Text>
        </FieldListOption>
      </Tooltip>
    </Flex>
  )
}

export const TranslationSection = ({
  language,
  setIsFormToggle,
}: TranslationSectionProps): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  console.log(form)
  const handleOnBackClick = useCallback(() => {
    setIsFormToggle(true)
  }, [setIsFormToggle])

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      <Flex>
        <IconButton
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          icon={<BiArrowBack fontSize="1.25rem" />}
          onClick={handleOnBackClick}
          justifySelf="flex-start"
          marginRight="2.25rem"
        />
        <Flex direction="column" w="100%">
          <CategoryHeader>{language}</CategoryHeader>
          {form?.form_fields.map((form_field, id, arr) => {
            return (
              <>
                <QuestionRow
                  key={id}
                  toTranslateString={form_field.title}
                  icon={BASICFIELD_TO_DRAWER_META[form_field.fieldType].icon}
                  isMyInfoField={isMyInfo(form_field)}
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
