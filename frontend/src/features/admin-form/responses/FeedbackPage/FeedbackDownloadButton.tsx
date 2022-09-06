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
  const { downloadFormFeedbackMutation } = useFormFeedbackMutations(
    formId ?? '',
    formTitle ?? '',
  )

  const handleClick = useCallback(
    () => downloadFormFeedbackMutation.mutate(),
    [downloadFormFeedbackMutation],
  )

  return (
    <Button
      disabled={isDisabled}
      onClick={handleClick}
      leftIcon={<BiDownload fontSize="1.5rem" />}
    >
      Export
    </Button>
  )
}
