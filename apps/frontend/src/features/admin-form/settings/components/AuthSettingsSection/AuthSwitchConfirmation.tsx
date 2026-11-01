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

import {
  FormAuthType,
  FormFieldDto,
  StepLoginAuthType,
} from 'formsg-shared/types'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { augmentFieldWithQuestionNo } from '~features/form/utils'

interface AuthSwitchConfirmationProps {
  currentAuthType: FormAuthType
  nextAuthType: StepLoginAuthType | undefined
  fields: readonly { _id: string; title: string }[]
  formFields: readonly FormFieldDto[]
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
  formFields,
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
  const numberedFields = new Map(
    augmentFieldWithQuestionNo([...formFields]).map((field) => [
      field._id,
      field,
    ]),
  )
  return (
    <Modal isOpen={nextAuthType !== undefined} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {isTurningOff ? 'Turn off authentication' : `Switch to ${provider}`}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            <Text>
              {deleteFields
                ? `This is the only step using ${currentProvider}. ${isTurningOff ? 'Turning off authentication' : `Switching to ${provider}`} means these ${currentProvider} fields can no longer be used:`
                : `These fields need ${currentProvider}, so they cannot be filled in on a step ${isTurningOff ? 'without authentication' : `using ${provider}`}:`}
            </Text>
            <Stack spacing="0.5rem" align="flex-start">
              {fields.map((field) => (
                <FieldLogicBadge
                  key={field._id}
                  field={numberedFields.get(field._id)}
                />
              ))}
            </Stack>
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
              {deleteFields
                ? 'These fields will be deleted from your form when you save this step or navigate away. Past responses will be kept.'
                : 'These fields will be unassigned from this step when you save or navigate away. They will stay in your form.'}
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
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              colorScheme={deleteFields ? 'danger' : 'primary'}
              whiteSpace="normal"
              h="auto"
              minH="2.75rem"
              py="0.75rem"
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
