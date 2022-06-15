import { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl, Stack } from '@chakra-ui/react'
import validator from 'validator'

import { FormEndPage } from '~shared/types'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

export const EndPageSettingsInput = ({
  title,
  paragraph,
  buttonLink,
  buttonText,
}: FormEndPage): JSX.Element => {
  const { mutateFormEndPage } = useMutateFormPage()

  const defaultParagraph = useMemo(() => paragraph ?? '', [paragraph])
  const defaultButtonLink = useMemo(() => buttonLink ?? '', [buttonLink])

  const {
    register,
    formState: { errors },
    resetField,
    handleSubmit,
  } = useForm<FormEndPage>({
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
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '2rem', md: '1rem' }}
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
