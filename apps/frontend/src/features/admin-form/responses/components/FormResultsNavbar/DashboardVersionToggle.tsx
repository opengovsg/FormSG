import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Badge, Flex } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { AnalyticsEventType } from 'formsg-shared/types'

import { Switch } from '~components/Toggle/Switch'

import { logAnalyticsEvent } from '~features/analytics/AnalyticsEventService'

import { useResultsDashboardVersion } from '../../hooks/useIsDelightfulDashboard'
import { useStorageResponsesContext } from '../../ResponsesPage/storage'
import { V1Icon, V2Icon } from '../versionIcons'

export const DashboardVersionToggle = (): JSX.Element | null => {
  const { t } = useTranslation()
  const isEnabled = useFeatureIsOn(featureFlags.delightfulDashboard)
  const { formId } = useParams()
  const [version, setVersion] = useResultsDashboardVersion()
  // The version only changes the unlocked table, so the toggle stays hidden
  // until the secret key is in.
  const { secretKey } = useStorageResponsesContext()

  if (!isEnabled || !secretKey) return null

  return (
    <Flex align="center" gap="0.5rem" flexShrink={0}>
      <Flex lineHeight={0}>
        <Switch
          isChecked={version !== 'v1'}
          onChange={(event) => {
            const next = event.target.checked ? 'v2' : 'v1'
            logAnalyticsEvent(formId, {
              type: AnalyticsEventType.ResultsVersionToggled,
              content: { from: version === 'v1' ? 'v1' : 'v2', to: next },
            })
            setVersion(next)
          }}
          checkedIcon={V2Icon}
          uncheckedIcon={V1Icon}
          aria-label={t(
            'features.adminForm.responses.components.dashboardVersionToggle.label',
          )}
        />
      </Flex>
      <Badge colorScheme="primary" variant="subtle" color="secondary.500">
        {t('features.common.betaBadgeLabel')}
      </Badge>
    </Flex>
  )
}
