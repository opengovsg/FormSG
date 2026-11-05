import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Box, Container, Divider, Flex, Stack } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useResultsNavLayout } from '../components/FormResultsNavbar'
import { SecretKeyVerification } from '../components/SecretKeyVerification'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

import { ChartsSvgr } from './UnlockedCharts/assets/svgr/ChartsSvgr'
import { ChartsSupportedFieldsInfoBox } from './UnlockedCharts/components/ChartsSupportedFieldsInfoBox'
import { EmptyChartsContainer } from './UnlockedCharts/components/EmptyChartsContainer'
import { CHARTS_FALLBACK_MAX_RESPONSE_COUNT } from './constants'
import UnlockedCharts from './UnlockedCharts'

export const ChartsPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { bleed: resultsNavBleed } = useResultsNavLayout()
  const { data: form, isLoading } = useAdminForm()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()
  const { pathname } = useLocation()
  const chartsMaxResponseCount = useFeatureValue(
    featureFlags.chartsMaxResponseCount,
    CHARTS_FALLBACK_MAX_RESPONSE_COUNT,
  )
  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description: t('features.adminForm.toasts.form.retrieval.error'),
    })
    return <ResponsesPageSkeleton />
  }

  const responseCount = totalResponsesCount || 0

  if (responseCount === 0) {
    return (
      <EmptyChartsContainer
        title={t(
          'features.adminForm.responses.charts.emptyChartContainer.noResponses.title',
        )}
        subtitle={t(
          'features.adminForm.responses.charts.emptyChartContainer.noResponses.subtitle',
        )}
      />
    )
  }

  if (responseCount > chartsMaxResponseCount) {
    return (
      <EmptyChartsContainer
        title={t(
          'features.adminForm.responses.charts.emptyChartContainer.tooManyResponses.title',
        )}
        subtitle={t(
          'features.adminForm.responses.charts.emptyChartContainer.tooManyResponses.subtitle',
        )}
      />
    )
  }

  return secretKey ? (
    <UnlockedCharts />
  ) : (
    <Flex
      flexDir="column"
      align="center"
      pb="4rem"
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      {...resultsNavBleed}
    >
      <Container p={0} maxW="42.5rem">
        <SecretKeyVerification
          hideResponseCount
          heroSvg={<ChartsSvgr />}
          ctaText={t(
            'features.adminForm.responses.charts.chartsPage.secretKeyVerification.ctaText',
          )}
          label={t(
            'features.adminForm.responses.charts.chartsPage.secretKeyVerification.label',
          )}
        />
        <Box mt="2rem" mb="0.5rem">
          <Divider />
        </Box>
        <Stack>
          <ChartsSupportedFieldsInfoBox />
        </Stack>
      </Container>
    </Flex>
  )
}
