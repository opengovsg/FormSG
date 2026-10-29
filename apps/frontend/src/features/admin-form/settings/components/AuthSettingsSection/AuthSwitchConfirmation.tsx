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
  deleteFields?: boolean
  affectedRules?: readonly string[]
  onClose: () => void
  onConfirm: () => void
}

/** Confirmation distinguishes unassignment from deleting field definitions. */
export const AuthSwitchConfirmation = ({
  currentAuthType,
  nextAuthType,
  fields,
  onClose,
  onConfirm,
  deleteFields = false,
  affectedRules = [],
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
              This step uses {currentProvider}.{' '}
              {deleteFields
                ? 'It is the last step using this provider. These fields will be deleted from your form.'
                : 'These fields will be unassigned from this step and kept in your form.'}
            </Text>
            {fields.map((field) => (
              <Text key={field._id}>{field.title}</Text>
            ))}
            {affectedRules.length > 0 ? (
              <Stack spacing="0.5rem">
                <Text>
                  References to these fields will also be removed from:
                </Text>
                {affectedRules.map((rule) => (
                  <Text key={rule}>{rule}</Text>
                ))}
              </Stack>
            ) : null}
            <Text>
              {deleteFields ? 'Historical responses will not be deleted. ' : ''}
              Save this card or navigate away to apply the change. Cancel the
              card to discard it.
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
            <Button
              onClick={onConfirm}
              colorScheme={deleteFields ? 'danger' : 'primary'}
            >
              {isTurningOff
                ? `${deleteFields ? 'Delete' : 'Unassign'} fields and turn off`
                : `${deleteFields ? 'Delete' : 'Unassign'} fields and switch to ${provider}`}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
