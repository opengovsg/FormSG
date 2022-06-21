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

interface EndPageSettingsInputProps {
  endPage: FormEndPage
}

export const EndPageSettingsInput = ({
  endPage,
}: EndPageSettingsInputProps): JSX.Element => {
  const { mutateFormEndPage } = useMutateFormPage()

  const defaultParagraph = useMemo(() => endPage.paragraph ?? '', [endPage])
  const defaultButtonLink = useMemo(() => endPage.buttonLink ?? '', [endPage])
  const buttonLinkValidation = useMemo(() => {
    return { protocols: ['https'], require_protocol: true }
  }, [])

  const {
    register,
    formState: { errors },
    resetField,
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onChange',
    defaultValues: endPage,
  })

  const handleUpdateEndPage = useCallback(() => {
    return handleSubmit((data) => {
      if (
        data.title === endPage.title &&
        data.buttonText === endPage.buttonText &&
        data.buttonLink === defaultButtonLink &&
        data.paragraph === defaultParagraph
      ) {
        return
      }

      return mutateFormEndPage.mutate(endPage)
    })()
  }, [
    defaultButtonLink,
    defaultParagraph,
    endPage,
    handleSubmit,
    mutateFormEndPage,
  ])

  const handleUpdateButtonLink = useCallback(() => {
    if (errors.buttonLink) {
      return resetField('buttonLink')
    }

    return handleUpdateEndPage()
  }, [errors.buttonLink, handleUpdateEndPage, resetField])

  return (
    <Stack gap="2rem" paddingTop="2.5rem">
      <FormControl isInvalid={!!errors.title}>
        <FormLabel isRequired>Title</FormLabel>
        <Input
          {...register('title', {
            required: 'Title is required for the Thank You page',
          })}
          onBlur={handleUpdateEndPage}
        />
        <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!!errors.paragraph}>
        <FormLabel isRequired>Follow-up instructions</FormLabel>
        <Textarea
          {...register('paragraph', {
            required:
              'Follow-up instructions are required for the Thank You page',
          })}
          onBlur={handleUpdateEndPage}
        />
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
          <Input
            placeholder="Default form link"
            {...register('buttonLink', {
              onBlur: handleUpdateButtonLink,
              validate: (url) =>
                !url ||
                validator.isURL(url, buttonLinkValidation) ||
                'Please enter a valid URL (starting with https://)',
            })}
          />
          <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
        </FormControl>
        {/* TODO (hans): Check with designers to use submit button instead onblur autosave*/}
      </Stack>
    </Stack>
  )
}
