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
} from '@chakra-ui/react'

import { FormAuthType, FormFieldDto } from 'formsg-shared/types'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { STEP_LOGIN_LABEL_KEYS } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'
import { augmentFieldWithQuestionNo } from '~features/form/utils'

export interface AuthSwitchConfirmationProps {
  currentAuthType: FormAuthType
  nextAuthType: FormAuthType | undefined
  // The picked field that needs the new login; it joins the step on confirm
  assignedField?: { _id: string; title: string }
  fields: readonly { _id: string; title: string }[]
  formFields: readonly FormFieldDto[]
  deleteFields?: boolean
  affectedRules?: readonly string[]
  onClose: () => void
  onConfirm: () => void
}

const COPY_KEY =
  'features.adminForm.sidebar.workflow.stepLogin.switchConfirmation'

const providerLabelKey = (authType: FormAuthType | undefined) =>
  STEP_LOGIN_LABEL_KEYS[
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
  const { t } = useTranslation()
  const isTurningOff = nextAuthType === FormAuthType.NIL
  const current =
    currentAuthType === FormAuthType.NIL
      ? t(`${COPY_KEY}.noAuthentication`)
      : t(providerLabelKey(currentAuthType))
  const provider = t(providerLabelKey(nextAuthType))
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
          {isTurningOff
            ? t(`${COPY_KEY}.titleTurnOff`)
            : t(`${COPY_KEY}.titleSwitch`, { provider })}
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            {assignedField ? (
              <Text>
                {t(`${COPY_KEY}.assignedField`, {
                  field: assignedField.title,
                  provider,
                })}
              </Text>
            ) : null}
            {fields.length > 0 ? (
              <>
                <Text>
                  {t(
                    deleteFields
                      ? isTurningOff
                        ? `${COPY_KEY}.deleteBodyTurnOff`
                        : `${COPY_KEY}.deleteBodySwitch`
                      : isTurningOff
                        ? `${COPY_KEY}.unassignBodyTurnOff`
                        : `${COPY_KEY}.unassignBodySwitch`,
                    { current, provider },
                  )}
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
                    <Text>{t(`${COPY_KEY}.affectedRules`)}</Text>
                    {affectedRules.map((rule) => (
                      <Text key={rule}>{rule}</Text>
                    ))}
                  </Stack>
                ) : null}
                <Text>
                  {deleteFields
                    ? t(`${COPY_KEY}.deleteNote`)
                    : t(`${COPY_KEY}.unassignNote`)}
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
              {t(`${COPY_KEY}.cancel`)}
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
                ? t(`${COPY_KEY}.confirmAssign`, { provider })
                : t(
                    isTurningOff
                      ? deleteFields
                        ? `${COPY_KEY}.confirmDeleteTurnOff`
                        : `${COPY_KEY}.confirmUnassignTurnOff`
                      : deleteFields
                        ? `${COPY_KEY}.confirmDeleteSwitch`
                        : `${COPY_KEY}.confirmUnassignSwitch`,
                    { provider },
                  )}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
