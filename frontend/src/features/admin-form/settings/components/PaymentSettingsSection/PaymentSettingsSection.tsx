import { useMemo, useState } from 'react'
import { Link as ReactLink, useParams, useSearchParams } from 'react-router-dom'
import {
  As,
  Box,
  Divider,
  Flex,
  FormControl,
  Icon,
  ListItem,
  Skeleton,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react'
import { get, isEmpty } from 'lodash'

import {
  DISALLOW_CONNECT_NON_WHITELIST_STRIPE_ACCOUNT,
  ERROR_QUERY_PARAM_KEY,
} from '~shared/constants'
import { EmailFieldBase, FormResponseMode, PaymentChannel } from '~shared/types'

import { BxsCheckCircle, BxsError, BxsInfoCircle } from '~assets/icons'
import { GUIDE_STRIPE_ONBOARDING } from '~constants/links'
import Checkbox from '~components/Checkbox'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Link from '~components/Link'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useEnv } from '~features/env/queries'

import { useAdminFormPayments, useAdminFormSettings } from '../../queries'

import { BusinessInfoSection } from './BusinessInfoSection'
import { GstToggleSection } from './GstToggleSection'
import { usePaymentGuideLink } from './queries'
import {
  StripeConnectButton,
  StripeConnectButtonStates,
} from './StripeConnectButton'

const PaymentsDisabledRationaleText = ({
  isAdminEmailsPresent,
  isSingleSubmission,
  isPDFResponseEnabled,
}: {
  isAdminEmailsPresent: boolean
  isSingleSubmission: boolean
  isPDFResponseEnabled: boolean
}): JSX.Element => {
  const disabledCount = [
    isAdminEmailsPresent,
    isSingleSubmission,
    isPDFResponseEnabled,
  ].filter(Boolean).length

  const { formId } = useParams()
  if (!formId) return <></>

  if (disabledCount > 1) {
    return (
      <Text>
        To enable payment fields,
        <UnorderedList spacing="0.5rem" mt="1rem">
          {isAdminEmailsPresent ? (
            <ListItem>
              <Link as={ReactLink} to={'email-notifications'}>
                Remove all recipients from email notifications
              </Link>
            </ListItem>
          ) : undefined}
          {isPDFResponseEnabled ? (
            <ListItem>
              <Link as={ReactLink} to={`/admin/form/${formId}`}>
                Turn off "Include PDF responses" in all email fields
              </Link>
            </ListItem>
          ) : undefined}
          {isSingleSubmission ? (
            <ListItem>
              <Link as={ReactLink} to={'singpass'}>
                Disable only one submission per NRIC/FIN/UEN
              </Link>
            </ListItem>
          ) : undefined}
        </UnorderedList>
      </Text>
    )
  }

  if (isAdminEmailsPresent) {
    return (
      <Text>
        To enable payment fields, remove all recipients from{' '}
        <Link as={ReactLink} to={'email-notifications'}>
          email notifications
        </Link>
        .
      </Text>
    )
  }
  if (isSingleSubmission) {
    return (
      <Text>
        To enable payment fields, disable{' '}
        <Link as={ReactLink} to={'singpass'}>
          only one submission per NRIC/FIN/UEN
        </Link>
        .
      </Text>
    )
  }
  if (isPDFResponseEnabled) {
    return (
      <Text>
        To enable payment fields,{' '}
        <Link as={ReactLink} to={`/admin/form/${formId}`}>
          turn off "Include PDF Responses" in all email fields.
        </Link>
      </Text>
    )
  }
  return <></>
}

