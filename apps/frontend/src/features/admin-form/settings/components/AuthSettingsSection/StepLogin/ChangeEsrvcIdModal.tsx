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
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'

import { useMutateFormSettings } from '../../../mutations'

import { STEP_LOGIN_COPY_KEY } from './useStepLoginLabels'

interface ChangeEsrvcIdModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  // Step labels of every Corppass step the change applies to.
  corppassStepLabels: string[]
}

/**
 * Changes the form's shared Corppass e-service ID in its own request. Every
 * Corppass step uses it, so the dialog names the steps that change.
 */
export const ChangeEsrvcIdModal = ({
  isOpen,
  onClose,
  value,
  corppassStepLabels,
}: ChangeEsrvcIdModalProps): JSX.Element => {
  const { t } = useTranslation()
  const copyKey = `${STEP_LOGIN_COPY_KEY}.esrvcId.modal`
  const modalSize = useBreakpointValue({ base: 'mobile', md: 'md' })
  const { mutateFormEsrvcId } = useMutateFormSettings()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (isOpen) setDraft(value)
  }, [isOpen, value])

  const trimmed = draft.trim()
  const hasWhitespace = /\s/.test(trimmed)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">{t(`${copyKey}.title`)}</ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            <Text textStyle="body-2" color="secondary.500">
              {corppassStepLabels.length > 0
                ? t(`${copyKey}.descriptionShared`, {
                    steps: corppassStepLabels.join(', '),
                  })
                : t(`${copyKey}.description`)}
            </Text>
            <Text textStyle="body-2" color="secondary.500">
              {t(`${STEP_LOGIN_COPY_KEY}.newSubmissionsOnly`)}
            </Text>
            <FormControl isInvalid={hasWhitespace}>
              <FormLabel>
                {t(`${STEP_LOGIN_COPY_KEY}.editor.esrvcIdLabel`)}
              </FormLabel>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                isReadOnly={mutateFormEsrvcId.isLoading}
              />
              <FormErrorMessage>
                {t(`${STEP_LOGIN_COPY_KEY}.editor.esrvcIdWhitespace`)}
              </FormErrorMessage>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              colorScheme="secondary"
              onClick={onClose}
              isDisabled={mutateFormEsrvcId.isLoading}
            >
              {t(`${copyKey}.cancel`)}
            </Button>
            <Button
              isDisabled={!trimmed || hasWhitespace || trimmed === value}
              isLoading={mutateFormEsrvcId.isLoading}
              onClick={() =>
                mutateFormEsrvcId.mutate(trimmed, { onSuccess: onClose })
              }
            >
              {t(`${copyKey}.confirm`)}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
