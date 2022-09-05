import { useCallback } from 'react'
import { BiDownload } from 'react-icons/bi'

import Button from '~components/Button'

import { downloadFormFeedback } from './FeedbackService'

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
  const handleClick = useCallback(
    () => downloadFormFeedback(formId || '', formTitle || ''),
    [formId, formTitle],
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
