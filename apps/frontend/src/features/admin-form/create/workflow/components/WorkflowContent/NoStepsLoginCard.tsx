import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import { Box, chakra, Icon, Stack, Text, useDisclosure } from '@chakra-ui/react'

import { useToast } from '~hooks/useToast'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import { adminFormSettingsKeys } from '~features/admin-form/settings/queries'
import { updateFormLoginSettings } from '~features/admin-form/settings/SettingsService'

import {
  createOrEditDataSelector,
  requestSwitchToSelector,
  setToEditingSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useIsWorkflowEditBlocked } from '../../hooks/useIsWorkflowEditBlocked'
import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'
import { AdminEditWorkflowState, EditStepInputs } from '../../types'
import { CloseFormToEditModal } from '../CloseFormToEditModal'
import { SpotlightGroup } from '../Spotlight'

import { EditStepBlockContainer } from './EditStepBlock/EditStepBlockContainer'
import { LoginBlock } from './EditStepBlock/LoginBlock'
import { StepLoginSummary } from './StepLogin/StepLoginSummary'
import { useResolvedStepAuths } from './StepLogin/useResolvedStepAuths'
import { StepLabel } from './StepLabel'

/** Step 1 of an MRF form with no steps; its login saves through the Settings PATCH. */
export const NoStepsLoginCard = (): JSX.Element => {
  const stateData = useAdminWorkflowStore(createOrEditDataSelector)
  const isEditing =
    stateData?.state === AdminEditWorkflowState.EditingStep &&
    stateData.stepNumber === 0
  return isEditing ? <EditNoStepsLoginCard /> : <InactiveNoStepsLoginCard />
}

const NoStepsStepSummary = (): JSX.Element => {
  const { t } = useTranslation()
  const { sectionLabelTextStyle } = useWorkflowSurfaces()
  return (
    <>
      <Stack>
        <Text textStyle={sectionLabelTextStyle}>
          {t(
            'features.adminForm.sidebar.workflow.respondentBlock.stepRespondentRedesign',
          )}
        </Text>
        <Text>
          {t(
            'features.adminForm.sidebar.workflow.respondentBlock.anyoneRedesign',
          )}
        </Text>
      </Stack>
      <Stack>
        <Text textStyle={sectionLabelTextStyle}>
          {t(
            'features.adminForm.sidebar.workflow.respondentBlock.fieldsToFill',
          )}
        </Text>
        <Text>
          {t(
            'features.adminForm.sidebar.workflow.stepLogin.noSteps.fieldsToFill',
          )}
        </Text>
      </Stack>
    </>
  )
}

const InactiveNoStepsLoginCard = (): JSX.Element | null => {
  const resolvedAuth = useResolvedStepAuths()?.[0]
  const { cardRadius, iconRestColor, iconTransitionDuration } =
    useWorkflowSurfaces()
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
      requestSwitchTo(0)
      return
    }
    setToEditing(0)
  }, [
    isEditBlocked,
    onBlockedModalOpen,
    requestSwitchTo,
    setToEditing,
    stateData,
  ])

  if (!resolvedAuth) return null

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
          <StepLabel stepNumber={0} />
          <NoStepsStepSummary />
          <StepLoginSummary resolved={resolvedAuth} />
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

const EditNoStepsLoginCard = (): JSX.Element => {
  const { t } = useTranslation()
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')
  const { formFields = [] } = useAdminFormWorkflow()
  const queryClient = useQueryClient()
  const toast = useToast({ isClosable: true })
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { cardRadius, activeCardBg, activeCardBorderWidth, activeCardShadow } =
    useWorkflowSurfaces()

  // Step 1 fills every field, so every MyInfo field counts for the "needs Singpass" check.
  const formMethods = useForm<EditStepInputs>({
    defaultValues: { edit: formFields.map((field) => field._id) },
  })

  const saveMutation = useMutation(
    (loginSettings: Parameters<typeof updateFormLoginSettings>[1]) =>
      updateFormLoginSettings(formId, loginSettings),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries(adminFormKeys.id(formId))
        void queryClient.invalidateQueries(adminFormSettingsKeys.id(formId))
        toast.closeAll()
        toast({
          status: 'success',
          description: t(
            'features.adminForm.sidebar.workflow.stepLogin.noSteps.saved',
          ),
        })
        setToInactive()
      },
      onError: (error: Error) => {
        toast.closeAll()
        toast({ status: 'danger', description: error.message })
      },
    },
  )

  const handleSubmit = formMethods.handleSubmit(
    ({ first_step_login: login, esrvc_id: esrvcId, whitelistCsvString }) => {
      if (!login && esrvcId === undefined && whitelistCsvString === undefined) {
        return setToInactive()
      }
      // One PATCH, so the login and its list save together or not at all.
      saveMutation.mutate({
        ...(login
          ? {
              authType: login.authType,
              isSubmitterIdCollectionEnabled:
                login.isSubmitterIdCollectionEnabled,
              isSingleSubmission: login.isSingleSubmission,
            }
          : {}),
        ...(esrvcId !== undefined ? { esrvcId } : {}),
        ...(whitelistCsvString !== undefined ? { whitelistCsvString } : {}),
      })
    },
  )

  return (
    <Stack
      spacing="0"
      pt="0.5rem"
      pb="2rem"
      borderRadius={cardRadius}
      bg={activeCardBg}
      border={`${activeCardBorderWidth} solid`}
      borderColor="primary.500"
      boxShadow={activeCardShadow}
      textAlign="start"
    >
      <SpotlightGroup activeIndex={null} isEnabled={false}>
        <EditStepBlockContainer key="step">
          <Stack spacing="1.5rem">
            <StepLabel stepNumber={0} />
            <NoStepsStepSummary />
          </Stack>
        </EditStepBlockContainer>
        <LoginBlock
          key="login"
          formMethods={formMethods}
          stepNumber={0}
          isLoading={saveMutation.isLoading}
          isNoStepsCard
        />
      </SpotlightGroup>
      <Box pt="1.5rem">
        <SaveActionGroup
          isLoading={saveMutation.isLoading}
          handleSubmit={handleSubmit}
          handleCancel={setToInactive}
          submitButtonLabel="Save step"
          ariaLabelName="step"
        />
      </Box>
    </Stack>
  )
}
