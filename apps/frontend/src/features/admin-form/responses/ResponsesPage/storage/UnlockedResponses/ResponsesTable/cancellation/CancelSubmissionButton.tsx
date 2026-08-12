import { useTranslation } from 'react-i18next'
import { BiX } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useCancelMrfSubmissionMutation } from '~features/admin-form/common/mutations'

export const CancelSubmissionButton = ({
  submissionId,
}: {
  submissionId: string
}) => {
  const { t } = useTranslation()

  const { formId = '' } = useParams()

  const { cancelSubmissionMutation } = useCancelMrfSubmissionMutation()

  if (!formId) {
    return null
  }

  return (
    <Button
      isLoading={cancelSubmissionMutation.isLoading}
      loadingText={t('features.common.loading')}
      m="0"
      p="0"
      variant="clear"
      colorScheme="danger"
      leftIcon={<BiX />}
      _focus={{}}
      _hover={{}}
      _active={{}}
      onClick={(e) => {
        e.stopPropagation()
        cancelSubmissionMutation.mutate({ formId, submissionId })
      }}
    >
      <Text textStyle="subhead-2">
        {t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.responsesTable.cancelSubmissionButton.cancelSubmission',
        )}
      </Text>
    </Button>
  )
}
