import { useTranslation } from 'react-i18next'
import { BiBarChartAlt2, BiCommentDetail, BiTable } from 'react-icons/bi'
import { IconType } from 'react-icons/lib'
import { useFeatureValue } from '@growthbook/growthbook-react'

import { FormResponseMode } from 'formsg-shared/types'

import {
  RESULTS_CHARTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
  RESULTS_RESPONSES_SUBROUTE,
} from '~constants/routes'

import { useAdminForm } from '~features/admin-form/common/queries'

export interface ResultsTabEntry {
  label: string
  icon: IconType
  path: string
  badgeText?: string
}

export const useResultsTabs = (): ResultsTabEntry[] => {
  const { t } = useTranslation()
  const { data: form } = useAdminForm()

  const isChartsEnabled = useFeatureValue('charts', false)
  const isFormEncryptModeOrMultirespondent =
    form?.responseMode === FormResponseMode.Encrypt ||
    form?.responseMode === FormResponseMode.Multirespondent
  const shouldShowCharts = isFormEncryptModeOrMultirespondent && isChartsEnabled

  return [
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
            badgeText: t('features.common.betaBadgeLabel'),
          },
        ]
      : []),
  ]
}
