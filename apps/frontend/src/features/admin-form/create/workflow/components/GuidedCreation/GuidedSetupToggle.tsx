import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'
import Toggle from '~components/Toggle'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useGuidedSetupPreference } from '../../hooks/useGuidedSetupPreference'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

export const GuidedSetupToggle = (): JSX.Element | null => {
  const { t } = useTranslation(workflowNs)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const { isGuidedSetup, setGuidedSetup } = useGuidedSetupPreference()
  const { formWorkflow } = useAdminFormWorkflow()

  const modalSize = useBreakpointValue({ base: 'mobile', md: 'md' })

  const hasSteps = (formWorkflow?.length ?? 0) > 0

  const handleChange = () => {
    if (isGuidedSetup) {
      onOpen()
      return
    }
    setGuidedSetup(true)
  }

  const handleConfirm = () => {
    setGuidedSetup(false)
    onClose()
  }

  if (!isRedesign) return null

  const label = t('guidedMode.label')

  return (
    <>
      <Toggle
        isChecked={isGuidedSetup}
        onChange={handleChange}
        label={label}
        betaBadge
      />

      <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">
            {t('skipGuidance.modal.title')}
          </ModalHeader>
          <ModalBody>
            <Text textStyle="body-2" color="secondary.500">
              {t(
                hasSteps
                  ? 'skipGuidance.modal.bodyWithSteps'
                  : 'skipGuidance.modal.bodyWithoutSteps',
              )}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Stack
              direction={{ base: 'column-reverse', md: 'row' }}
              w="100%"
              justify="flex-end"
            >
              <Button variant="clear" colorScheme="secondary" onClick={onClose}>
                {t('skipGuidance.modal.cancel')}
              </Button>
              <Button onClick={handleConfirm}>
                {t('skipGuidance.modal.confirm')}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
