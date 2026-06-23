import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiGridVertical, BiPencil } from 'react-icons/bi'
import { Box, Flex, Icon, Stack, Text, Tooltip } from '@chakra-ui/react'
import { Dictionary } from 'lodash'

import { BasicField, FormField } from 'formsg-shared/types'
import { FormWorkflowStepDto, WorkflowType } from 'formsg-shared/types/form'
import { checkIsOptionsMismatched } from 'formsg-shared/utils/options-recipients-map-validation'

import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'
import { FormFieldWithQuestionNo } from '~features/form/types'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { InactiveWhatTheyDoBlock } from './InactiveWhatTheyDoBlock'

interface InactiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
}

interface RespondentBadgeProps {
  step: FormWorkflowStepDto
  idToFieldMap: Dictionary<FormFieldWithQuestionNo<FormField>>
}

const SubsequentStepRespondentBadges = ({
  step,
  idToFieldMap,
}: RespondentBadgeProps): JSX.Element => {
  switch (step.workflow_type) {
    case WorkflowType.Static:
      return step.emails.length === 0 ? (
        <FieldLogicBadge
          defaults={{
            variant: 'info',
            message: 'No people selected',
          }}
        />
      ) : (
        <>
          {step.emails.map((email) => (
            <LogicBadge key={email}>{email}</LogicBadge>
          ))}
        </>
      )
    case WorkflowType.Dynamic:
      return <FieldLogicBadge field={idToFieldMap[step.field]} />
    case WorkflowType.Conditional: {
      const selectedConditionalField = idToFieldMap[step.conditional_field]
      if (
        !selectedConditionalField ||
        selectedConditionalField.fieldType !== BasicField.Dropdown
      ) {
        return <FieldLogicBadge field={selectedConditionalField} />
      }
      const selectedConditionalFieldOptions =
        selectedConditionalField.fieldOptions
      const optionsToRecipientsMapOptions = Object.keys(
        selectedConditionalField.optionsToRecipientsMap || {},
      )
      const isOptionsMismatched = checkIsOptionsMismatched(
        optionsToRecipientsMapOptions,
        selectedConditionalFieldOptions,
      )
      return (
        <Stack direction="column" spacing="0.5rem">
          <FieldLogicBadge
            field={
              step.conditional_field
                ? idToFieldMap[step.conditional_field]
                : undefined
            }
          />
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
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = step
      throw new Error('Unexpected workflow type encountered')
    }
  }
}

export const InactiveStepBlock = ({
  stepNumber,
  step,
}: InactiveStepBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { idToFieldMap } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminWorkflowStore(requestSwitchToSelector)

  const handleClick = useCallback(() => {
    if (stateData) {
      // Another step is being edited; request auto-save and switch
      requestSwitchTo(stepNumber)
      return
    }
    setToEditing(stepNumber)
  }, [stateData, stepNumber, setToEditing, requestSwitchTo])

  const isFirstStep = isFirstStepByStepNumber(stepNumber)

  const questionBadges = useMemo(() => {
    if (step.edit.length === 0) {
      return (
        <FieldLogicBadge
          defaults={{
            variant: 'info',
            message: 'No fields selected',
          }}
        />
      )
    }

    const allInvalid = step.edit.every((fieldId) => !(fieldId in idToFieldMap))

    if (allInvalid) {
      return (
        <FieldLogicBadge
          defaults={{
            variant: 'error',
            message:
              'All fields were deleted, please select at least one field',
          }}
        />
      )
    }

    return step.edit.map((fieldId, index) => (
      <FieldLogicBadge
        key={index}
        field={idToFieldMap[fieldId]}
        defaults={{
          variant: 'info',
          message: 'This field was deleted, please select another field',
        }}
      />
    ))
  }, [idToFieldMap, step.edit])

  return (
    <Box pos="relative" role="group">
      <Box
        role="button"
        tabIndex={0}
        w="100%"
        textAlign="start"
        borderRadius="8px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        _hover={{ borderColor: 'primary.500', bg: 'primary.50' }}
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        onClick={handleClick}
        pos="relative"
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} stepName={step.step_name} />

          <Stack>
            <Text textStyle="subhead-2">People who fill in this step</Text>
            {isFirstStep ? (
              <Text textStyle="body-2">
                Anyone with the form link can respond.
              </Text>
            ) : (
              <Flex
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: '0.5rem', md: '1rem' }}
                rowGap={{ md: '0.5rem' }}
                wrap="wrap"
              >
                <SubsequentStepRespondentBadges
                  step={step}
                  idToFieldMap={idToFieldMap}
                />
              </Flex>
            )}
          </Stack>

          {!isFirstStep ? (
            <InactiveWhatTheyDoBlock step={step} idToFieldMap={idToFieldMap} />
          ) : null}
          <Stack>
            <Text textStyle="subhead-2">
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill',
              )}
            </Text>
            <Stack direction="column" spacing="0.25rem">
              {questionBadges}
            </Stack>
          </Stack>
        </Stack>
        <Flex
          pos="absolute"
          top={{ base: '0.5rem', md: '2rem' }}
          right={{ base: '0.5rem', md: '2rem' }}
          alignItems="center"
          gap="0.25rem"
        >
          <Tooltip label="Edit" placement="top" hasArrow openDelay={300}>
            <Box display="inline-flex">
              <Icon
                as={BiPencil}
                boxSize="1.25rem"
                color="secondary.300"
                _groupHover={{ color: 'primary.500' }}
                transition="color 0.15s ease"
              />
            </Box>
          </Tooltip>
          <Tooltip
            label="Drag to reorder"
            placement="top"
            hasArrow
            openDelay={300}
          >
            <Box display="inline-flex">
              <Icon
                as={BiGridVertical}
                boxSize="1.25rem"
                color="secondary.300"
                _groupHover={{ color: 'primary.500' }}
                transition="color 0.15s ease"
              />
            </Box>
          </Tooltip>
        </Flex>
      </Box>
    </Box>
  )
}
