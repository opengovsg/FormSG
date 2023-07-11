import { BiDownload } from 'react-icons/bi'

import Button from '~components/Button'
import IconButton from '~components/IconButton'

type FeedbackDownloadButtonProps = {
  isDisabled: boolean
  isLoading: boolean
  handleClick: () => void
  isMobile: boolean
}

export const FeedbackDownloadButton = ({
  isDisabled,
  isLoading,
  handleClick,
  isMobile,
}: FeedbackDownloadButtonProps) => {
  if (isMobile) {
    return (
      <IconButton
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        aria-label="Export"
        icon={<BiDownload />}
        variant="outline"
        colorScheme="primary"
      ></IconButton>
    )
  }
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
