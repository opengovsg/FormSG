import { useTranslation } from 'react-i18next'
import { Stack } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

interface WorkflowDrawerActionsProps {
  handleCancel: () => void
  handleSubmit: () => void
  submitButtonLabel: string
  isLoading: boolean
}

export const WorkflowDrawerActions = ({
  handleCancel,
  handleSubmit,
  submitButtonLabel,
  isLoading,
}: WorkflowDrawerActionsProps): JSX.Element => {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  return (
    <Stack
      direction={{ base: 'column', md: 'row-reverse' }}
      justifyContent="end"
      w="100%"
      spacing={{ base: '0.5rem', md: '1rem' }}
      pb={{ base: '0.75rem', md: '1.5rem' }}
    >
      <Button
        isFullWidth={isMobile}
        isDisabled={isLoading}
        onClick={handleSubmit}
      >
        {submitButtonLabel}
      </Button>
      <Button
        isDisabled={isLoading}
        isFullWidth={isMobile}
        variant="clear"
        colorScheme="secondary"
        onClick={handleCancel}
      >
        {t('features.common.cancel')}
      </Button>
    </Stack>
  )
}
