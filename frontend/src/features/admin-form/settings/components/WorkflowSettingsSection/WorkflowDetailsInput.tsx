import { KeyboardEventHandler, useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FormControl, FormErrorMessage, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings, WorkflowType } from '~shared/types'

import { INVALID_EMAIL_ERROR } from '~constants/validation'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useMutateFormSettings } from '../../mutations'

export const WorkflowDetailsInput = ({
  settings,
}: {
  settings: MultirespondentFormSettings
}): JSX.Element => {
  const { mutateWorkflowSettings } = useMutateFormSettings()

  const existingSecondRespEmail = useMemo(
    () => settings.workflow && settings.workflow[1]?.emails[1],
    [settings],
  )

  const existingThirdRespEmail = useMemo(
    () => settings.workflow && settings.workflow[2]?.emails[2],
    [settings],
  )

  const existingWorkflow = useMemo(
    () =>
      settings.workflow && settings.workflow.length > 0
        ? [...settings.workflow]
        : Array(3).fill({
            emails: [],
            workflow_type: WorkflowType.Static,
          }),
    [settings],
  )

  const validateEmail = useCallback((value: string) => {
    if (!value) return true
    return isEmail(value.trim()) || INVALID_EMAIL_ERROR
  }, [])

  const {
    register,
    formState: { errors, isValid },
    getValues,
  } = useForm<{
    secondRespondent: string
    thirdRespondent: string
  }>({
    mode: 'onChange',
    defaultValues: {
      secondRespondent: existingSecondRespEmail ?? '',
      thirdRespondent: existingThirdRespEmail ?? '',
    },
  })

  const handleUpdateEmail = useCallback(() => {
    const nextSecondEmail = getValues('secondRespondent')
    const nextThirdEmail = getValues('thirdRespondent')

    const newWorkflow = [...existingWorkflow]
    newWorkflow[1].emails = [nextSecondEmail]
    newWorkflow[2].emails = [nextThirdEmail]
    mutateWorkflowSettings.mutate(newWorkflow)
  }, [getValues, existingWorkflow, mutateWorkflowSettings])

  const handleEmailInputKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      if (!isValid || e.key !== 'Enter') return
      return inputRef.current?.blur()
    },
    [isValid],
  )

  const handleEmailInputBlur = useCallback(() => {
    if (isValid) {
      return handleUpdateEmail()
    }
    return
  }, [isValid, handleUpdateEmail])

  const secondEmailRegister = register('secondRespondent', {
    onBlur: handleEmailInputBlur,
    validate: validateEmail,
  })

  const thirdEmailRegister = register('thirdRespondent', {
    onBlur: handleEmailInputBlur,
    validate: validateEmail,
  })

  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <Stack spacing="2.5rem">
      <FormControl isRequired>
        <FormLabel description="This is the respondent that starts the workflow">
          First respondent
        </FormLabel>
        <Input isDisabled placeholder="Anyone with the form link" />
      </FormControl>
      <FormControl isInvalid={!!errors.secondRespondent} isRequired>
        <FormLabel description="Enter the email of the respondent that should fill in this form after the first respondent">
          Second respondent
        </FormLabel>
        <Input
          {...secondEmailRegister}
          onKeyDown={handleEmailInputKeyDown}
          placeholder="me@example.com"
        />
        {errors.secondRespondent && (
          <FormErrorMessage>{errors.secondRespondent.message}</FormErrorMessage>
        )}
      </FormControl>
      <FormControl isInvalid={!!errors.thirdRespondent} isRequired>
        <FormLabel description="Enter the email of the respondent that should fill in this form after the second respondent">
          Third respondent
        </FormLabel>
        <Input
          {...thirdEmailRegister}
          onKeyDown={handleEmailInputKeyDown}
          placeholder="me@example.com"
        />
        {errors.thirdRespondent && (
          <FormErrorMessage>{errors.thirdRespondent.message}</FormErrorMessage>
        )}
      </FormControl>
    </Stack>
  )
}
