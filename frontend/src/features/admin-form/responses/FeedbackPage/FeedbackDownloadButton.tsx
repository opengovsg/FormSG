import { useMemo } from 'react'
import { CSVLink } from 'react-csv'
import { BiDownload } from 'react-icons/bi'

import { ProcessedFeedbackMeta } from '~shared/types'

import Button from '~components/Button'

type FeedbackDownloadButtonProps = {
  isDisabled: boolean
  formId: string | undefined
  feedback: ProcessedFeedbackMeta[] | undefined
}

export const FeedbackDownloadButton = ({
  feedback,
  isDisabled,
  formId,
}: FeedbackDownloadButtonProps) => {
  const data = useMemo(() => {
    if (!feedback) return ''
    return feedback?.map((entry) => ({
      index: entry.index,
      date: entry.date,
      feedback: entry.comment,
      rating: entry.rating,
    }))
  }, [feedback])

  return (
    <Button
      disabled={isDisabled}
      as={CSVLink}
      filename={`${formId}-feedback.csv`}
      data={data}
      target="_blank"
      leftIcon={<BiDownload fontSize="1.5rem" />}
    >
      Export
    </Button>
  )
}
