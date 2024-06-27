import { useCallback } from 'react'

import { FormSettings } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'

interface FormSingleSubmissionPerNricToggleProps {
  settings: FormSettings
  isDisabled: boolean
}

export const FormSingleSubmissionToggle = ({
  settings,
  isDisabled,
}: FormSingleSubmissionPerNricToggleProps): JSX.Element => {
  const { mutateIsSingleSubmission } = useMutateFormSettings()
  const isSingleSubmission = !!settings?.isSingleSubmission
  const isLoading = !settings || mutateIsSingleSubmission.isLoading

  const handleToggleIsSingleSubmission = useCallback(() => {
    if (isLoading) return
    const nextIsSingleSubmission = !settings.isSingleSubmission
    return mutateIsSingleSubmission.mutate(nextIsSingleSubmission)
  }, [settings, isLoading, mutateIsSingleSubmission])

  return (
    <Toggle
      containerStyles={{ opacity: isDisabled ? 0.3 : 1 }}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isChecked={isSingleSubmission}
      label="Limit each unique NRIC/FIN to one response"
      onChange={handleToggleIsSingleSubmission}
    />
  )
}
