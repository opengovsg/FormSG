import { KeyboardEventHandler, useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack, Text, Wrap } from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import { FormResponseMode } from '~shared/types/form/form'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { EmailFormSection } from './EmailFormSection'

export const FormDetailsSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const readableFormResponseMode = useMemo(() => {
    switch (settings?.responseMode) {
      case FormResponseMode.Email:
        return 'Email'
      case FormResponseMode.Encrypt:
        return 'Storage'
    }
  }, [settings?.responseMode])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Stack spacing="2rem">
        {settings ? <FormTitleInput initialTitle={settings.title} /> : null}
        {settings?.responseMode === FormResponseMode.Email ? (
          <EmailFormSection settings={settings} />
        ) : null}
        <Wrap shouldWrapChildren justify="space-between" textStyle="subhead-1">
          <Text>Mode for receiving responses</Text>
          <Text>{readableFormResponseMode}</Text>
        </Wrap>
      </Stack>
    </Skeleton>
  )
}

interface FormTitleInputProps {
  initialTitle: string
}
const FormTitleInput = ({ initialTitle }: FormTitleInputProps): JSX.Element => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: initialTitle,
    },
  })

  const validationRules = useMemo(
    () => ({
      required: 'Form name is required',
      minLength: {
        value: 2,
        message: 'Form name must be at least 4 characters',
      },
      maxLength: {
        value: 200,
        message: 'Form name must be at most 200 characters',
      },
      pattern: {
        value: /^[a-zA-Z0-9_\-./() &`;'"]*$/,
        message: 'Form name cannot contain special characters',
      },
    }),
    [],
  )

  const { mutateFormTitle } = useMutateFormSettings()

  const handleBlur = useCallback(() => {
    return handleSubmit(
      ({ title }) => {
        if (title === initialTitle) return

        return mutateFormTitle.mutate(title, { onError: () => reset() })
      },
      () => reset(),
    )()
  }, [handleSubmit, initialTitle, mutateFormTitle, reset])

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleBlur()
      }
    },
    [handleBlur],
  )

  return (
    <FormControl isInvalid={!isEmpty(errors)}>
      <FormLabel isRequired>Form name</FormLabel>

      <Controller
        control={control}
        name="title"
        rules={validationRules}
        render={({ field }) => (
          <Input {...field} onBlur={handleBlur} onKeyDown={handleKeyDown} />
        )}
      />
      <FormErrorMessage>{get(errors, 'title.message')}</FormErrorMessage>
    </FormControl>
  )
}
