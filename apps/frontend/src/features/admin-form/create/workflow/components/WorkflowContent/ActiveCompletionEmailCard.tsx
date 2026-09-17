import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'
import { isEqual, uniq } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { MultirespondentFormSettings } from 'formsg-shared/types/form'

import InlineMessage from '~components/InlineMessage'

import { SaveActionGroup } from '~features/admin-form/create/logic/components/LogicContent/EditLogicBlock/EditCondition'
import {
  MrfEmailRecipientsFieldGroup,
  MrfEmailRecipientsFormData,
  OTHER_PARTIES_EMAIL_INPUT_NAME,
  STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME,
  useMrfEmailRecipientControls,
  WORKFLOW_EMAIL_MULTISELECT_NAME,
} from '~features/admin-form/settings/components/MrfEmailRecipientsFieldGroup'
import { useMutateFormSettings } from '~features/admin-form/settings/mutations'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  dismissCompletedStepSelector,
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useGuidedStepReveal } from '../../hooks/useGuidedStepReveal'
import { useIsGuidedEmailCard } from '../../hooks/useIsGuidedEmailCard'
import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'
import { getGuidedSecondaryAction } from '../../utils/guidedStepPolicy'
import { SpotlightGroup } from '../Spotlight'

import { EditStepBlockContainer } from './EditStepBlock/EditStepBlockContainer'
import { GuidedActionGroup } from './EditStepBlock/GuidedActionGroup'
import { CompletionEmailLabel } from './CompletionEmailLabel'

const SECTION_REVEAL_SCROLL_DELAY_MS = 100

export interface ActiveCompletionEmailCardProps {
  settings: MultirespondentFormSettings
  isDisabled: boolean
}

