import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FaRegFilePdf } from 'react-icons/fa6'
import { useLocation, useParams } from 'react-router-dom'
import { Box, Skeleton, Stack, Text, TextProps } from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import IconButton from '~components/IconButton'

import { useAdminForm } from '~features/admin-form/common/queries'
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
  const { submissionId } = useParams()

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
    <Skeleton isLoaded={!isLoading}>
      <Stack direction="row" justify="center" align="center">
        <Text textStyle={textStyle} as="h2">
          {t('features.common.response')}
          {currentResponseNumber ? ` #${currentResponseNumber}` : ''}
        </Text>
        {isAdminPrintPdfEnabled && (
          <Box>
            <IconButton
              aria-label="Print"
              icon={<FaRegFilePdf />}
              isLoading={isLoading}
              onClick={async () => {
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
