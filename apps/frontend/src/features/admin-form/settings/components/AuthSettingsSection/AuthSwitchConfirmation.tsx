import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormAuthType, StepLoginAuthType } from 'formsg-shared/types'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface AuthSwitchConfirmationProps {
  currentAuthType: FormAuthType
  nextAuthType: StepLoginAuthType | undefined
  fields: readonly { _id: string; title: string }[]
  onClose: () => void
  onConfirm: () => void
}

/** Changing a step's login preserves its fields in the form as unassigned drafts. */
export const AuthSwitchConfirmation = ({
  currentAuthType,
  nextAuthType,
  fields,
  onClose,
  onConfirm,
}: AuthSwitchConfirmationProps) => {
  const isTurningOff = nextAuthType === FormAuthType.NIL
  const currentProvider =
    currentAuthType === FormAuthType.CP
      ? 'Corppass'
      : currentAuthType === FormAuthType.NIL
        ? 'no authentication'
        : 'Singpass'
  const provider = nextAuthType === FormAuthType.CP ? 'Corppass' : 'Singpass'
  return (
    <Modal isOpen={nextAuthType !== undefined} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {isTurningOff ? 'Turn off authentication?' : `Switch to ${provider}?`}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            <Text>
              This step uses {currentProvider}. These fields will be unassigned
              from this step and kept in your form.
            </Text>
            {fields.map((field) => (
              <Text key={field._id}>{field.title}</Text>
            ))}
            <Text>
              Before publishing, assign them to a step with matching
              authentication or delete them from the form. Save this card to
              apply the change.
            </Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            spacing="1rem"
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onConfirm}>
              {isTurningOff
                ? 'Unassign fields and turn off'
                : `Unassign fields and switch to ${provider}`}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
