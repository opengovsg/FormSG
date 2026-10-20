import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegFilePdf } from 'react-icons/fa6'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Skeleton, Stack, Text, TextProps } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { AnalyticsEventType } from 'formsg-shared/types'

import IconButton from '~components/IconButton'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'
import { logAnalyticsEvent } from '~features/analytics/AnalyticsEventService'
import { useUser } from '~features/user/queries'

import { downloadResponsePdf } from './utils/generateResponsePdf'
import { useIndividualSubmission } from './queries'

export const IndividualResponseTitle = ({
  textStyle = 'h2',
}: {
  textStyle?: TextProps['textStyle']
}): JSX.Element => {
  const { t } = useTranslation()
  const { state } = useLocation()
  const { formId, submissionId } = useParams()
  const isDelightfulDashboard = useIsDelightfulDashboard()

  const currentResponseNumber = useMemo(() => {
    return (state as { responseNumber?: number })?.responseNumber
  }, [state])

  const { data: form, isLoading: isFormLoading } = useAdminForm()
  const { data: submission, isLoading: isSubmissionLoading } =
    useIndividualSubmission()
  const isLoading = isFormLoading || isSubmissionLoading

  const { user } = useUser()

  const isAdminPrintPdfEnabled = useFeatureIsOn(featureFlags.adminPrintPdf)

  return (
    <Skeleton isLoaded={!isLoading} minW={0}>
      <Stack direction="row" justify="center" align="center">
        <Text textStyle={textStyle} as="h2" overflowWrap="anywhere">
          {t('features.common.response')}
          {currentResponseNumber ? ` #${currentResponseNumber}` : ''}
        </Text>
        {isAdminPrintPdfEnabled && (
          <Box flexShrink={0}>
            <IconButton
              aria-label="Print"
              icon={<FaRegFilePdf />}
              isLoading={isLoading}
              onClick={async () => {
                logAnalyticsEvent(formId, {
                  type: AnalyticsEventType.ResultsDownload,
                  content: {
                    dashboardVersion: isDelightfulDashboard ? 'v2' : 'v1',
                    formats: ['pdf'],
                    scope: 'single',
                  },
                })
                datadogLogs.logger.info(
                  `IndividualResponseNavbar: admin printing pdf`,
                  {
                    meta: {
                      action: 'adminPrintPdf',
                      userId: user?._id,
                      submissionId: submissionId,
                    },
                  },
                )
                if (submission && form) {
                  await downloadResponsePdf({ form, submission })
                }
              }}
              variant="clear"
            />
          </Box>
        )}
      </Stack>
    </Skeleton>
  )
}
