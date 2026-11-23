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

import { FormAuthType, FormWorkflowStepDto } from 'formsg-shared/types/form'
import {
  getStepAuthType,
  isWorkflowStepAuthType,
} from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'
import { sortFieldIdsByFormOrder } from '~features/admin-form/create/common/sortFieldIdsByFormOrder'
import { FieldLogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/FieldLogicBadge'
import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useIsStepLoginShown } from '../../../hooks/useIsStepLoginShown'
import { useIsWorkflowEditBlocked } from '../../../hooks/useIsWorkflowEditBlocked'
import { useWorkflowSurfaces } from '../../../hooks/useWorkflowSurfaces'
import { STEP_LOGIN_LABEL_KEYS } from '../../../utils/stepLoginAvailability'
import { CloseFormToEditModal } from '../../CloseFormToEditModal'
import { StepLabel } from '../StepLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { InactiveApprovalsBlock } from './InactiveApprovalsBlock'
import { StepRespondentBadges } from './StepRespondentBadges'

const STEP_LOGIN_COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

interface InactiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
}

export const InactiveStepBlock = ({
  stepNumber,
  step,
}: InactiveStepBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const {
    cardRadius,
    cardHoverBorderColor,
    cardHoverBg,
    iconHoverColor,
    sectionLabelTextStyle,
    iconRestColor,
    iconTransitionDuration,
  } = useWorkflowSurfaces()
  const { idToFieldMap, formWorkflow, formFields = [] } = useAdminFormWorkflow()
  const { data: form } = useAdminForm()
  const isLoginShown = useIsStepLoginShown(stepNumber)
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

    return sortFieldIdsByFormOrder(step.edit, formFields).map(
      (fieldId, index) => (
        <FieldLogicBadge
          key={index}
          field={idToFieldMap[fieldId]}
          defaults={{
            variant: 'info',
            message: 'This field was deleted, please select another field',
          }}
        />
      ),
    )
  }, [idToFieldMap, step.edit, formFields])

  const fieldsSection = (
    <Stack>
      <Text textStyle={sectionLabelTextStyle}>
        {t(
          `features.adminForm.sidebar.workflow.respondentBlock.${isLoginShown ? 'assignedFields' : 'fieldsToFill'}`,
        )}
      </Text>
      <Stack direction="column" spacing="0.25rem">
        {questionBadges}
      </Stack>
    </Stack>
  )
  const stepAuthType = form
    ? getStepAuthType(form, formWorkflow, stepNumber)
    : FormAuthType.NIL
  const loginSection =
    isLoginShown && isWorkflowStepAuthType(stepAuthType) ? (
      <Stack>
        <Text textStyle={sectionLabelTextStyle}>
          {t(`${STEP_LOGIN_COPY_KEY}.inactiveLabel`)}
        </Text>
        <Flex>
          <LogicBadge>{t(STEP_LOGIN_LABEL_KEYS[stepAuthType])}</LogicBadge>
        </Flex>
      </Stack>
    ) : null
  const hideEmptyApprovals = isLoginShown
    ? !step.approval_field || step.is_approval_enabled === false
    : !step.approval_field
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
        _groupHover={{ borderColor: cardHoverBorderColor, bg: cardHoverBg }}
        onClick={handleClick}
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <StepLabel stepNumber={stepNumber} stepName={step.step_name} />

          <Stack>
            <Text textStyle={sectionLabelTextStyle}>
              {t(
                'features.adminForm.sidebar.workflow.respondentBlock.stepRespondent',
              )}
            </Text>
            {isFirstStep ? (
              <Text>
                {t(
                  'features.adminForm.sidebar.workflow.respondentBlock.anyone',
                )}
              </Text>
            ) : (
              <Flex
                flexDir={{ base: 'column', md: 'row' }}
                gap={{ base: '0.5rem', md: '1rem' }}
                rowGap={{ md: '0.5rem' }}
                wrap="wrap"
              >
                <StepRespondentBadges step={step} idToFieldMap={idToFieldMap} />
              </Flex>
            )}
          </Stack>

          {loginSection}
          {approvalsSection}
          {fieldsSection}
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
        _groupHover={{ color: iconHoverColor }}
      />
    </Box>
  )
}
