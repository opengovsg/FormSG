import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Flex, Text, useDisclosure } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormId } from 'formsg-shared/types/form/form'

import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'
import { CreateFormFlowStates } from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { DuplicateFormModal } from '~features/workspace/components/DuplicateFormModal'

import { usePaymentGuideLink } from './queries'

export const PaymentsUnsupportedMsg = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.payments.paymentUnsupportedMsg',
  })
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const { data: paymentGuideLink } = usePaymentGuideLink()
  const { formId } = useParams()
  const dupeModal = useDisclosure()
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        {isMrfCutoverEnabled
          ? t('cutoverShortDescription')
          : t('shortDescription')}
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        {isMrfCutoverEnabled ? (
          <>
            {t('cutoverLongDescription')}&nbsp;
            <Link cursor="pointer" onClick={dupeModal.onOpen}>
              {t('cutoverDuplicateLink')}
            </Link>{' '}
            {t('cutoverDuplicateSuffix')}
          </>
        ) : (
          <>
            {t('longDescription')}&nbsp;
            <Link isExternal href={paymentGuideLink}>
              {t('learnMore')}
            </Link>
          </>
        )}
      </Text>
      <SettingsUnsupportedSvgr />
      <DuplicateFormModal
        isOpen={dupeModal.isOpen}
        onClose={dupeModal.onClose}
        formIdToDuplicate={formId as FormId}
        initialStep={CreateFormFlowStates.StorageModeDetails}
      />
    </Flex>
  )
}
