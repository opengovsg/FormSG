import { KeyboardEventHandler, useCallback } from 'react'
import { Controller, RegisterOptions, useForm } from 'react-hook-form'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { isEmpty } from 'lodash'

import { useFormTitleValidationRules } from '~utils/formValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

export const FormDetailsSection = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings}>
      <Stack spacing="2rem">
        {settings ? <FormTitleInput initialTitle={settings.title} /> : null}
      </Stack>
    </Skeleton>
  )
}

interface FormTitleInputProps {
  initialTitle: string
}
export const FormTitleInput = ({
  initialTitle,
}: FormTitleInputProps): JSX.Element => {
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
  const formTitleValidationRules = useFormTitleValidationRules()

  const handleBlur = useCallback(() => {
    return handleSubmit(
      ({ title }) => {
        if (title === initialTitle) return

        return mutateFormTitle.mutate(title, {
          onError: () => reset(),
          onSuccess: () => reset({ title }),
        })
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

      <Controller<{ title: string }>
        control={control}
        name="title"
        rules={formTitleValidationRules as RegisterOptions<{ title: string }>}
        render={({ field }) => (
          <Input {...field} onBlur={handleBlur} onKeyDown={handleKeyDown} />
        )}
      />
      <FormErrorMessage>{String(errors.title?.message)}</FormErrorMessage>
    </FormControl>
  )
}
