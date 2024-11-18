import { Skeleton } from '@chakra-ui/react'

import { FormResponseMode, FormSettings, FormStatus } from '~shared/types/form'
import { PaymentChannel } from '~shared/types/payment'

import FormLabel from '~components/FormControl/FormLabel'
import { TagInput } from '~components/TagInput'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailNotificationsHeader } from './components/EmailNotificationsHeader'
import { FormEmailSection } from './components/FormEmailSection'
import { MrfFormEmailSection } from './components/MrfFormEmailSection'
import { useAdminFormSettings } from './queries'

const FormEmailSectionSkeleton = (): JSX.Element => {
  return (
    <Skeleton>
      <FormLabel>Notifications for new responses</FormLabel>
      <TagInput placeholder="me@example.com" isDisabled />
    </Skeleton>
  )
}

interface FormEmailSectionContainerProps {
  isDisabled: boolean
  settings: FormSettings
}

const FormEmailSectionContainer = ({
  isDisabled,
  settings,
}: FormEmailSectionContainerProps): JSX.Element => {
  if (settings.responseMode === FormResponseMode.Multirespondent) {
    return <MrfFormEmailSection isDisabled={isDisabled} settings={settings} />
  }
  return <FormEmailSection isDisabled={isDisabled} settings={settings} />
}

export const SettingsEmailsPage = (): JSX.Element => {
  const { data: settings } = useAdminFormSettings()

  const isFormPublic = settings?.status === FormStatus.Public

  const isPaymentsEnabled = !!(
    settings &&
    settings.responseMode === FormResponseMode.Encrypt &&
    (settings.payments_channel.channel !== PaymentChannel.Unconnected ||
      settings.payments_field.enabled)
  )

  const isEmailMode = settings?.responseMode === FormResponseMode.Email

  const isDisabled = isFormPublic || isPaymentsEnabled

  return (
    <>
      <CategoryHeader>Email notifications</CategoryHeader>
      {settings ? (
        <>
          <EmailNotificationsHeader
            isFormPublic={isFormPublic}
            isPaymentsEnabled={isPaymentsEnabled}
            isFormResponseModeEmail={isEmailMode}
          />
          <FormEmailSectionContainer
            isDisabled={isDisabled}
            settings={settings}
          />
        </>
      ) : (
        <FormEmailSectionSkeleton />
      )}
    </>
  )
}
