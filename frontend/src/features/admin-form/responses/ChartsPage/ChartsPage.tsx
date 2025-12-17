import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Divider,
  Flex,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'
import { FormResponseMode } from '~shared/types/form'

import { ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX } from '~constants/routes'
import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { SecretKeyVerification } from '../components/SecretKeyVerification'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

import { ChartsSvgr } from './UnlockedCharts/assets/svgr/ChartsSvgr'
import { ChartsSupportedFieldsInfoBox } from './UnlockedCharts/components/ChartsSupportedFieldsInfoBox'
import { EmptyChartsContainer } from './UnlockedCharts/components/EmptyChartsContainer'
import UnlockedCharts from './UnlockedCharts'

export const ChartsPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: form, isLoading } = useAdminForm()
  const {
    totalResponsesCount,
    secretKey,
    isLoading: isResponsesLoading,
  } = useStorageResponsesContext()
  const { pathname } = useLocation()
  const chartsMaxResponseCount = useFeatureValue(
    featureFlags.chartsMaxResponseCount,
    100,
  ) // limit number of responses to 100 as fallback
  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description: t('features.adminForm.toasts.form.retrieval.error'),
    })
    return <ResponsesPageSkeleton />
  }

  // Charts is not available for Email response
  // Since there's no entry to the charts page for Email mode we should
  // forcefully redirect the user to the responses page
  // we need to redirect to one level up, i.e., '../'
  if (form.responseMode === FormResponseMode.Email) {
    /**
     * 0: "/admin/form/<form_id>/results/charts"
     * 1: "<form_id>"
     * 2: "/charts"
     */
    const match = pathname.match(ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX)
    const subroute = match?.[2]
    if (subroute) {
      const pathnameWithoutSubroute = pathname.replace(subroute, '')
      window.location.replace(pathnameWithoutSubroute)
    }
    return <></>
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
    <>
      <Flex
        flexDir="column"
        align="center"
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      >
        <Container p={0} maxW="42.5rem">
          <SecretKeyVerification
            heroSvg={<ChartsSvgr />}
            ctaText={t(
              'features.adminForm.responses.charts.chartsPage.secretKeyVerification.ctaText',
            )}
            label={t(
              'features.adminForm.responses.charts.chartsPage.secretKeyVerification.label',
            )}
          />
        </Container>
      </Flex>
      <Flex
        flexDir="column"
        align="center"
        pb="4rem"
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      >
        <Container p={0} maxW="42.5rem">
          <Box mt="2rem" mb="0.5rem">
            <Divider />
          </Box>
          <Stack>
            <ChartsSupportedFieldsInfoBox />
          </Stack>
        </Container>
      </Flex>
    </>
  )
}
