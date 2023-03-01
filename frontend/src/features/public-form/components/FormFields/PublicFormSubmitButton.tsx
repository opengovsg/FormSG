import { MouseEventHandler, useMemo } from 'react'
import { useFormState, useWatch } from 'react-hook-form'
import { Stack, VisuallyHidden } from '@chakra-ui/react'

import { FormField, LogicDto, MyInfoFormField } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { FormFieldValues } from '~templates/Field'

import { getLogicUnitPreventingSubmit } from '~features/logic/utils'

interface PublicFormSubmitButtonProps {
  formFields: MyInfoFormField<FormField>[]
  formLogics: LogicDto[]
  colorTheme: string
  onSubmit: MouseEventHandler<HTMLButtonElement> | undefined
}

/**
 * This component is split up so that input changes will not rerender the
 * entire FormFields component leading to terrible performance.
 */
export const PublicFormSubmitButton = ({
  formFields,
  formLogics,
  colorTheme,
  onSubmit,
}: PublicFormSubmitButtonProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { isSubmitting } = useFormState()
  const formInputs = useWatch<FormFieldValues>({}) as FormFieldValues

  const preventSubmissionLogic = useMemo(() => {
    return getLogicUnitPreventingSubmit({
      formInputs,
      formFields,
      formLogics,
    })
  }, [formInputs, formFields, formLogics])

  return (
    <Stack px={{ base: '1rem', md: 0 }} pt="2.5rem" pb="4rem">
      <Button
        isFullWidth={isMobile}
        w="100%"
        colorScheme={`theme-${colorTheme}` as ThemeColorScheme}
        type="button"
        isLoading={isSubmitting}
        isDisabled={!!preventSubmissionLogic || !onSubmit}
        loadingText="Submitting"
        onClick={onSubmit}
      >
        <VisuallyHidden>End of form.</VisuallyHidden>
        {preventSubmissionLogic ? 'Submission disabled' : 'Submit now'}
      </Button>
      {preventSubmissionLogic ? (
        <InlineMessage variant="warning">
          {preventSubmissionLogic.preventSubmitMessage}
        </InlineMessage>
      ) : null}
    </Stack>
  )
}
