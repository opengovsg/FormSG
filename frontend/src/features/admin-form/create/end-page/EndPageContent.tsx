import { useMemo } from 'react'
import { Box, Flex, Stack } from '@chakra-ui/react'

import {
  FormAuthType,
  FormColorTheme,
  FormLogoState,
  FormResponseMode,
} from '~shared/types'

import { EndPageBlock } from '~components/FormEndPage/EndPageBlock'
import { PaymentsThankYouSvgr } from '~components/FormEndPage/PaymentsThankYouSvgr'
import { ThankYouSvgr } from '~components/FormEndPage/ThankYouSvgr'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  PREVIEW_MASKED_MOCK_UINFIN,
  PREVIEW_MOCK_UINFIN,
} from '~features/admin-form/preview/constants'
import { useEnv } from '~features/env/queries'
import {
  FormBannerLogo,
  useFormBannerLogo,
} from '~features/public-form/components/FormLogo'

import { useDesignColorTheme } from '../builder-and-design/utils/useDesignColorTheme'

import { PaymentEndPageBlock } from './PaymentEndPageBlock'
import { dataSelector, useEndPageStore } from './useEndPageStore'

export const EndPageContent = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const endPageFromStore = useEndPageStore(dataSelector)

  // When drawer is opened, store is populated. We always want the drawer settings
  // to be previewed, so when the store is populated, prioritize that setting.
  const endPage = useMemo(
    () => (endPageFromStore ? endPageFromStore : form?.endPage),
    [endPageFromStore, form?.endPage],
  )
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const colorTheme = useDesignColorTheme()

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl,
    logo: form?.startPage.logo,
    agency: form?.admin.agency,
    colorTheme: form?.startPage.colorTheme,
    showDefaultLogoIfNoLogo: true,
  })

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form.payments_field.enabled

  const backgroundColor = isPaymentEnabled ? 'transparent' : 'white'

  const endPageContent = endPage ?? {
    title: '',
    buttonText: '',
    paymentTitle: '',
    paymentParagraph: '',
  }

  const thankYouSvg = isPaymentEnabled ? (
    <Flex backgroundColor="primary.100" justifyContent="center" py="1rem">
      <PaymentsThankYouSvgr h="100%" />
    </Flex>
  ) : (
    <Flex backgroundColor="primary.100" justifyContent="center">
      <ThankYouSvgr h="100%" pt="2.5rem" />
    </Flex>
  )

  return (
    <Flex
      mb={0}
      flex={1}
      bg="neutral.200"
      pt={{ base: 0, md: '2rem' }}
      pb={{ base: 0, md: '2rem' }}
      px={{ base: 0, md: '2rem' }}
      justify="center"
      overflow="auto"
    >
      <Stack w="100%" h="fit-content" bg="primary.100">
        <FormBannerLogo
          isLoading={isLoading}
          {...formBannerLogoProps}
          onLogout={undefined}
          loggedInId={
            form && form.authType !== FormAuthType.NIL
              ? form.isSubmitterIdCollectionEnabled
                ? PREVIEW_MASKED_MOCK_UINFIN
                : PREVIEW_MOCK_UINFIN
              : undefined
          }
        />
        {thankYouSvg}
        <Stack>
          {isPaymentEnabled ? (
            <Box px={{ base: '1.5rem', md: '4rem' }} bg={backgroundColor}>
              <PaymentEndPageBlock
                submissionData={{
                  id: form?._id ?? 'Submission ID',
                  timestamp: Date.now(),
                }}
                endPage={endPageContent}
              />
            </Box>
          ) : (
            <Box
              px={{ base: '1.5rem', md: '4rem' }}
              py={{ base: '1.5rem', md: '3rem' }}
              bg={backgroundColor}
            >
              <EndPageBlock
                formTitle={form?.title}
                endPage={endPageContent}
                submissionData={{
                  id: form?._id ?? 'Submission ID',
                  timestamp: Date.now(),
                }}
                colorTheme={colorTheme ?? FormColorTheme.Blue}
              />
            </Box>
          )}
        </Stack>
      </Stack>
    </Flex>
  )
}
