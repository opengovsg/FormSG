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
import { STEP_LOGIN_PROVIDER_LABELS } from 'formsg-shared/utils/step-login'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { augmentFieldWithQuestionNo } from '~features/form/utils'

export interface AuthSwitchConfirmationProps {
  currentAuthType: FormAuthType
  nextAuthType: StepLoginAuthType | undefined
  // The picked field that needs the new login; it joins the step on confirm
  assignedField?: { _id: string; title: string }
  fields: readonly { _id: string; title: string }[]
  formFields: readonly FormFieldDto[]
  deleteFields?: boolean
  affectedRules?: readonly string[]
  onClose: () => void
  onConfirm: () => void
}

const providerLabel = (authType: FormAuthType | undefined) =>
  STEP_LOGIN_PROVIDER_LABELS[
    authType === FormAuthType.CP ? FormAuthType.CP : FormAuthType.MyInfo
  ]

/** Confirmation distinguishes unassignment from deleting field definitions. */
export const AuthSwitchConfirmation = ({
  currentAuthType,
  nextAuthType,
  assignedField,
  fields,
  formFields,
  onClose,
  onConfirm,
  deleteFields = false,
  affectedRules = [],
}: AuthSwitchConfirmationProps) => {
  const isTurningOff = nextAuthType === FormAuthType.NIL
  const currentProvider =
    currentAuthType === FormAuthType.NIL
      ? 'no authentication'
      : providerLabel(currentAuthType)
  const provider = providerLabel(nextAuthType)
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
            {assignedField ? (
              <Text>
                {`"${assignedField.title}" needs ${provider}. Switching this step to ${provider} assigns it to this step.`}
              </Text>
            ) : null}
            {fields.length > 0 ? (
              <>
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
              </>
            ) : null}
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
              {fields.length === 0
                ? `Switch to ${provider} and assign field`
                : isTurningOff
                  ? `${deleteFields ? 'Delete' : 'Unassign'} fields and turn off`
                  : `${deleteFields ? 'Delete' : 'Unassign'} fields and switch to ${provider}`}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
