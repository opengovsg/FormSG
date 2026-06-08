import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiMailSend, BiRightArrowAlt } from 'react-icons/bi'
import { ButtonGroup, Code, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import IconButton from '~components/IconButton'
import Tooltip from '~components/Tooltip'

import { trackClickSecretKeyMailTo } from '~features/analytics/AnalyticsService'

import { useSaveSecretKey } from '../CreateFormModal/CreateFormModalContent/useSaveSecretKey'

import { StepCard, type StepStatus } from './StepCard'

export const SecretKeyStep = ({
  secretKey,
  formTitle,
  formId,
  onNext,
}: SecretKeyStepProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.workspace.modals.forms.create',
  })

  const [storageAck, setStorageAck] = useState(false)

  const {
    hasCopiedKey,
    handleCopyKey,
    hasDownloadedKey,
    handleDownloadKey,
    mailToHref,
  } = useSaveSecretKey({
    secretKey,
    formTitle,
    formId,
    onClose: () => {},
    isFormStateValid: true,
  })

  const isSubmitEnabled = hasDownloadedKey && storageAck

  const step1Status: StepStatus = hasDownloadedKey ? 'done' : 'active'
  const step2Status: StepStatus = !hasDownloadedKey
    ? 'pending'
    : storageAck
      ? 'done'
      : 'active'

  return (
    <Stack spacing="1.5rem" maxW="36rem">
      <Text textStyle="h2" color="secondary.700">
        Save your Secret Key safely to continue
      </Text>

      <Stack spacing="2rem">
        {/* Step 1: Download Secret Key */}
        <StepCard
          status={step1Status}
          stepNumber={1}
          title="Download your Secret Key"
        >
          <Stack spacing="1rem">
            <Text textStyle="body-2" color="secondary.500">
              {t('secretKey.message.preamble1')}{' '}
              {t('secretKey.message.preamble2.prefix')}
              <Text color="danger.500" textStyle="subhead-2" as="span">
                {t('secretKey.message.preamble2.warning')}
              </Text>
              .
            </Text>

            <Tooltip
              mt={0}
              label={t(
                `secretKey.tooltip.${hasCopiedKey ? 'copied' : 'copyKey'}`,
              )}
            >
              <Code
                data-group
                tabIndex={0}
                transition="background 0.2s ease"
                cursor="pointer"
                onClick={handleCopyKey}
                _groupFocus={{ bg: 'neutral.400' }}
                _hover={{ bg: 'neutral.300' }}
                wordBreak="break-word"
                display="inline-flex"
                alignItems="center"
                w="100%"
                h="auto"
                px="0.75rem"
                py="0.625rem"
                bg="neutral.200"
                color="secondary.500"
                borderRadius="4px"
              >
                {secretKey}
              </Code>
            </Tooltip>

            <ButtonGroup>
              <Button onClick={handleDownloadKey}>
                {t('secretKey.download')}
              </Button>
              <IconButton
                as="a"
                icon={<BiMailSend />}
                aria-label={t('secretKey.mailSecretKey.aria')}
                href={mailToHref}
                variant="outline"
                onClick={() => trackClickSecretKeyMailTo(formTitle)}
              />
            </ButtonGroup>
          </Stack>
        </StepCard>

        {/* Step 2: Acknowledge */}
        <StepCard
          status={step2Status}
          stepNumber={2}
          title="Acknowledge after downloading"
        >
          <Stack spacing="0.75rem">
            <Checkbox
              isChecked={storageAck}
              onChange={(e) => setStorageAck(e.target.checked)}
              aria-label={t('secretKey.declaration.aria')}
            >
              {t('secretKey.declaration.text')}
            </Checkbox>
          </Stack>
        </StepCard>
      </Stack>

      {/* CTA Button */}
      <Button
        isDisabled={!isSubmitEnabled}
        rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
        onClick={onNext}
        isFullWidth
      >
        {t('secretKey.confirm')}
      </Button>
    </Stack>
  )
}
