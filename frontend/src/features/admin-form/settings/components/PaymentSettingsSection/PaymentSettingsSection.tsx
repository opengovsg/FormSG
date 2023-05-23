import { useState } from 'react'
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
import Checkbox from '~components/Checkbox'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'

import { useEnv } from '~features/env/queries'

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
  const { data: { secretEnv } = {} } = useEnv()
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

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
  } else if (secretEnv === 'production') {
    return (
      <Skeleton isLoaded={!isLoading}>
        <InlineMessage variant="info" my="2rem">
          <Text>
            Read{' '}
            <Link isExternal href={GUIDE_PAYMENTS}>
              our guide
            </Link>{' '}
            to set up a Stripe account. To enjoy bulk tender transaction rates,
            send your Stripe account ID and raise a purchase order to Stripe.
          </Text>
        </InlineMessage>
        <Checkbox
          isChecked={disclaimerChecked}
          mb="2rem"
          onChange={(e) => setDisclaimerChecked(e.target.checked)}
        >
          I understand that if I do not send my Stripe account ID and raise a
          purchase order to Stripe, I will be paying default transaction rates.
        </Checkbox>
        <StripeConnectButton isDisabled={!disclaimerChecked} />
      </Skeleton>
    )
  } else {
    return (
      <Skeleton isLoaded={!isLoading}>
        <InlineMessage variant="info" my="2rem">
          <Text>
            You are currently in test mode. You can choose to skip connecting a
            Stripe account after clicking the button below.
          </Text>
        </InlineMessage>
        <StripeConnectButton />
      </Skeleton>
    )
  }
}

export const PaymentSettingsSection = (): JSX.Element => {
  const { hasPaymentCapabilities, data } = useAdminFormPayments()
  return (
    <>
      <PaymentsSectionText />
      {data?.account ? (
        <StripeConnectButton stripeAccount={data?.account} />
      ) : null}
      {hasPaymentCapabilities && (
        <>
          <Divider my="2.5rem" />
          <BusinessInfoSection />
        </>
      )}
    </>
  )
}
