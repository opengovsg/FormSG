import { useCallback, useMemo } from 'react'
import { useController, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Box, FormControl, Stack } from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { BasicField } from 'formsg-shared/types'

import {
  EmailSourceField,
  EmailSourceInput,
  EmailSources,
} from '~components/EmailSourceInput'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { useAddFieldPicker } from '~features/admin-form/create/common/useAddFieldPicker'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { EditStepInputs } from '~features/admin-form/create/workflow/types'

import { useIsWorkflowSavePermissive } from '../../../../hooks/useIsWorkflowSavePermissive'
import {
  emailSourcesToNarrowestStep,
  stepToEmailSources,
} from '../../../../utils/stepRecipients'

import {
  DropdownFormField,
  getMappingMismatchError,
  getMissingMappingError,
} from './Components/dropdownMapping'
import { DropdownRecipientsMapping } from './Components/DropdownRecipientsMapping'
import { useWorkflowTypeValidation } from './Components/hooks'
import { FieldItem } from './Components/types'

interface RespondentSourceInputProps {
  formMethods: UseFormReturn<EditStepInputs>
  isLoading: boolean
  emailFieldItems: FieldItem[]
  dropdownFormFields: DropdownFormField[]
}

export const RESPONDENT_SOURCE_INPUT_NAME = 'respondent-source'

export const RespondentSourceInput = ({
  formMethods,
  isLoading,
  emailFieldItems,
  dropdownFormFields,
}: RespondentSourceInputProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    control,
    watch,
    getValues,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isSubmitted },
  } = formMethods
  const isSavePermissive = useIsWorkflowSavePermissive()
  const workflowTypeValidation = useWorkflowTypeValidation()

  const value = stepToEmailSources({
    workflow_type: watch('workflow_type'),
    emails: watch('emails'),
    field: watch('field'),
    conditional_field: watch('conditional_field'),
    email_fields: watch('email_fields'),
    dropdown_fields: watch('dropdown_fields'),
  })

  const validateSources = ({
    emails,
    emailFields,
    dropdownFields,
  }: EmailSources) => {
    if (
      !isSavePermissive &&
      emails.length + emailFields.length + dropdownFields.length === 0
    ) {
      return t('features.adminForm.sidebar.workflow.respondentSource.required')
    }
    if (!emails.every((email) => isEmail(email))) {
      return t(
        'features.adminForm.sidebar.workflow.staticRespondent.invalidEmails',
      )
    }
    if (isLoading) return true
    if (
      !emailFields.every((id) =>
        emailFieldItems.some((item) => item.value === id),
      )
    ) {
      return t(
        'features.adminForm.sidebar.workflow.dynamicRespondent.mustBeEmail',
      )
    }
    const dropdowns = dropdownFields.map((id) =>
      dropdownFormFields.find((field) => field._id === id),
    )
    if (dropdowns.some((field) => !field)) {
      return t(
        'features.adminForm.sidebar.workflow.conditionalRouting.validation.notDropdown',
      )
    }
    if (isSavePermissive) return true
    for (const field of dropdowns) {
      const error =
        getMissingMappingError(field, t) ?? getMappingMismatchError(field, t)
      if (error) return error
    }
    return true
  }

  useController({
    control,
    name: 'workflow_type',
    rules: {
      required: workflowTypeValidation.required,
      validate: {
        type: workflowTypeValidation.validate,
        sources: () => validateSources(stepToEmailSources(getValues())),
      },
    },
  })

  const { openAddField: openAddEmailField } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.email'),
    fieldType: BasicField.Email,
  })
  const { openAddField: openAddDropdownField } = useAddFieldPicker({
    label: t('features.adminForm.sidebar.workflow.addField.dropdown'),
    fieldType: BasicField.Dropdown,
  })

  const fields = useMemo<EmailSourceField[]>(
    () => [
      ...emailFieldItems.map(({ value, label, icon }) => ({
        kind: 'emailField' as const,
        fieldId: value,
        label,
        icon,
      })),
      ...dropdownFormFields.map(
        ({ _id, questionNumber, title, fieldType }) => ({
          kind: 'dropdownField' as const,
          fieldId: _id,
          label: `${questionNumber}. ${title}`,
          icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
        }),
      ),
    ],
    [dropdownFormFields, emailFieldItems],
  )

  const addFieldActions = useMemo(
    () => ({
      emailField: {
        label: t('features.adminForm.sidebar.workflow.addField.email'),
        icon: BiPlus,
        onSelect: openAddEmailField,
      },
      dropdownField: {
        label: t('features.adminForm.sidebar.workflow.addField.dropdown'),
        icon: BiPlus,
        onSelect: openAddDropdownField,
      },
    }),
    [openAddDropdownField, openAddEmailField, t],
  )

  const handleChange = useCallback(
    (next: EmailSources) => {
      const step = emailSourcesToNarrowestStep(next)
      let name: keyof typeof step
      for (name in step) {
        setValue(name, step[name], { shouldDirty: true })
      }
      if (errors.emails) clearErrors('emails')
      if (isSubmitted || errors.workflow_type) void trigger('workflow_type')
    },
    [
      clearErrors,
      errors.emails,
      errors.workflow_type,
      isSubmitted,
      setValue,
      trigger,
    ],
  )

  const errorMessage = errors.workflow_type?.message ?? errors.emails?.message
  const mappedDropdownFields = dropdownFormFields.filter(({ _id }) =>
    value.dropdownFields.includes(_id),
  )

  return (
    <Box>
      <EmailSourceInput
        name={RESPONDENT_SOURCE_INPUT_NAME}
        value={value}
        onChange={handleChange}
        fields={fields}
        addFieldActions={addFieldActions}
        isDisabled={isLoading}
        isInvalid={!!errorMessage}
      />
      <FormErrorMessage>{errorMessage}</FormErrorMessage>
      {mappedDropdownFields.length > 0 ? (
        <Stack mt="1rem" spacing="1rem">
          {mappedDropdownFields.map((field) => {
            const mismatchError = getMappingMismatchError(field, t)
            return (
              <FormControl
                key={field._id}
                id={`dropdown-mapping-${field._id}`}
                isInvalid={!!mismatchError}
              >
                <FormLabel
                  isRequired
                >{`${field.questionNumber}. ${field.title}`}</FormLabel>
                <DropdownRecipientsMapping
                  field={field}
                  isLoading={isLoading}
                  onMapped={() => clearErrors('workflow_type')}
                />
                <FormErrorMessage>{mismatchError}</FormErrorMessage>
              </FormControl>
            )
          })}
        </Stack>
      ) : null}
    </Box>
  )
}
