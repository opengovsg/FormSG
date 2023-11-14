import { FormResponseMode } from '~shared/types/form'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { SecretKeyVerification } from '../components/SecretKeyVerification'
import { ResponsesPageSkeleton } from '../ResponsesPage/ResponsesPageSkeleton'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

import { ChartsSvgr } from './UnlockedCharts/assets/svgr/ChartsSvgr'
import { EmptyChartsContainer } from './UnlockedCharts/components/EmptyChartsContainer'
import UnlockedCharts from './UnlockedCharts'

export const ChartsPage = (): JSX.Element => {
  const { data: form, isLoading } = useAdminForm()
  const { totalResponsesCount, secretKey } = useStorageResponsesContext()

  const toast = useToast({ status: 'danger' })

  if (isLoading) return <ResponsesPageSkeleton />

  if (!form) {
    toast({
      description:
        'There was an error retrieving your form. Please try again later.',
    })
    return <ResponsesPageSkeleton />
  }

  if (form.responseMode === FormResponseMode.Email) {
    return <></>
  }

  if (totalResponsesCount === 0) {
    return (
      <EmptyChartsContainer
        title={'No charts generated yet.'}
        subtitle={
          'Charts will be generated when you receive responses on your form.'
        }
      />
    )
  }

  return secretKey ? (
    <UnlockedCharts />
  ) : (
    <SecretKeyVerification
      hideResponseCount
      heroSvg={<ChartsSvgr />}
      ctaText="View charts"
      label="Enter or upload Secret Key to view charts"
    />
  )
}
