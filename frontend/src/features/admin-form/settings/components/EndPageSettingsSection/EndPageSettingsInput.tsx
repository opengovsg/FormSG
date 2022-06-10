import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl, Stack } from '@chakra-ui/react'
import validator from 'validator'

import { useIsMobile } from '~hooks/useIsMobile'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useMutateFormSettings } from '../../mutations'

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

  const defaultParagraph = paragraph ?? ''
  const defaultButtonLink = buttonLink ?? ''
  const isMobile = useIsMobile()

  const {
    register,
    formState: { errors },
    resetField,
    handleSubmit,
  } = useForm<EndPageSettingsInputProps['settings']>({
    mode: 'onChange',
    defaultValues: {
      title: title,
      paragraph: defaultParagraph,
      buttonText: buttonText,
      buttonLink: defaultButtonLink,
    },
  })

  const handleUpdateEndPage = useCallback(() => {
    return handleSubmit((endPage) => {
      if (
        endPage.title === title &&
        endPage.buttonText === buttonText &&
        endPage.buttonLink === defaultButtonLink &&
        endPage.paragraph === defaultParagraph
      ) {
        return
      }

      return mutateFormEndPage.mutate(endPage)
    })()
  }, [
    buttonText,
    defaultButtonLink,
    defaultParagraph,
    handleSubmit,
    mutateFormEndPage,
    title,
  ])

  const handleUpdateButtonLink = useCallback(() => {
    if (errors.buttonLink) {
      return resetField('buttonLink')
    }

    return handleUpdateEndPage()
  }, [errors.buttonLink, handleUpdateEndPage, resetField])

  const buttonLinkRegister = register('buttonLink', {
    onBlur: handleUpdateButtonLink,
    validate: (url) =>
      !url ||
      validator.isURL(url, {
        protocols: ['https'],
        require_protocol: true,
      }) ||
      'Please enter a valid URL (starting with https://)',
  })

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
      <Stack
        direction={isMobile ? 'column' : 'row'}
        gap={isMobile ? '2rem' : '1rem'}
      >
        <FormControl isInvalid={!!errors.buttonText}>
          <FormLabel isRequired>Button text</FormLabel>
          <Input {...register('buttonText')} onBlur={handleUpdateEndPage} />
          <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.buttonLink}>
          <FormLabel isRequired>Button redirect link</FormLabel>
          <Input placeholder="Default form link" {...buttonLinkRegister} />
          <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
        </FormControl>
      </Stack>
    </Stack>
  )
}
