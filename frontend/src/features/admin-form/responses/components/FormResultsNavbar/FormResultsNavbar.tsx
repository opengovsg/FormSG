import { useTranslation } from 'react-i18next'
import { BiBarChartAlt2, BiCommentDetail, BiTable } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { useParams } from 'react-router-dom'
import { TabList } from '@chakra-ui/react'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { FormResponseMode } from '~shared/types'

import {
  RESULTS_CHARTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'
import { noPrintCss } from '~utils/noPrintCss'

import { useAdminForm } from '~features/admin-form/common/queries'

import { ResultsTab } from './ResultsTab'

interface TabEntry {
  label: string
  icon: IconType
  path: string
  showBadge?: boolean
  badgeText?: string
}

export const FormResultsNavbar = (): JSX.Element => {
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const { t } = useTranslation()

  if (!formId) throw new Error('No formId provided')

  const isChartsEnabled = useFeatureValue('charts', false)
  const isFormEncryptMode = form?.responseMode === FormResponseMode.Encrypt
  const shouldShowCharts = isFormEncryptMode && isChartsEnabled

  // Temporary debug - remove after checking
  console.log('Charts Debug:', {
    isChartsEnabled,
    isFormEncryptMode,
    formResponseMode: form?.responseMode,
    shouldShowCharts,
  })

  const tabConfig: TabEntry[] = [
    {
      label: t('features.common.responses'),
      icon: BiTable,
      path: RESULTS_RESPONSES_SUBROUTE,
    },
    {
      label: t('features.common.feedback'),
      icon: BiCommentDetail,
      path: RESULTS_FEEDBACK_SUBROUTE,
    },
    ...(shouldShowCharts
      ? [
          {
            label: t('features.common.charts'),
            icon: BiBarChartAlt2,
            path: RESULTS_CHARTS_SUBROUTE,
            showBadge: true,
            badgeText: t('features.common.beta'),
          },
        ]
      : []),
  ]

  return (
    <TabList
      sx={noPrintCss}
      overflowX="initial"
      display="inline-flex"
      w={{ base: 'auto', lg: '13rem' }}
      mr={{ base: '1.5rem', md: '4rem', lg: '2rem' }}
      mb="calc(0.5rem - 2px)"
    >
      {tabConfig.map((tab) => (
        <ResultsTab
          key={tab.path}
          label={tab.label}
          icon={tab.icon}
          showBadge={tab.showBadge}
          badgeText={tab.badgeText}
        />
      ))}
    </TabList>
  )
}
