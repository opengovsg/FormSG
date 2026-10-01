import { useTranslation } from 'react-i18next'
import { Flex } from '@chakra-ui/react'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import Button from '~components/Button'

import { GuidedSecondaryAction } from '../../../utils/guidedStepPolicy'

export interface GuidedActionGroupProps {
  secondaryAction: GuidedSecondaryAction
  isOnLastSection: boolean
  isLoading: boolean
  onBack?: () => void
  onCancel: () => void
  onContinue?: () => void
  onDone: () => void
}

export const GuidedActionGroup = ({
  secondaryAction,
  isOnLastSection,
  isLoading,
  onBack,
  onCancel,
  onContinue,
  onDone,
}: GuidedActionGroupProps): JSX.Element => {
  const { t } = useTranslation(workflowNs)

  return (
    <Flex
      justify="flex-end"
      gap="0.75rem"
      px={{ base: '1.5rem', md: '2rem' }}
      align="center"
    >
      {secondaryAction === GuidedSecondaryAction.None ? null : (
        <Button
          variant="clear"
          colorScheme="secondary"
          isDisabled={isLoading}
          onClick={
            secondaryAction === GuidedSecondaryAction.Back ? onBack : onCancel
          }
        >
          {t(
            secondaryAction === GuidedSecondaryAction.Back
              ? 'guided.back'
              : 'guided.cancel',
          )}
        </Button>
      )}
      <Button
        isLoading={isOnLastSection && isLoading}
        onClick={isOnLastSection ? onDone : onContinue}
      >
        {t(isOnLastSection ? 'guided.done' : 'guided.continue')}
      </Button>
    </Flex>
  )
}
