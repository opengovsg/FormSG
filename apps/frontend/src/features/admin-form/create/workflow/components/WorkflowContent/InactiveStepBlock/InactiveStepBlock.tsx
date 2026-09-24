import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import {
  Box,
  chakra,
  Flex,
  Icon,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
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
import { useIsWorkflowBuilderRedesign } from '../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowEditBlocked } from '../../../hooks/useIsWorkflowEditBlocked'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { CloseFormToEditModal } from '../../CloseFormToEditModal'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { InactiveApprovalsBlock } from './InactiveApprovalsBlock'

const MISSING_FIELD_MESSAGE = 'This field is missing'
const NO_EMAILS_MESSAGE = 'No emails added'

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
      if (step.emails.length === 0) {
        return (
          <FieldLogicBadge
            defaults={{ variant: 'error', message: NO_EMAILS_MESSAGE }}
          />
        )
      }
      return (
        <>
          {step.emails.map((email) => (
            <LogicBadge key={email}>{email}</LogicBadge>
          ))}
        </>
      )
    case WorkflowType.Dynamic:
      return (
        <FieldLogicBadge
          field={idToFieldMap[step.field]}
          defaults={{ variant: 'error', message: MISSING_FIELD_MESSAGE }}
        />
      )
    case WorkflowType.Conditional: {
      const selectedConditionalField = idToFieldMap[step.conditional_field]
      if (
        !selectedConditionalField ||
        selectedConditionalField.fieldType !== BasicField.Dropdown
      ) {
        return (
          <FieldLogicBadge
            field={selectedConditionalField}
            defaults={{ variant: 'error', message: MISSING_FIELD_MESSAGE }}
          />
        )
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
            defaults={{ variant: 'error', message: MISSING_FIELD_MESSAGE }}
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
  const isRedesign = useIsWorkflowBuilderRedesign()
  const {
    cardRadius,
    sectionLabelTextStyle,
    iconRestColor,
    iconTransitionDuration,
  } = useWorkflowSurfaces()
  const { idToFieldMap } = useAdminFormWorkflow()
  const setToEditing = useAdminWorkflowStore(setToEditingSelector)
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const requestSwitchTo = useAdminWorkflowStore(requestSwitchToSelector)
  const isEditBlocked = useIsWorkflowEditBlocked()
  const {
    isOpen: isBlockedModalOpen,
    onClose: onBlockedModalClose,
    onOpen: onBlockedModalOpen,
  } = useDisclosure()

  const handleClick = useCallback(() => {
    if (isEditBlocked) {
      onBlockedModalOpen()
      return
    }
    if (stateData) {
      requestSwitchTo(stepNumber)
      return
    }
    setToEditing(stepNumber)
  }, [
    isEditBlocked,
    onBlockedModalOpen,
    stateData,
    stepNumber,
    setToEditing,
    requestSwitchTo,
  ])

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

  const fieldsSection = (
    <Stack>
      <Text textStyle={sectionLabelTextStyle}>
        {t('features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill')}
      </Text>
      <Stack direction="column" spacing="0.25rem">
        {questionBadges}
      </Stack>
    </Stack>
  )
  const hideEmptyApprovals = isRedesign && !step.approval_field
  const approvalsSection =
    isFirstStep || hideEmptyApprovals ? null : (
      <InactiveApprovalsBlock step={step} idToFieldMap={idToFieldMap} />
    )

  return (
    <Box pos="relative" zIndex={1} role="group">
      <CloseFormToEditModal
        isOpen={isBlockedModalOpen}
        onClose={onBlockedModalClose}
      />
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius={cardRadius}
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        _groupHover={{ borderColor: 'primary.500', bg: 'primary.100' }}
        onClick={handleClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} stepName={step.step_name} />

          <Stack>
            <Text textStyle={sectionLabelTextStyle}>
              {t(
                isRedesign
                  ? 'features.adminForm.sidebar.workflow.respondentBlock.stepRespondentRedesign'
                  : 'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent',
              )}
            </Text>
            {isFirstStep ? (
              <Text>
                {t(
                  isRedesign
                    ? 'features.adminForm.sidebar.workflow.respondentBlock.anyoneRedesign'
                    : 'features.adminForm.sidebar.workflow.respondentBlock.anyone',
                )}
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

          {isRedesign ? (
            <>
              {approvalsSection}
              {fieldsSection}
            </>
          ) : (
            <>
              {fieldsSection}
              {approvalsSection}
            </>
          )}
        </Stack>
      </chakra.button>
      <Icon
        as={BiPencil}
        aria-hidden
        pointerEvents="none"
        top={{ base: '0.5rem', md: '2rem' }}
        right={{ base: '0.5rem', md: '2rem' }}
        pos="absolute"
        fontSize="1.5rem"
        color={iconRestColor}
        transitionProperty="common"
        transitionDuration={iconTransitionDuration}
        _groupHover={{ color: 'primary.500' }}
      />
    </Box>
  )
}
