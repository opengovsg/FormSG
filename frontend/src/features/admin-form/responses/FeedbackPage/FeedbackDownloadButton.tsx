import { useCallback } from 'react'
import { BiDownload } from 'react-icons/bi'

import Button from '~components/Button'

import { useFormFeedbackMutations } from '../../common/mutations'

type FeedbackDownloadButtonProps = {
  isDisabled: boolean
  formId: string | undefined
  formTitle: string | undefined
}

export const FeedbackDownloadButton = ({
  isDisabled,
  formId,
  formTitle,
}: FeedbackDownloadButtonProps) => {
  const { downloadFormFeedbackMutation } = useFormFeedbackMutations()

  const handleClick = useCallback(() => {
    if (!formId || !formTitle) return
    return downloadFormFeedbackMutation.mutate({ formId, formTitle })
  }, [downloadFormFeedbackMutation, formId, formTitle])

  return (
    <Button
      isDisabled={isDisabled || downloadFormFeedbackMutation.isLoading}
      isLoading={downloadFormFeedbackMutation.isLoading}
      onClick={handleClick}
      leftIcon={<BiDownload fontSize="1.5rem" />}
    >
      Export
    </Button>
  )
}
