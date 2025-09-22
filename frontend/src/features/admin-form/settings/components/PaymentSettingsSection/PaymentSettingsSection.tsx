import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.disabledRationaleText',
  })
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
        {t('genericRationale.toEnable')}
        <UnorderedList spacing="0.5rem" mt="1rem">
          {isAdminEmailsPresent ? (
            <ListItem>
              <Link as={ReactLink} to={'email-notifications'}>
                {t('genericRationale.removeAdminEmail')}
              </Link>
            </ListItem>
          ) : undefined}
          {isPDFResponseEnabled ? (
            <ListItem>
              <Link as={ReactLink} to={`/admin/form/${formId}`}>
                {t('genericRationale.turnOffPdfResponses')}
              </Link>
            </ListItem>
          ) : undefined}
          {isSingleSubmission ? (
            <ListItem>
              <Link as={ReactLink} to={'singpass'}>
                {t('genericRationale.disableSingleSubmission')}
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
        {t('adminEmailsPresent.removeToEnable')}{' '}
        <Link as={ReactLink} to={'email-notifications'}>
          {t('adminEmailsPresent.emailNotifications')}
        </Link>
        .
      </Text>
    )
  }
  if (isSingleSubmission) {
    return (
      <Text>
        {t('singleSubmission.disableSingleSubmission')}{' '}
        <Link as={ReactLink} to={'singpass'}>
          {t('singleSubmission.singleSubmissionPerNricFinUen')}
        </Link>
        .
      </Text>
    )
  }
  if (isPDFResponseEnabled) {
    return (
      <Text>
        {t('pdfResponseEnabled.toEnable')}{' '}
        <Link as={ReactLink} to={`/admin/form/${formId}`}>
          {t('pdfResponseEnabled.disablePdfResponses')}
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
  const { t } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.settings.payments.beforeConnectionInstructions',
  })
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
          <Text>{t('invalidDomain')}</Text>
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
          <InlineMessage>
            <Text>
              {t('setupGuide.read')}{' '}
              <Link isExternal variant="inline" href={paymentGuideLink}>
                {t('setupGuide.ourGuide')}
              </Link>{' '}
              {t('setupGuide.setupOrConnectStripeText')}
            </Text>
          </InlineMessage>
        )}

        <Text textStyle="h3" color="secondary.500">
          {t('bulkTransactionText.bulkTransactionRate')}
        </Text>
        <Text>
          {t('bulkTransactionText.useBulkTransactionRates')}{' '}
          <Link href={GUIDE_STRIPE_ONBOARDING} target="_blank">
            {t('bulkTransactionText.thisForm')}
          </Link>{' '}
          {t('bulkTransactionText.contactForAssistance')}{' '}
          <Text as="b">
            {t('bulkTransactionText.defaultTransactionRatesWarning')}
          </Text>
        </Text>

        {/* Stripe connect button should only be enabled when checkbox is checked. */}
        <Checkbox
          isChecked={allowConnect}
          mb="2rem"
          onChange={(e) => setAllowConnect(e.target.checked)}
        >
          {t('bulkTransactionText.acknowledgeWarningText')}
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
            <Text>{t('testMode')}</Text>
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.afterConnectionInfo',
  })
  let connectionInfo: JSX.Element

  if (adminFormPaymentsError) {
    // Base case: Error retrieving form payments data
    connectionInfo = (
      <ConnectionStatusText
        color="danger.500"
        icon={BxsError}
        text={t('genericPaymentsError')}
      />
    )
  } else if (isProductionEnv) {
    if (hasPaymentCapabilities) {
      // Live mode: Account connected successfully and can be charged
      connectionInfo = (
        <ConnectionStatusText
          color="success.700"
          icon={BxsCheckCircle}
          text={t('stripeAccountConnected')}
        />
      )
    } else {
      // Live mode: Linked account has no payment capabilities.
      connectionInfo = (
        <ConnectionStatusText
          color="warning.500"
          icon={BxsInfoCircle}
          text={t('noPaymentCapabilities')}
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
          text={t('testModeStripeAccountConnected')}
        />
      )
    } else {
      // Test mode: Stripe account connection step skipped
      connectionInfo = (
        <ConnectionStatusText
          color="success.700"
          icon={BxsCheckCircle}
          text={t('testModeStripeConnectionSkipped')}
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
  const { t } = useTranslation('translation', {
    keyPrefix:
      'features.adminForm.settings.payments.paymentsAccountInformation',
  })
  return (
    <FormControl mb="2.5rem">
      <FormLabel description={t('labelDescription')} isRequired>
        {t('label')}
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
