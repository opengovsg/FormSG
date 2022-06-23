import { useMemo } from 'react'
import { FieldValues, useForm } from 'react-hook-form'
import { Flex, FormControl, Stack } from '@chakra-ui/react'
import validator from 'validator'

import { FormEndPage } from '~shared/types'

import Button from '~components/Button'
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

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onChange',
    defaultValues: endPage,
  })

  const buttonLinkRules = useMemo(() => {
    return {
      validate: (url: string) =>
        !url ||
        validator.isURL(url, {
          protocols: ['https'],
          require_protocol: true,
        }) ||
        'Please enter a valid URL (starting with https://)',
    } as FieldValues
  }, [])

  const handleUpdateEndPage = handleSubmit((endPage) =>
    mutateFormEndPage.mutate(endPage),
  )

  return (
    <Stack gap="2rem" paddingTop="2.5rem">
      <FormControl isInvalid={!!errors.title}>
        <FormLabel isRequired>Title</FormLabel>
        <Input
          {...register('title', {
            required: 'Title is required for the Thank You page',
          })}
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
        />
        <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
      </FormControl>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '2rem', md: '1rem' }}
      >
        <FormControl isInvalid={!!errors.buttonText}>
          <FormLabel isRequired>Button text</FormLabel>
          <Input {...register('buttonText')} />
          <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.buttonLink}>
          <FormLabel isRequired>Button redirect link</FormLabel>
          <Input
            placeholder="Default form link"
            {...register('buttonLink', buttonLinkRules)}
          />
          <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
        </FormControl>
      </Stack>
      <Flex>
        <Button onClick={handleUpdateEndPage}>Save</Button>
      </Flex>
    </Stack>
  )
}
