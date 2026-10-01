import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiBell, BiCheck } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import { responsesPageNs } from '~/i18n/locales/features/admin-form/responses/responses-page'

import Button from '~components/Button'

import { useFormRemindersMutations } from '~features/admin-form/common/mutations'
import { useGetIndividualDecryptedSubmission } from '~features/admin-form/responses/IndividualResponsePage/queries'

export const SendReminderButton = ({
  submissionId,
}: {
  submissionId: string
}) => {
  const { t } = useTranslation(responsesPageNs)
  const { t: tCommon } = useTranslation('translation', {
    keyPrefix: 'features.common',
  })

  const { formId = '' } = useParams()

  const { sendReminderForResponseMutation } = useFormRemindersMutations()

  const sendReminderForResponse = sendReminderForResponseMutation

  const [isSent, setIsSent] = useState(false)

  const { data: submissionData, isLoading: isLoadingSubmissionData } =
    useGetIndividualDecryptedSubmission({
      formId,
      submissionId,
    })
  const submissionSecretKey = submissionData?.submissionSecretKey
  const stepToken = submissionData?.stepToken

  if (!formId) {
    return null
  }

  return !isSent ? (
    <Button
      isLoading={isLoadingSubmissionData}
      loadingText={
        isLoadingSubmissionData ? tCommon('loading') : tCommon('sending')
      }
      m="0"
      p="0"
      variant="clear"
      leftIcon={<BiBell />}
      _focus={{}}
      _hover={{}}
      _active={{}}
      onClick={(e) => {
        e.stopPropagation()
        if (!submissionSecretKey) {
          return
        }
        sendReminderForResponse.mutate({
          formId,
          submissionId,
          submissionSecretKey,
          stepToken,
        })
        setIsSent(true)
      }}
    >
      <Text textStyle="subhead-2">
        {t(
          'storage.unlockedResponses.responsesTable.sendReminderButton.sendReminder',
        )}
      </Text>
    </Button>
  ) : (
    <Button variant="clear" m="0" p="0" leftIcon={<BiCheck />} isDisabled>
      <Text textStyle="subhead-2">
        {t(
          'storage.unlockedResponses.responsesTable.sendReminderButton.reminderSent',
        )}
      </Text>
    </Button>
  )
}
