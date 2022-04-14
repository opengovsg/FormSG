import { CSVLink } from 'react-csv'
import { Data } from 'react-csv/components/CommonPropTypes'
import { BiDownload } from 'react-icons/bi'

import Button from '~components/Button'

type FeedbackDownloadButtonProps = {
  isDisabled: boolean
  formId: string | undefined
  feedbackData: string | Data
}

export const FeedbackDownloadButton = (props: FeedbackDownloadButtonProps) => {
  const { isDisabled, formId, feedbackData } = props

  return (
    <Button
      disabled={isDisabled}
      as={isDisabled ? undefined : CSVLink}
      filename={`${formId}-feedback.csv`}
      data={feedbackData}
      target="_blank"
      leftIcon={<BiDownload />}
    >
      Export{' '}
    </Button>
  )
}
