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

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'
import Toggle from '~components/Toggle'

import {
  isGuidedSetupSelector,
  setGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

const WORKFLOW_I18N_PREFIX = 'features.adminForm.sidebar.workflow'
const SKIP_I18N_PREFIX = `${WORKFLOW_I18N_PREFIX}.skipGuidance`

export const GuidedSetupToggle = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const setGuidedSetup = useAdminWorkflowStore(setGuidedSetupSelector)
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

  const label = t(`${WORKFLOW_I18N_PREFIX}.guidedMode.label`)

  return (
    <>
      <Toggle isChecked={isGuidedSetup} onChange={handleChange} label={label} />

      <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">
            {t(`${SKIP_I18N_PREFIX}.modal.title`)}
          </ModalHeader>
          <ModalBody>
            <Text textStyle="body-2" color="secondary.500">
              {t(
                hasSteps
                  ? `${SKIP_I18N_PREFIX}.modal.bodyWithSteps`
                  : `${SKIP_I18N_PREFIX}.modal.bodyWithoutSteps`,
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
                {t(`${SKIP_I18N_PREFIX}.modal.cancel`)}
              </Button>
              <Button onClick={handleConfirm}>
                {t(`${SKIP_I18N_PREFIX}.modal.confirm`)}
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