export const ActiveCompletionEmailCard = ({
  settings,
  isDisabled,
}: ActiveCompletionEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const { cardRadius } = useWorkflowSurfaces()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completeSave = useAdminWorkflowStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminWorkflowStore(cancelPendingSwitchSelector)
  const dismissCompletedStep = useAdminWorkflowStore(
    dismissCompletedStepSelector,
  )
  const isGuidedEntry = useIsGuidedEmailCard()

  const isGuided = isGuidedEntry && !isDisabled

  const { stepsToNotify, emails, stepOneEmailNotificationFieldId } = settings
  const { mutateMrfEmailNotifications } = useMutateFormSettings()
  const isLoading = mutateMrfEmailNotifications.isLoading

  const formMethods = useForm<MrfEmailRecipientsFormData>({
    defaultValues: {
      [WORKFLOW_EMAIL_MULTISELECT_NAME]: stepsToNotify,
      [OTHER_PARTIES_EMAIL_INPUT_NAME]: emails,
      [STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]:
        stepOneEmailNotificationFieldId,
    },
  })
  const { control, getValues, setValue } = formMethods

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const { isDirty } = formMethods.formState

  const handleSaved = useCallback(() => {
    dismissCompletedStep()
    completeSave()
  }, [dismissCompletedStep, completeSave])

  const handleSubmit = formMethods.handleSubmit((inputs) => {
    const nextEmails = inputs[OTHER_PARTIES_EMAIL_INPUT_NAME]
    const nextStepsToNotify = inputs[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const nextStepOneEmailNotificationFieldId =
      inputs[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]

    if (
      isEqual(nextEmails, emails) &&
      isEqual(nextStepsToNotify, stepsToNotify) &&
      nextStepOneEmailNotificationFieldId === stepOneEmailNotificationFieldId
    ) {
      handleSaved()
      return
    }

    mutateMrfEmailNotifications.mutate(
      {
        emails: nextEmails,
        stepsToNotify: nextStepsToNotify,
        stepOneEmailNotificationFieldId: nextStepOneEmailNotificationFieldId,
      },
      { onSuccess: handleSaved, onError: cancelPendingSwitch },
    )
  }, cancelPendingSwitch)

  const otherParties = useWatch({
    control,
    name: OTHER_PARTIES_EMAIL_INPUT_NAME,
  })
  const otherPartiesPlaceholder =
    (otherParties?.length ?? 0) > 0 ? undefined : 'me@example.com'

  const handleOtherPartiesBlur = () => {
    const current = getValues(OTHER_PARTIES_EMAIL_INPUT_NAME) ?? []
    const cleaned = uniq(current.filter((email) => isEmail(email)))
    if (!isEqual(cleaned, current)) {
      setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, cleaned, { shouldDirty: true })
    }
  }

  const recipientControls = useMrfEmailRecipientControls({
    control,
    isDisabled,
    isHighContrast: true,
    otherPartiesPlaceholder,
    onOtherPartiesBlur: handleOtherPartiesBlur,
  })

  const reveal = useGuidedStepReveal({
    sectionCount: recipientControls.length,
    isEnabled: isGuided,
  })

  const { visibleCount } = reveal

  useEffect(() => {
    if (!isGuided || visibleCount <= 1) return
    const timeout = setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, SECTION_REVEAL_SCROLL_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [isGuided, visibleCount])

  const hasSubmittedForPendingSwitch = useRef(false)

  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    if (isLoading || hasSubmittedForPendingSwitch.current) return

    if (isDisabled || !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  if (isGuided) {
    return (
      <Stack
        ref={wrapperRef}
        py="2rem"
        spacing="0"
        pos="relative"
        zIndex={1}
        borderRadius={cardRadius}
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        transitionProperty="common"
        transitionDuration="normal"
      >
        <Box pb="1.5rem">
          <EditStepBlockContainer>
            <CompletionEmailLabel />
            <Text textStyle="body-1" textColor="secondary.700">
              {t(
                'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientWorkflow',
              )}
            </Text>
          </EditStepBlockContainer>
        </Box>
        <Divider />
        <SpotlightGroup activeIndex={reveal.activeIndex}>
          {recipientControls.slice(0, visibleCount).map((recipientControl) => (
            <EditStepBlockContainer key={recipientControl.key}>
              {recipientControl}
            </EditStepBlockContainer>
          ))}
        </SpotlightGroup>
        <Box pt="1.5rem">
          <GuidedActionGroup
            secondaryAction={getGuidedSecondaryAction({
              sectionIndex: visibleCount - 1,
              canCancel: true,
            })}
            isOnLastSection={reveal.isOnLastSection}
            isLoading={isLoading}
            onBack={reveal.goBack}
            onCancel={setToInactive}
            onContinue={reveal.advance}
            onDone={handleSubmit}
          />
        </Box>
      </Stack>
    )
  }

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1.5rem"
      pos="relative"
      zIndex={1}
      borderRadius={cardRadius}
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      <EditStepBlockContainer>
        <CompletionEmailLabel />
      </EditStepBlockContainer>
      <Divider />
      {isDisabled ? (
        <EditStepBlockContainer>
          <InlineMessage variant="info">
            {t(
              'features.adminForm.settings.emailNotifications.header.closeFormFirst',
            )}
          </InlineMessage>
        </EditStepBlockContainer>
      ) : null}
      <EditStepBlockContainer>
        <Box my="-1.5rem">
          <MrfEmailRecipientsFieldGroup
            control={control}
            isDisabled={isDisabled}
            isHighContrast
            otherPartiesPlaceholder={otherPartiesPlaceholder}
            onOtherPartiesBlur={handleOtherPartiesBlur}
            heading={
              <Text textStyle="body-1" textColor="secondary.700" mb="1.5rem">
                {t(
                  'features.adminForm.settings.emailNotifications.section.mrf.selectRecipientWorkflow',
                )}
              </Text>
            }
          />
        </Box>
      </EditStepBlockContainer>
      <Divider />
      <SaveActionGroup
        isLoading={isLoading}
        isSubmitDisabled={isDisabled}
        handleSubmit={handleSubmit}
        handleCancel={setToInactive}
        submitButtonLabel={undefined}
        ariaLabelName="completion email"
      />
    </Stack>
  )
}
