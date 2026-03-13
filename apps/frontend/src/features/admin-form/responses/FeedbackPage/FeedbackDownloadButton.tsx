import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  if (isMobile) {
    return (
      <IconButton
        isDisabled={isDisabled}
        isLoading={isLoading}
        onClick={handleClick}
        aria-label={t('features.adminForm.feedback.downloadButton.export')}
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
      {t('features.adminForm.feedback.downloadButton.export')}
    </Button>
  )
}
