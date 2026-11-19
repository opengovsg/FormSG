import { useTranslation } from 'react-i18next'
import { Box, Icon, Stack, Text } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { BasicField, FormField } from 'formsg-shared/types'
import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'
import { checkIsOptionsMismatched } from 'formsg-shared/utils/options-recipients-map-validation'

import { BxsErrorCircle } from '~assets/icons'

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

const isDropdownCsvOutdated = (
  field: FormFieldWithQuestionNo<FormField> | undefined,
): boolean =>
  field?.fieldType === BasicField.Dropdown &&
  checkIsOptionsMismatched(
    Object.keys(field.optionsToRecipientsMap || {}),
    field.fieldOptions,
  )

const HybridBadges = ({
  step,
  idToFieldMap,
}: {
  step: Extract<FormWorkflowStep, { workflow_type: WorkflowType.Hybrid }>
  idToFieldMap: IdToFieldMap
}) => {
  const { t } = useTranslation()
  const outdatedDropdowns = step.dropdown_fields
    .map((fieldId) => idToFieldMap[fieldId])
    .filter(isDropdownCsvOutdated)
  return (
    <>
      <EmailBadges emails={step.emails} />
      {[...step.email_fields, ...step.dropdown_fields].map((fieldId) => (
        <FieldBadge key={fieldId} field={idToFieldMap[fieldId]} />
      ))}
      {outdatedDropdowns.length > 0 ? (
        <Box flexBasis="100%">
          <LogicBadge colorScheme="danger" display="inline-flex">
            <Stack direction="row" spacing="0.25rem">
              <Icon
                as={BxsErrorCircle}
                fontSize="1rem"
                color="danger.500"
                mt="0.125rem"
              />
              <Text color="danger.500">
                {t(
                  'features.adminForm.sidebar.workflow.conditionalRouting.csvNeededFor',
                  {
                    fields: outdatedDropdowns
                      .map(
                        ({ questionNumber, title }) =>
                          `${questionNumber}. ${title}`,
                      )
                      .join(', '),
                  },
                )}
              </Text>
            </Stack>
          </LogicBadge>
        </Box>
      ) : null}
    </>
  )
}

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
  return (
    <Stack direction="column" spacing="0.5rem">
      <FieldBadge field={dropdownField} />
      {isDropdownCsvOutdated(dropdownField) ? (
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
    case WorkflowType.Hybrid:
      return <HybridBadges step={step} idToFieldMap={idToFieldMap} />
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = step
      throw new Error('Unexpected workflow type encountered')
    }
  }
}
