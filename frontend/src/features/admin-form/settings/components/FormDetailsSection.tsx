import { KeyboardEventHandler, useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import { FormResponseMode } from '~shared/types/form/form'

import { FORM_TITLE_VALIDATION_RULES } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

import { EmailFormSection } from './EmailFormSection'

export const FormDetailsSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Stack spacing="2rem">
        {settings ? <FormTitleInput initialTitle={settings.title} /> : null}
        {settings?.responseMode === FormResponseMode.Email ? (
          <EmailFormSection emails={settings.emails} />
        ) : null}
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
        rules={FORM_TITLE_VALIDATION_RULES}
        render={({ field }) => (
          <Input {...field} onBlur={handleBlur} onKeyDown={handleKeyDown} />
        )}
      />
      <FormErrorMessage>{get(errors, 'title.message')}</FormErrorMessage>
    </FormControl>
  )
}
