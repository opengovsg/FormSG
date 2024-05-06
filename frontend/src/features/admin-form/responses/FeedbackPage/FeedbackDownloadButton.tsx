import { BiDownload } from 'react-icons/bi'
import { Button, IconButton } from '@opengovsg/design-system-react'

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
        colorScheme="main"
      />
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
