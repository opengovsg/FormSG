import { Stack } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { BasicField, FormField } from 'formsg-shared/types'
import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'
import { checkIsOptionsMismatched } from 'formsg-shared/utils/options-recipients-map-validation'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

const MISSING_FIELD_MESSAGE = 'This field is missing'
const NO_EMAILS_MESSAGE = 'No emails added'

type IdToFieldMap = Dictionary<FormFieldWithQuestionNo<FormField>>

interface StepRespondentBadgesProps {
  step: FormWorkflowStep
  idToFieldMap: IdToFieldMap
}

const EmailBadges = ({ emails }: { emails: string[] }) => (
  <>
    {emails.map((email) => (
      <LogicBadge key={email}>{email}</LogicBadge>
    ))}
  </>
)

const FieldBadge = ({
  field,
}: {
  field: FormFieldWithQuestionNo<FormField> | undefined
}) => (
  <FieldLogicBadge
    field={field}
    defaults={{ variant: 'error', message: MISSING_FIELD_MESSAGE }}
  />
)

const DropdownBadge = ({
  fieldId,
  idToFieldMap,
}: {
  fieldId: string
  idToFieldMap: IdToFieldMap
}) => {
  const dropdownField = idToFieldMap[fieldId]
  if (!dropdownField || dropdownField.fieldType !== BasicField.Dropdown) {
    return <FieldBadge field={dropdownField} />
  }
  const isOptionsMismatched = checkIsOptionsMismatched(
    Object.keys(dropdownField.optionsToRecipientsMap || {}),
    dropdownField.fieldOptions,
  )
  return (
    <Stack direction="column" spacing="0.5rem">
      <FieldBadge field={dropdownField} />
      {isOptionsMismatched ? (
        <FieldLogicBadge
          defaults={{
            variant: 'error',
            message: 'Please update your CSV options and emails',
          }}
        />
      ) : null}
    </Stack>
  )
}

export const StepRespondentBadges = ({
  step,
  idToFieldMap,
}: StepRespondentBadgesProps): JSX.Element => {
  switch (step.workflow_type) {
    case WorkflowType.Static:
      if (step.emails.length === 0) {
        return (
          <FieldLogicBadge
            defaults={{ variant: 'error', message: NO_EMAILS_MESSAGE }}
          />
        )
      }
      return <EmailBadges emails={step.emails} />
    case WorkflowType.Dynamic:
      return <FieldBadge field={idToFieldMap[step.field]} />
    case WorkflowType.Conditional:
      return (
        <DropdownBadge
          fieldId={step.conditional_field}
          idToFieldMap={idToFieldMap}
        />
      )
    case WorkflowType.Mixed:
      return (
        <>
          <EmailBadges emails={step.emails} />
          {step.email_fields.map((fieldId) => (
            <FieldBadge key={fieldId} field={idToFieldMap[fieldId]} />
          ))}
          {step.dropdown_fields.map((fieldId) => (
            <DropdownBadge
              key={fieldId}
              fieldId={fieldId}
              idToFieldMap={idToFieldMap}
            />
          ))}
        </>
      )
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = step
      throw new Error('Unexpected workflow type encountered')
    }
  }
}
