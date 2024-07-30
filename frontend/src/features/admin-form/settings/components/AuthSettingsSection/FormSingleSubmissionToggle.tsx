import { useCallback } from 'react'
import { Link as ReactLink } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import { PaymentChannel } from '~shared/types'
import { FormResponseMode, FormSettings } from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
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

  const isPaymentsEnabled =
    settings &&
    settings.responseMode === FormResponseMode.Encrypt &&
    (settings.payments_channel.channel !== PaymentChannel.Unconnected ||
      settings.payments_field.enabled)

  const handleToggleIsSingleSubmission = useCallback(() => {
    if (isLoading) return
    const nextIsSingleSubmission = !settings.isSingleSubmission
    return mutateIsSingleSubmission.mutate(nextIsSingleSubmission)
  }, [settings, isLoading, mutateIsSingleSubmission])

  return (
    <>
      <Toggle
        containerStyles={{ opacity: isDisabled ? 0.3 : 1 }}
        isDisabled={isDisabled || isPaymentsEnabled}
        isLoading={isLoading}
        isChecked={isSingleSubmission}
        label="Limit each unique NRIC/FIN/UEN to one response"
        onChange={handleToggleIsSingleSubmission}
      />
      {isPaymentsEnabled ? (
        <InlineMessage mt="1rem">
          <Text>
            To allow only one submission per NRIC/FIN/UEN,{' '}
            <Link as={ReactLink} to={'payments'}>
              disconnect your stripe account
            </Link>
            . Doing this will also remove all payment fields from your form.
          </Text>
        </InlineMessage>
      ) : null}
    </>
  )
}
