import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Flex } from '@chakra-ui/layout'
import { FormControl, Stack } from '@chakra-ui/react'
import validator from 'validator'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useMutateFormSettings } from '../../mutations'

type SettingsInput = {
  title: string
  paragraph: string
  buttonText: string
  buttonLink: string
}

interface EndPageSettingsInputProps {
  settings: {
    title: string
    paragraph?: string
    buttonLink?: string
    buttonText: string
  }
}

export const EndPageSettingsInput = ({
  settings,
}: EndPageSettingsInputProps): JSX.Element => {
  const { title, paragraph, buttonText, buttonLink } = settings
  const { mutateFormEndPage } = useMutateFormSettings()

  const {
    register,
    formState: { errors, isValid },
    resetField,
    handleSubmit,
  } = useForm<SettingsInput>({
    mode: 'onBlur',
    defaultValues: {
      title: title,
      paragraph: paragraph ?? '',
      buttonText: buttonText,
      buttonLink: buttonLink ?? '',
    },
  })

  const handleUpdateEndPage = useCallback(() => {
    return handleSubmit((endPage) => {
      if (
        endPage.title === title &&
        endPage.buttonText === buttonText &&
        endPage.buttonLink === buttonLink &&
        endPage.paragraph === paragraph
      ) {
        return
      }

      return mutateFormEndPage.mutate(endPage)
    })()
  }, [
    buttonLink,
    buttonText,
    handleSubmit,
    mutateFormEndPage,
    paragraph,
    title,
  ])

  const handleUpdateButtonLink = useCallback(() => {
    if (!isValid) {
      return resetField('buttonLink')
    }
    return handleUpdateEndPage()
  }, [handleUpdateEndPage, isValid, resetField])

  return (
    <Stack gap="2rem" paddingTop="2.5rem">
      <FormControl isInvalid={!!errors.title}>
        <FormLabel isRequired>Title</FormLabel>
        <Input {...register('title')} onBlur={handleUpdateEndPage} />
        <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.paragraph}>
        <FormLabel isRequired>Follow-up paragraph</FormLabel>
        <Textarea {...register('paragraph')} onBlur={handleUpdateEndPage} />
        <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
      </FormControl>
      <Flex gap="1rem">
        <FormControl isInvalid={!!errors.buttonText}>
          <FormLabel isRequired>Button text</FormLabel>
          <Input {...register('buttonText')} onBlur={handleUpdateEndPage} />
          <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.buttonLink}>
          <FormLabel isRequired>Button redirect link</FormLabel>
          <Input
            {...register('buttonLink', {
              onBlur: handleUpdateButtonLink,
              validate: (url) =>
                validator.isURL(url, {
                  protocols: ['https'],
                }) || 'Please enter a valid URL (starting with https://)',
            })}
            placeholder="Default form link"
          />
          <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
        </FormControl>
      </Flex>
    </Stack>
  )
}
