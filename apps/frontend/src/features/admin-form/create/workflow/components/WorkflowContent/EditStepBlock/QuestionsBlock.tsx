import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  FormHelperText,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'
import {
  canStepLoginFillField,
  getFieldSourceProvider,
  getOwningStepIndex,
  getStepFieldsNeedingLogin,
  STEP_LOGIN_PROVIDER_LABELS,
} from 'formsg-shared/utils/step-login'

import { textStyles } from '~theme/textStyles'
import { NextAndBackButtonGroup } from '~components/Button/NextAndBackButtonGroup'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
  stepNumber,
}: QuestionsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isLoginShown = useIsStepLoginShown(stepNumber)
  const isProposed = isRedesign && isLoginShown
  const [pendingFieldId, setPendingFieldId] = useState<string>()
  const { withAddFieldItem, withAddFieldAction } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.fields'),
    enabled: isRedesign,
  })
  const { data: form } = useAdminForm()
  const {
    formFields = [],
    formWorkflow = [],
    idToFieldMap,
  } = useAdminFormWorkflow()
  const {
    formState: { errors },
    control,
    watch,
    trigger,
    setValue,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const pickedFieldIds: string[] = watch(FIELDS_TO_EDIT_NAME) ?? []

  // The login as edited in this card, since the picker follows unsaved
  // login changes. Step 1's login is the form-level one.
  const editedAuthType: FormAuthType = isFirstStepByStepNumber(stepNumber)
    ? (watch('first_step_login')?.auth_type ??
      form?.authType ??
      FormAuthType.NIL)
    : (watch('auth')?.auth_type ?? FormAuthType.NIL)

  const fillableFields = formFields.filter(
    (f) => !NON_RESPONSE_FIELD_SET.has(f.fieldType),
  )

  const fieldItems = fillableFields
    // A login-filled field is offered only to a step whose login fills it,
    // and to one step at a time. Fields already on this step stay listed so
    // they can be removed.
    .filter((f) => {
      if (isProposed || pickedFieldIds.includes(f._id)) return true
      if (!canStepLoginFillField(f, editedAuthType)) return false
      if (!getFieldSourceProvider(f)) return true
      const owner = getOwningStepIndex(f, formWorkflow)
      return owner === undefined || owner === stepNumber
    })
    .map((f) => {
      const owner = getFieldSourceProvider(f)
        ? getOwningStepIndex(f, formWorkflow)
        : undefined
      const ownedElsewhere =
        isProposed &&
        owner !== undefined &&
        owner !== stepNumber &&
        !pickedFieldIds.includes(f._id)
      return {
        value: f._id,
        label: getLogicFieldLabel(idToFieldMap[f._id]),
        icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
        disabled: ownedElsewhere,
        descriptionTag: ownedElsewhere
          ? `Assigned to Step ${owner + 1}`
          : undefined,
      }
    })

  const hasOnlyLoginFields =
    fieldItems.length === 0 && fillableFields.length > 0

  const pendingField = formFields.find((f) => f._id === pendingFieldId)
  const requiredProvider = pendingField
    ? getFieldSourceProvider(pendingField)
    : undefined
  const requiredLabel = requiredProvider
    ? STEP_LOGIN_PROVIDER_LABELS[requiredProvider]
    : ''
  const incompatibleFields = requiredProvider
    ? getStepFieldsNeedingLogin(
        formFields.filter((f) => pickedFieldIds.includes(f._id)),
        requiredProvider,
      )
    : []
  const currentLabel =
    editedAuthType === FormAuthType.CP
      ? 'Corppass'
      : editedAuthType === FormAuthType.NIL
        ? 'no login'
        : 'Singpass'
  const confirmAssignment = () => {
    if (!requiredProvider || !pendingFieldId) return
    const incompatibleIds = new Set(incompatibleFields.map((f) => f._id))
    const nextIds = [
      ...pickedFieldIds.filter((id) => !incompatibleIds.has(id)),
      pendingFieldId,
    ]
    setValue(FIELDS_TO_EDIT_NAME, Array.from(new Set(nextIds)), {
      shouldDirty: true,
      shouldValidate: true,
    })
    if (isFirstStepByStepNumber(stepNumber))
      setValue(
        'first_step_login',
        { auth_type: requiredProvider },
        { shouldDirty: true },
      )
    else
      setValue('auth', { auth_type: requiredProvider }, { shouldDirty: true })
    setPendingFieldId(undefined)
  }

  return (
    <EditStepBlockContainer>
      <Modal
        isOpen={!!pendingFieldId}
        onClose={() => setPendingFieldId(undefined)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            {editedAuthType === FormAuthType.NIL
              ? `Enable ${requiredLabel} to assign this field?`
              : `Switch this step to ${requiredLabel}?`}
          </ModalHeader>
          <ModalBody>
            <Stack spacing="1rem">
              <Text>
                Step {stepNumber + 1} uses {currentLabel}. This field needs{' '}
                {requiredLabel}.
              </Text>
              {incompatibleFields.length > 0 ? (
                <>
                  <Text>
                    These fields will be unassigned from this step. They will
                    remain in your form.
                  </Text>
                  {incompatibleFields.map((f) => (
                    <Text key={f._id}>
                      {getLogicFieldLabel(idToFieldMap[f._id])}
                    </Text>
                  ))}
                </>
              ) : null}
              <Text>
                The selected field will be assigned to this step. Save step to
                apply these changes.
              </Text>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <NextAndBackButtonGroup
              backButtonLabel="Cancel"
              nextButtonLabel={
                incompatibleFields.length
                  ? `Unassign fields and switch to ${requiredLabel}`
                  : `Enable ${requiredLabel} and assign field`
              }
              handleBack={() => setPendingFieldId(undefined)}
              handleNext={confirmAssignment}
            />
          </ModalFooter>
        </ModalContent>
      </Modal>
      <FormControl
        isReadOnly={isLoading}
        id={FIELDS_TO_EDIT_NAME}
        isRequired
        isInvalid={!!errors.edit}
      >
        <FormLabel
          style={textStyles.h4}
          tooltipVariant="info"
          tooltipPlacement="top"
          tooltipText={
            isRedesign
              ? undefined
              : t('features.adminForm.sidebar.workflow.questions.tooltip')
          }
        >
          {t(
            isRedesign
              ? 'features.adminForm.sidebar.workflow.questions.labelRedesign'
              : 'features.adminForm.sidebar.workflow.questions.label',
          )}
        </FormLabel>
        <Controller
          control={control}
          name={FIELDS_TO_EDIT_NAME}
          render={({ field: { value = [], onChange, ...field } }) => {
            const handleFieldsChange = withAddFieldAction(
              (newValue: string[]) => {
                const addedId = newValue.find((id) => !value.includes(id))
                const added = formFields.find((f) => f._id === addedId)
                if (
                  isProposed &&
                  added &&
                  !canStepLoginFillField(added, editedAuthType)
                ) {
                  setPendingFieldId(added._id)
                  return
                }
                onChange(newValue)
                if (isRedesign && selectedApprovalField) {
                  void trigger(APPROVAL_FIELD_NAME)
                }
              },
            )
            return (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.questions.placeholderRedesign'
                    : 'features.adminForm.sidebar.workflow.questions.placeholder',
                )}
                items={withAddFieldItem(fieldItems)}
                isSelectedItemFullWidth
                values={value}
                onChange={handleFieldsChange}
                {...field}
              />
            )
          }}
        />
        {isRedesign && hasOnlyLoginFields ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.loginFieldsHelperText',
            )}
          </FormHelperText>
        ) : null}
        {isRedesign && selectedApprovalField ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.autoAddHelperTextRedesign',
            )}
          </FormHelperText>
        ) : null}
        <FormErrorMessage>{errors.edit?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
