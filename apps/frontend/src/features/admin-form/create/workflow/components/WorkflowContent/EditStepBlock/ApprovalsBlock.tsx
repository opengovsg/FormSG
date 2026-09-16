import { useCallback, useRef, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl } from '@chakra-ui/react'

import { BasicField } from 'formsg-shared/types'

import { textStyles } from '~theme/textStyles'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowSavePermissive } from '../../../hooks/useIsWorkflowSavePermissive'
import { useStageFieldAndNavigate } from '../../../hooks/useStageFieldAndNavigate'
import { EditStepInputs } from '../../../types'
import { nextEditFieldsForApproval } from '../utils/nextEditFieldsForApproval'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { FieldEmptyState } from './EmptyStates'

interface ApprovalsBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
}

export const ApprovalsBlock = ({
  formMethods,
  stepNumber,
}: ApprovalsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isSavePermissive = useIsWorkflowSavePermissive()
  const stageFieldAndNavigate = useStageFieldAndNavigate()
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
    clearErrors,
    watch,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)
  const [isApprovalToggleChecked, setIsApprovalToggleChecked] = useState(
    !!selectedApprovalField,
  )
  const {
    yesNoFormFields = [],
    formWorkflow = [],
    isLoading,
  } = useAdminFormWorkflow()

  const yesNoFieldItems = yesNoFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )
  const yesNoFieldIds = yesNoFormFields.map(({ _id }) => _id)

  const approvalFieldsFromOtherSteps = formWorkflow
    .map((step, i) => {
      if (i === stepNumber) return null
      return step.approval_field
    })
    .filter(Boolean)

  const lastChosenApprovalField = useRef(selectedApprovalField ?? '')

  const assignApprovalFieldToStep = (approvalFieldId: string) => {
    const currentEdit = getValues(FIELDS_TO_EDIT_NAME) ?? []
    const nextEdit = nextEditFieldsForApproval({
      edit: currentEdit,
      approvalFieldId,
      isEnabled: isRedesign,
    })
    if (nextEdit !== currentEdit) {
      setValue(FIELDS_TO_EDIT_NAME, nextEdit, { shouldDirty: true })
    }
  }

  const onApprovalToggleChange = () => {
    const nextIsApprovalToggleChecked = !isApprovalToggleChecked
    if (nextIsApprovalToggleChecked) {
      const remembered = lastChosenApprovalField.current
      if (remembered && yesNoFieldIds.includes(remembered)) {
        assignApprovalFieldToStep(remembered)
        setValue(APPROVAL_FIELD_NAME, remembered, { shouldDirty: true })
      }
    } else {
      lastChosenApprovalField.current = getValues(APPROVAL_FIELD_NAME) ?? ''
      setValue(APPROVAL_FIELD_NAME, '', { shouldDirty: true })
      clearErrors(APPROVAL_FIELD_NAME)
    }
    setIsApprovalToggleChecked(nextIsApprovalToggleChecked)
  }

  const getValueIfNotDeleted = useCallback(
    (value: string) => {
      if (!isLoading && value && !yesNoFieldIds.includes(value)) {
        setValue(APPROVAL_FIELD_NAME, '')
        return ''
      }
      return value
    },
    [isLoading, setValue, yesNoFieldIds],
  )

  return (
    <EditStepBlockContainer>
      <Toggle
        isLoading={isLoading}
        onChange={onApprovalToggleChange}
        isChecked={isApprovalToggleChecked}
        labelStyles={{ ...textStyles.h4, color: 'inherit' }}
        label={t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.approvals.toggle.labelRedesign'
            : 'features.adminForm.sidebar.workflow.approvals.toggle.label',
        )}
        description={t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.approvals.toggle.descriptionRedesign'
            : 'features.adminForm.sidebar.workflow.approvals.toggle.description',
        )}
        descriptionStyles={isRedesign ? { color: 'secondary.700' } : undefined}
        tooltipText={
          isRedesign
            ? undefined
            : t('features.adminForm.sidebar.workflow.approvals.toggle.tooltip')
        }
        tooltipVariant="info"
        tooltipPlacement="top"
      />
      {isApprovalToggleChecked ? (
        <FormControl
          isInvalid={!!errors.approval_field?.message}
          {...(isRedesign ? { isRequired: !isSavePermissive } : {})}
        >
          <Controller
            name={APPROVAL_FIELD_NAME}
            control={control}
            rules={{
              validate: (value) => {
                if (!value && isApprovalToggleChecked && !isSavePermissive) {
                  return t(
                    isRedesign
                      ? 'features.adminForm.sidebar.workflow.approvals.validation.noFieldRedesign'
                      : 'features.adminForm.sidebar.workflow.approvals.validation.noField',
                  )
                }
                if (value && approvalFieldsFromOtherSteps.includes(value)) {
                  return t(
                    'features.adminForm.sidebar.workflow.approvals.validation.fieldAlreadyUsed',
                  )
                }
                if (
                  value &&
                  !(getValues(FIELDS_TO_EDIT_NAME) ?? []).includes(value)
                ) {
                  return t(
                    isRedesign
                      ? 'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUserRedesign'
                      : 'features.adminForm.sidebar.workflow.approvals.validation.fieldNotAssignedToUser',
                  )
                }
              },
            }}
            render={({ field: { value = '', onChange, ...rest } }) => {
              const displayValue = getValueIfNotDeleted(value)
              if (isRedesign && yesNoFieldItems.length === 0) {
                return (
                  <FieldEmptyState
                    picker="yesno"
                    message={t(
                      'features.adminForm.sidebar.workflow.emptyStates.noYesNoField',
                    )}
                    actionLabel={t(
                      'features.adminForm.sidebar.workflow.emptyStates.noYesNoFieldAction',
                    )}
                    onAction={() =>
                      stageFieldAndNavigate(BasicField.YesNo, getValues())
                    }
                  />
                )
              }
              const handleApprovalFieldChange = (newValue: string) => {
                assignApprovalFieldToStep(newValue)
                onChange(newValue)
              }
              return (
                <SingleSelect
                  placeholder={t(
                    'features.adminForm.sidebar.workflow.approvals.toggle.placeholder',
                  )}
                  items={yesNoFieldItems}
                  value={displayValue}
                  isClearable
                  isDisabled={isLoading}
                  onChange={handleApprovalFieldChange}
                  {...rest}
                />
              )
            }}
          />
          <FormErrorMessage>{errors.approval_field?.message}</FormErrorMessage>
        </FormControl>
      ) : null}
    </EditStepBlockContainer>
  )
}
