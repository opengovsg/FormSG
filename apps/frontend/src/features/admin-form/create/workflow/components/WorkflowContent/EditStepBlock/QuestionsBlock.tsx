import { Controller, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { FormControl, FormHelperText } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'
import { isMyInfoAuthType } from 'formsg-shared/utils/workflow-auth'

import { textStyles } from '~theme/textStyles'
import { MultiSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { useAdminForm } from '~features/admin-form/common/queries'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { getLogicFieldLabel } from '~features/admin-form/create/logic/components/LogicContent/utils/getLogicFieldLabel'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsMrfSingpassAllSteps } from '../../../hooks/useIsMrfSingpassAllSteps'
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useStageFieldAndNavigate } from '../../../hooks/useStageFieldAndNavigate'
import { getEditedStepAuthType } from '../StepLogin/editedStepLogin'

import { APPROVAL_FIELD_NAME, FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'
import { FieldEmptyState } from './EmptyStates'

interface QuestionsBlockProps {
  isLoading: boolean
  formMethods: UseFormReturn<EditStepInputs>
  isFirstStep: boolean
}

export const QuestionsBlock = ({
  isLoading,
  formMethods,
  isFirstStep,
}: QuestionsBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const stageFieldAndNavigate = useStageFieldAndNavigate()
  const {
    formFields = [],
    idToFieldMap,
    formWorkflow = [],
  } = useAdminFormWorkflow()
  const { data: form } = useAdminForm()
  const isStepLoginEnabled = useIsMrfSingpassAllSteps()
  const {
    formState: { errors },
    control,
    watch,
    trigger,
    getValues,
  } = formMethods
  const selectedApprovalField = watch(APPROVAL_FIELD_NAME)

  // MyInfo fields need a Singpass step, and each belongs to one step only.
  const stepId = watch('_id')
  const stepAuthType = form
    ? getEditedStepAuthType(form, isFirstStep, {
        auth: watch('auth'),
        login_auth: watch('login_auth'),
        first_step_login: watch('first_step_login'),
      })
    : FormAuthType.NIL
  const canHaveMyInfoFields =
    isMyInfoAuthType(stepAuthType) || (!isStepLoginEnabled && isFirstStep)
  const myInfoOwnerStep = new Map<string, number>()
  formWorkflow.forEach((s, i) => {
    if (s._id === stepId) return
    s.edit.forEach((id) => {
      if (!myInfoOwnerStep.has(id)) myInfoOwnerStep.set(id, i + 1)
    })
  })

  const fillableFields = formFields.filter(
    (f) => !NON_RESPONSE_FIELD_SET.has(f.fieldType),
  )

  const items = fillableFields
    .filter((f) => !('myInfo' in f) || canHaveMyInfoFields)
    .map((f) => {
      const ownerStep = 'myInfo' in f ? myInfoOwnerStep.get(f._id) : undefined
      return {
        value: f._id,
        label: getLogicFieldLabel(idToFieldMap[f._id]),
        icon: BASICFIELD_TO_DRAWER_META[f.fieldType].icon,
        ...(ownerStep !== undefined
          ? {
              disabled: true,
              description: t(
                'features.adminForm.sidebar.workflow.stepLogin.editor.myInfoInOtherStep',
                { stepNumber: ownerStep },
              ),
            }
          : {}),
      }
    })
  const hasHiddenMyInfoFields =
    isStepLoginEnabled &&
    !canHaveMyInfoFields &&
    fillableFields.some((f) => 'myInfo' in f)

  const hasOnlyMyInfoFields =
    items.every((item) => item.disabled) && fillableFields.length > 0

  const showEmptyState = isRedesign && items.every((item) => item.disabled)

  return (
    <EditStepBlockContainer>
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
            if (showEmptyState) {
              return (
                <FieldEmptyState
                  picker="fields"
                  message={t(
                    hasOnlyMyInfoFields
                      ? 'features.adminForm.sidebar.workflow.emptyStates.noFieldsMyInfoOnly'
                      : 'features.adminForm.sidebar.workflow.emptyStates.noFields',
                  )}
                  actionLabel={t(
                    'features.adminForm.sidebar.workflow.emptyStates.noFieldsAction',
                  )}
                  onAction={() => stageFieldAndNavigate(undefined, getValues())}
                />
              )
            }
            const handleFieldsChange = (newValue: string[]) => {
              onChange(newValue)
              if (isRedesign && selectedApprovalField) {
                void trigger(APPROVAL_FIELD_NAME)
              }
            }
            return (
              <MultiSelect
                isDisabled={isLoading}
                placeholder={t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.questions.placeholderRedesign'
                    : 'features.adminForm.sidebar.workflow.questions.placeholder',
                )}
                items={items}
                isSelectedItemFullWidth
                values={value}
                onChange={handleFieldsChange}
                {...field}
              />
            )
          }}
        />
        {isRedesign && selectedApprovalField ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.questions.autoAddHelperTextRedesign',
            )}
          </FormHelperText>
        ) : null}
        {hasHiddenMyInfoFields ? (
          <FormHelperText>
            {t(
              'features.adminForm.sidebar.workflow.stepLogin.editor.myInfoNeedsSingpassStep',
            )}
          </FormHelperText>
        ) : null}
        <FormErrorMessage>{errors.workflow_type?.message}</FormErrorMessage>
      </FormControl>
    </EditStepBlockContainer>
  )
}
