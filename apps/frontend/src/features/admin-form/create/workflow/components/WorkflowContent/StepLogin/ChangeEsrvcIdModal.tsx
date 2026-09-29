import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin.esrvcIdModal'

interface ChangeEsrvcIdModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  /** Other Corppass steps, 1-based, that the change also applies to. */
  otherCorppassSteps: number[]
  onConfirm: (esrvcId: string) => void
}

/** Changes the shared Corppass e-service ID, naming the other Corppass steps it also changes. */
export const ChangeEsrvcIdModal = ({
  isOpen,
  onClose,
  value,
  otherCorppassSteps,
  onConfirm,
}: ChangeEsrvcIdModalProps): JSX.Element => {
  const { t } = useTranslation()
  const modalSize = useBreakpointValue({ base: 'mobile', md: 'md' })
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (isOpen) setDraft(value)
  }, [isOpen, value])

  const trimmed = draft.trim()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          {t(`${COPY_KEY}.title`)}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            <Text textStyle="body-2" color="secondary.500">
              {otherCorppassSteps.length > 0
                ? t(`${COPY_KEY}.descriptionShared`, {
                    steps: otherCorppassSteps
                      .map((stepNumber) =>
                        t(`${COPY_KEY}.stepName`, { stepNumber }),
                      )
                      .join(', '),
                  })
                : t(`${COPY_KEY}.description`)}
            </Text>
            <Text textStyle="body-2" color="secondary.500">
              {t(
                'features.adminForm.sidebar.workflow.stepLogin.newSubmissionsOnly',
              )}
            </Text>
            <FormControl>
              <FormLabel>
                {t(
                  'features.adminForm.sidebar.workflow.stepLogin.editor.esrvcIdLabel',
                )}
              </FormLabel>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t(`${COPY_KEY}.cancel`)}
            </Button>
            <Button
              isDisabled={!trimmed}
              onClick={() => {
                onConfirm(trimmed)
                onClose()
              }}
            >
              {t(`${COPY_KEY}.confirm`)}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
