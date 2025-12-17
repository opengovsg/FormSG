import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Flex, TabList, Tabs } from '@chakra-ui/react'
import { BiBarChartAlt2, BiCommentDetail, BiTable } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { FormResponseMode } from '~shared/types'

import {
  ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX,
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  RESULTS_CHARTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'
import { useDraggable } from '~hooks/useDraggable'
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
  const navigate = useNavigate()
  const { data: form } = useAdminForm()
  const { pathname } = useLocation()
  const { t } = useTranslation()

  if (!formId) throw new Error('No formId provided')

  const checkTabActive = useCallback(
    (to: string) => {
      const match = pathname.match(ACTIVE_ADMINFORM_RESULTS_ROUTE_REGEX)
      return (match?.[2] ?? '/') === `/${to}`
    },
    [pathname],
  )

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

  const handleTabChange = (index: number) => {
    const subRoute = tabConfig[index].path
    const path = subRoute
      ? `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}/${subRoute}`
      : `${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_RESULTS_SUBROUTE}`
    navigate(path)
  }
  const tabIndex = tabConfig.findIndex((tab) => checkTabActive(tab.path))

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
