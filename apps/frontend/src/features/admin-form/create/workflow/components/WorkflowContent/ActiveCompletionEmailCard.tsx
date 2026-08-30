import { useEffect, useLayoutEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
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
  WORKFLOW_EMAIL_MULTISELECT_NAME,
} from '~features/admin-form/settings/components/MrfEmailRecipientsFieldGroup'
import { useMutateFormSettings } from '~features/admin-form/settings/mutations'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  pendingSwitchToSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'

import { EditStepBlockContainer } from './EditStepBlock/EditStepBlockContainer'
import { CompletionEmailLabel } from './CompletionEmailLabel'

export interface ActiveCompletionEmailCardProps {
  settings: MultirespondentFormSettings
  /** True when the form is public: controls show, but read-only. */
  isDisabled: boolean
}

/**
 * Expanded completion email card. Save behaviour copies the step card rather
 * than Settings: explicit Save, plus auto-save when another card is clicked.
 * Deliberately no save-on-blur, so it cannot silently commit while the step
 * cards beside it wait for a button.
 */
export const ActiveCompletionEmailCard = ({
  settings,
  isDisabled,
}: ActiveCompletionEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const pendingSwitchTo = useAdminWorkflowStore(pendingSwitchToSelector)
  const completeSave = useAdminWorkflowStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminWorkflowStore(cancelPendingSwitchSelector)

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

  // Must be read during render for the Proxy to track it. See EditStepBlock.
  const { isDirty } = formMethods.formState

  const handleSubmit = formMethods.handleSubmit((inputs) => {
    const nextEmails = inputs[OTHER_PARTIES_EMAIL_INPUT_NAME]
    const nextStepsToNotify = inputs[WORKFLOW_EMAIL_MULTISELECT_NAME]
    const nextStepOneEmailNotificationFieldId =
      inputs[STEP_1_RESPONDENT_NOTIFY_EMAIL_SINGLESELECT_NAME]

    // Unchanged: skip the PATCH but still resolve any pending switch.
    if (
      isEqual(nextEmails, emails) &&
      isEqual(nextStepsToNotify, stepsToNotify) &&
      nextStepOneEmailNotificationFieldId === stepOneEmailNotificationFieldId
    ) {
      completeSave()
      return
    }

    mutateMrfEmailNotifications.mutate(
      {
        emails: nextEmails,
        stepsToNotify: nextStepsToNotify,
        stepOneEmailNotificationFieldId: nextStepOneEmailNotificationFieldId,
      },
      // onError drops the pending switch so a failed save can't redirect a later one.
      { onSuccess: completeSave, onError: cancelPendingSwitch },
    )
  }, cancelPendingSwitch)

  // Matches Settings: the placeholder is a hint for an empty field, so it goes
  // away once there are recipients.
  const otherPartiesPlaceholder =
    (getValues(OTHER_PARTIES_EMAIL_INPUT_NAME)?.length ?? 0) > 0
      ? undefined
      : 'me@example.com'

  // Dedupes on blur but does not submit: this card commits only on Save.
  const handleOtherPartiesBlur = () => {
    const current = getValues(OTHER_PARTIES_EMAIL_INPUT_NAME) ?? []
    const cleaned = uniq(current.filter((email) => isEmail(email)))
    if (!isEqual(cleaned, current)) {
      setValue(OTHER_PARTIES_EMAIL_INPUT_NAME, cleaned, { shouldDirty: true })
    }
  }

  // Re-entry guard for the effect below, mirroring EditStepBlock: without it a
  // second card click inside the pre-isLoading window double-saves.
  const hasSubmittedForPendingSwitch = useRef(false)

  // Auto-save when another card is clicked while this one is open.
  useEffect(() => {
    if (pendingSwitchTo === null) {
      hasSubmittedForPendingSwitch.current = false
      return
    }

    if (isLoading || hasSubmittedForPendingSwitch.current) return

    // Read-only or untouched: nothing to save, so hand over immediately.
    if (isDisabled || !isDirty) {
      completeSave()
      return
    }

    hasSubmittedForPendingSwitch.current = true
    handleSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSwitchTo])

  return (
    <Stack
      ref={wrapperRef}
      py="2rem"
      spacing="1.5rem"
      borderRadius="4px"
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
          {/* Without this the card just shows dead controls. Reuses the
          sentence Settings shows for the same situation. */}
          <InlineMessage variant="info">
            {t(
              'features.adminForm.settings.emailNotifications.header.closeFormFirst',
            )}
          </InlineMessage>
        </EditStepBlockContainer>
      ) : null}
      <EditStepBlockContainer>
        {/* The field group carries Settings' own 1.5rem outer margins, which
        double up against this card's Stack spacing and leave the controls
        sitting 48px off the dividers where a step card's sit 24px. Cancelled
        here rather than in the field group, which Settings also renders. The
        Box is a flex item, so it establishes its own formatting context and
        the child margins cannot collapse through it. */}
        <Box my="-1.5rem">
          <MrfEmailRecipientsFieldGroup
            control={control}
            isDisabled={isDisabled}
            isHighContrast={false}
            otherPartiesPlaceholder={otherPartiesPlaceholder}
            onOtherPartiesBlur={handleOtherPartiesBlur}
            heading={
              // Settings' own liner, in Settings' own treatment. The card only
              // renders on a workflow with at least one step, so the
              // no-workflow variant of this string is unreachable here.
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