const BeforeConnectionInstructions = ({
  isProductionEnv,
}: {
  isProductionEnv: boolean
}): JSX.Element => {
  const [allowConnect, setAllowConnect] = useState(false)
  const { data: paymentGuideLink } = usePaymentGuideLink()
  const [searchParams] = useSearchParams()
  const { data: settings } = useAdminFormSettings()
  const { data: formDef } = useAdminForm()

  const queryParams = Object.fromEntries([...searchParams])
  const isInvalidDomain =
    queryParams[ERROR_QUERY_PARAM_KEY] ===
    DISALLOW_CONNECT_NON_WHITELIST_STRIPE_ACCOUNT

  const isAdminEmailsPresent = useMemo(() => {
    return (
      (settings?.responseMode === FormResponseMode.Email ||
        settings?.responseMode === FormResponseMode.Encrypt) &&
      !isEmpty(get(settings, 'emails', []))
    )
  }, [settings])

  const isPDFResponseEnabled = useMemo(() => {
    return (
      formDef?.form_fields
        .filter((field) => field.fieldType === 'email')
        .map((field) => field as EmailFieldBase)
        .map((field) => field.autoReplyOptions.includeFormSummary)
        .some((x) => x) ?? false
    )
  }, [formDef?.form_fields])

  const isSingleSubmission = !!settings?.isSingleSubmission

  const isPaymentsDisabled =
    isAdminEmailsPresent || isSingleSubmission || isPDFResponseEnabled

  if (isInvalidDomain) {
    return (
      <>
        <InlineMessage variant="error" my="2rem">
          <Text>
            Your Stripe account could not be connected because it was created
            with a non-whitelisted email domain. Try reconnecting an account
            that was created with a whitelisted email domain.
          </Text>
        </InlineMessage>
        <StripeConnectButton connectState={StripeConnectButtonStates.ENABLED} />
      </>
    )
  }
  if (isProductionEnv) {
    return (
      <VStack spacing="2.5rem" alignItems="start">
        {isPaymentsDisabled ? (
          <Box w="100%">
            <InlineMessage>
              <PaymentsDisabledRationaleText
                isAdminEmailsPresent={isAdminEmailsPresent}
                isSingleSubmission={isSingleSubmission}
                isPDFResponseEnabled={isPDFResponseEnabled}
              />
            </InlineMessage>
          </Box>
        ) : (
          <InlineMessage useMarkdown>
            {`Read [our guide](${paymentGuideLink}) to set up a Stripe account. If your agency already has a Stripe account, you can connect it to this form.`}
          </InlineMessage>
        )}

        <Text textStyle="h3" color="secondary.500">
          Bulk transaction rates
        </Text>
        <Text>
          To request bulk transaction rates for your payments, use{' '}
          <Link href={GUIDE_STRIPE_ONBOARDING} target="_blank">
            this form
          </Link>{' '}
          to contact us for assistance.{' '}
          <Text as="b">
            Without this step, you will be charged default transaction rates.
          </Text>
        </Text>

        {/* Stripe connect button should only be enabled when checkbox is checked. */}
        <Checkbox
          isChecked={allowConnect}
          mb="2rem"
          onChange={(e) => setAllowConnect(e.target.checked)}
        >
          I understand that I will be paying default transaction rates, unless I
          have requested bulk transaction rates and received confirmation
        </Checkbox>
        <StripeConnectButton
          connectState={
            allowConnect && !isPaymentsDisabled
              ? StripeConnectButtonStates.ENABLED
              : StripeConnectButtonStates.DISABLED
          }
        />
      </VStack>
    )
  }

  return (
    <>
      <VStack spacing="2.5rem" alignItems="start">
        {isPaymentsDisabled ? (
          <Box w="100%">
            <InlineMessage>
              <PaymentsDisabledRationaleText
                isAdminEmailsPresent={isAdminEmailsPresent}
                isSingleSubmission={isSingleSubmission}
                isPDFResponseEnabled={isPDFResponseEnabled}
              />
            </InlineMessage>
          </Box>
        ) : (
          <InlineMessage variant="info">
            <Text>
              You are currently in test mode. You can choose to skip connecting
              a Stripe account after clicking the button below.
            </Text>
          </InlineMessage>
        )}
        <StripeConnectButton
          connectState={
            !isPaymentsDisabled
              ? StripeConnectButtonStates.ENABLED
              : StripeConnectButtonStates.DISABLED
          }
        />
      </VStack>
    </>
  )
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
              <GstToggleSection />
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
