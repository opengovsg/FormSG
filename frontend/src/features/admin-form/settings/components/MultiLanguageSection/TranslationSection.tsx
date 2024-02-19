import { useCallback } from 'react'
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

import { ADMINFORM_ROUTE } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

export const TranslationContainer = ({
  language,
  defaultString,
}: {
  language: string
  defaultString: string | undefined
}): JSX.Element => {
  const uppercaseLanguage = language.charAt(0).toUpperCase() + language.slice(1)
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
          //   minHeight="auto"
          padding="0.75rem"
          resize="vertical"
        />
      </Flex>
      <Flex alignItems="center">
        <Text color="secondary.700" mr="7.5rem" width="6.25rem">
          {uppercaseLanguage}
        </Text>
        <FormControl>
          <Input type="translation" width="100%" />
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

  const toast = useToast({ status: 'danger' })

  if (!isLoading && !form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
  }

  const formData = form?.form_fields[formFieldNumToBeTranslated]

  const handleOnBackClick = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/settings/multi-language/${language}`)
  }, [formId, language, navigate])

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
            language={language}
            defaultString={formData?.title}
          />
        </Flex>
        <Divider mb="2.5rem" />
      </Flex>
    </Skeleton>
  )
}
