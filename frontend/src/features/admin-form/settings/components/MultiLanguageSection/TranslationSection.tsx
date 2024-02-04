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
} from '@chakra-ui/react'

import { Language } from '~shared/types'

import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
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
    <Flex
      direction="row"
      px="1rem"
      py="1.5rem"
      justifyItems="center"
      alignContent="center"
      opacity={isMyInfoField ? 0.3 : 1}
    >
      <Icon as={icon} fontSize="1.25rem" color="secondary.500" mr="1.5rem" />
      <Text>{toTranslateString}</Text>
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
      <Flex justifyItems="center">
        <IconButton
          variant="clear"
          colorScheme="primary"
          aria-label="Back Button"
          icon={<BiArrowBack fontSize="1.25rem" />}
          onClick={handleOnBackClick}
        />
        <Flex direction="column" w="100%">
          <CategoryHeader>{language}</CategoryHeader>
          {form?.form_fields.map((form_field, id) => {
            return (
              <>
                <QuestionRow
                  key={id}
                  toTranslateString={form_field.title}
                  icon={BASICFIELD_TO_DRAWER_META[form_field.fieldType].icon}
                  isMyInfoField={isMyInfo(form_field)}
                />
                <Divider />
              </>
            )
          })}
        </Flex>
      </Flex>
    </Skeleton>
  )
}
