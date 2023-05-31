import { useState } from 'react'
import {
  As,
  Divider,
  Flex,
  FormControl,
  Icon,
  Skeleton,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode, PaymentChannel } from '~shared/types'

import { BxsCheckCircle, BxsError, BxsInfoCircle } from '~assets/icons'
import { GUIDE_STRIPE_ONBOARDING } from '~constants/links'
import Checkbox from '~components/Checkbox'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'

import { useEnv } from '~features/env/queries'

import { useAdminFormPayments, useAdminFormSettings } from '../../queries'

import { BusinessInfoSection } from './BusinessInfoSection'
import { usePaymentGuideLink } from './queries'
import {
  StripeConnectButton,
  StripeConnectButtonStates,
} from './StripeConnectButton'

const BeforeConnectionInstructions = ({
  isProductionEnv,
}: {
  isProductionEnv: boolean
}): JSX.Element => {
  const [allowConnect, setAllowConnect] = useState(false)
  const { data: paymentGuideLink } = usePaymentGuideLink()
  if (isProductionEnv) {
    return (
      <>
        <InlineMessage variant="info" my="2rem">
          <Text>
            Read{' '}
            <Link isExternal href={paymentGuideLink}>
              our guide
            </Link>{' '}
            to learn more about onboarding to Stripe. To enjoy bulk tender
            transaction rates,{' '}
            <Link href={GUIDE_STRIPE_ONBOARDING} target="_blank">
              use this form
            </Link>{' '}
            to submit your Stripe account ID and raise a purchase order to
            Stripe.
          </Text>
        </InlineMessage>
        {/* Stripe connect button should only be enabled when checkbox is checked. */}
        <Checkbox
          isChecked={allowConnect}
          mb="2rem"
          onChange={(e) => setAllowConnect(e.target.checked)}
        >
          I understand that if I do not send my Stripe account ID and raise a
          purchase order to Stripe, I will be paying default transaction rates.
        </Checkbox>
        <StripeConnectButton
          connectState={
            allowConnect
              ? StripeConnectButtonStates.ENABLED
              : StripeConnectButtonStates.DISABLED
          }
        />
      </>
    )
  } else {
    return (
      <>
        <InlineMessage variant="info" my="2rem">
          <Text>
            You are currently in test mode. You can choose to skip connecting a
            Stripe account after clicking the button below.
          </Text>
        </InlineMessage>
        <StripeConnectButton connectState={StripeConnectButtonStates.ENABLED} />
      </>
    )
  }
}

const ConnectionStatusText = ({
  color,
  icon,
  text,
}: {
  color: string
  icon: As
  text: string
}) => (
  <>
    <Icon
      aria-hidden
      marginEnd="0.5em"
      color={color}
      fontSize="1rem"
      h="1.5rem"
      as={icon}
      mr={2}
    />
    <Text>{text}</Text>
  </>
)

const AfterConnectionInfo = ({
  isProductionEnv,
  hasPaymentCapabilities,
  adminFormPaymentsError,
}: {
  isProductionEnv: boolean
  hasPaymentCapabilities: boolean
  adminFormPaymentsError: boolean
}): JSX.Element => {
  let connectionInfo: JSX.Element

  if (adminFormPaymentsError) {
    // Base case: Error retrieving form payments data
    connectionInfo = (
      <ConnectionStatusText
        color="danger.500"
        icon={BxsError}
        text="Something went wrong when validating the connected Stripe account."
      />
    )
  } else if (isProductionEnv) {
    if (hasPaymentCapabilities) {
      // Live mode: Account connected successfully and can be charged
      connectionInfo = (
        <ConnectionStatusText
          color="success.700"
          icon={BxsCheckCircle}
          text="Your Stripe account is connected to this Form."
        />
      )
    } else {
      // Live mode: Linked account has no payment capabilities.
      connectionInfo = (
        <ConnectionStatusText
          color="warning.500"
          icon={BxsInfoCircle}
          text="The connected account does not have the ability to process payments."
        />
      )
    }
  } else {
    if (hasPaymentCapabilities) {
      // Test mode: Account connected successfully but note that will only be on test mode
      connectionInfo = (
        <ConnectionStatusText
          color="success.700"
          icon={BxsCheckCircle}
          text="Stripe account connected. Payments made on this form will only show in test mode in your Stripe account."
        />
      )
    } else {
      // Test mode: Stripe account connection step skipped
      connectionInfo = (
        <ConnectionStatusText
          color="success.700"
          icon={BxsCheckCircle}
          text="You are connected to a test account."
        />
      )
    }
  }

  return <Flex mb="2.5rem">{connectionInfo}</Flex>
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

export const PaymentSettingsSection = (): JSX.Element => {
  const {
    hasPaymentCapabilities,
    isLoading: adminFormPaymentsLoading,
    isError: adminFormPaymentsError,
  } = useAdminFormPayments()

  const { data: settings, isLoading: settingsIsLoading } =
    useAdminFormSettings()
  const { data: { secretEnv } = {} } = useEnv()
  const isProductionEnv = secretEnv === 'production'

  return settings?.responseMode === FormResponseMode.Encrypt ? (
    <Skeleton isLoaded={!settingsIsLoading}>
      {settings.payments_channel.channel === PaymentChannel.Unconnected ? (
        <BeforeConnectionInstructions isProductionEnv={isProductionEnv} />
      ) : (
        <Skeleton isLoaded={!adminFormPaymentsLoading}>
          <AfterConnectionInfo
            isProductionEnv={isProductionEnv}
            hasPaymentCapabilities={hasPaymentCapabilities}
            adminFormPaymentsError={adminFormPaymentsError}
          />
          <PaymentsAccountInformation
            account_id={settings.payments_channel.target_account_id}
            isLoading={settingsIsLoading}
          />
          <StripeConnectButton
            connectState={StripeConnectButtonStates.LINKED}
          />
          {hasPaymentCapabilities && (
            <>
              <Divider my="2.5rem" />
              <BusinessInfoSection />
            </>
          )}
        </Skeleton>
      )}
    </Skeleton>
  ) : (
    <></>
  )
}
