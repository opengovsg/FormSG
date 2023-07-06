import { BiDownload } from 'react-icons/bi'

import Button from '~components/Button'

type FeedbackDownloadButtonProps = {
  isDisabled: boolean
  isLoading: boolean
  handleClick: () => void
}

export const FeedbackDownloadButton = ({
  isDisabled,
  isLoading,
  handleClick,
}: FeedbackDownloadButtonProps) => {
  return (
    <Button
      isDisabled={isDisabled}
      isLoading={isLoading}
      onClick={handleClick}
      leftIcon={<BiDownload fontSize="1.5rem" />}
    >
      Export
    </Button>
  )
}
