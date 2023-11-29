import { useLocation } from 'react-router-dom'
import { Box, Container, Divider, Stack } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

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
  const { data: form, isLoading } = useAdminForm()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()
  const { pathname } = useLocation()
  const chartsMaxResponseCount = useFeatureValue('chartsMaxResponseCount', 100) // limit number of responses to 100 as fallback
  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
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
        title="No charts generated yet."
        subtitle="Charts will be generated when you receive responses on your form."
      />
    )
  }

  if (responseCount >= chartsMaxResponseCount) {
    return (
      <EmptyChartsContainer
        title="No charts generated"
        subtitle={`Charts is in beta and limited to forms with a maximum of ${chartsMaxResponseCount} responses.`}
      />
    )
  }

  return secretKey ? (
    <UnlockedCharts />
  ) : (
    <>
      <SecretKeyVerification
        hideResponseCount
        heroSvg={<ChartsSvgr />}
        ctaText="View charts"
        label="Enter or upload Secret Key to view charts"
      />
      <Container p={0} maxW="42.5rem">
        <Box mt="2rem" mb="0.5rem">
          <Divider />
        </Box>
        <Stack>
          <ChartsSupportedFieldsInfoBox />
        </Stack>
      </Container>
    </>
  )
}
