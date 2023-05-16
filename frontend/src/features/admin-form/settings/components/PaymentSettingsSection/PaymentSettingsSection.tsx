import {
  Divider,
  Flex,
  FormControl,
  Icon,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode, PaymentChannel } from '~shared/types'

import { BxsCheckCircle, BxsError, BxsInfoCircle } from '~assets/icons'
import { GUIDE_PAYMENTS } from '~constants/links'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'

import { useAdminFormPayments, useAdminFormSettings } from '../../queries'

import { BusinessInfoSection } from './BusinessInfoSection'
import { StripeConnectButton } from './StripeConnectButton'

const PaymentsAccountValidation = () => {
  const { hasPaymentCapabilities, isLoading, isError } = useAdminFormPayments()

  if (isError) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <Flex mb="2.5rem">
          <Icon
            aria-hidden
            marginEnd="0.5em"
            color="danger.500"
            fontSize="1rem"
            h="1.5rem"
            as={BxsError}
            mr={2}
          />
          <Text>
            Something went wrong when validating the connected Stripe account
          </Text>
        </Flex>
      </Skeleton>
    )
  }

  if (hasPaymentCapabilities) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <Flex mb="2.5rem">
          <Icon
            aria-hidden
            marginEnd="0.5em"
            color="success.500"
            fontSize="1rem"
            h="1.5rem"
            as={BxsCheckCircle}
            mr={2}
          />
          <Text>Your Stripe account is linked to FormSG</Text>
        </Flex>
      </Skeleton>
    )
  }

  // Linked account has no payment capabilities.
  return (
    <Skeleton isLoaded={!isLoading}>
      <Flex mb="2.5rem">
        <Icon
          aria-hidden
          marginEnd="0.5em"
          color="warning.500"
          fontSize="1rem"
          h="1.5rem"
          as={BxsInfoCircle}
          mr={2}
        />
        <Text>
          The connected account does not have the ability to process payments.
        </Text>
      </Flex>
    </Skeleton>
  )
}

const PaymentsAccountInformation = ({
  account_id,
  isLoading,
}: {
  account_id: string
  isLoading: boolean
}) => {
  return (
    <FormControl mb="2.5rem">
      <FormLabel
        description="This is the account ID connected to this form."
        isRequired
      >
        Target Account ID
      </FormLabel>
      <Skeleton isLoaded={!isLoading}>
        <Input isDisabled={true} value={account_id}></Input>
      </Skeleton>
    </FormControl>
  )
}

const PaymentsSectionText = () => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (
    settings?.responseMode === FormResponseMode.Encrypt &&
    settings?.payments_channel.channel !== PaymentChannel.Unconnected
  ) {
    return (
      <>
        <PaymentsAccountValidation />
        <PaymentsAccountInformation
          account_id={settings.payments_channel.target_account_id}
          isLoading={isLoading}
        />
      </>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading} mb="2.5rem">
      <Text>
        Connect your Stripe account to this form to start collecting payments.
      </Text>
      <InlineMessage variant="info" mt="2rem">
        <Text>
          Don't have a Stripe account? Follow{' '}
          <Link isExternal href={GUIDE_PAYMENTS}>
            this guide
          </Link>{' '}
          to create one.
        </Text>
      </InlineMessage>
    </Skeleton>
  )
}

export const PaymentSettingsSection = (): JSX.Element => {
  const { hasPaymentCapabilities } = useAdminFormPayments()
  return (
    <>
      <PaymentsSectionText />
      <StripeConnectButton />
      {hasPaymentCapabilities && (
        <>
          <Divider my="2.5rem" />
          <BusinessInfoSection />
        </>
      )}
    </>
  )
}
