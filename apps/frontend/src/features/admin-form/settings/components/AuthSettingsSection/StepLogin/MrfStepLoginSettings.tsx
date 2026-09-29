import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormStatus,
} from 'formsg-shared/types'
import { resolveAllStepAuths } from 'formsg-shared/utils/workflow-auth'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useIsMrfSingpassAllSteps } from '~features/admin-form/create/workflow/hooks/useIsMrfSingpassAllSteps'

import { AuthSettingsDescriptionText } from '../AuthSettingsDescriptionText'

import { ChangeEsrvcIdModal } from './ChangeEsrvcIdModal'
import { StepLoginRow } from './StepLoginRow'
import { STEP_LOGIN_COPY_KEY } from './useStepLoginLabels'

interface MrfStepLoginSettingsProps {
  form: AdminMultirespondentFormDto
}

/**
 * Settings › Singpass for multi-respondent forms: one row per workflow step,
 * each edited inline and saved on its own. A form with no workflow lists Step 1.
 */
export const MrfStepLoginSettings = ({
  form,
}: MrfStepLoginSettingsProps): JSX.Element => {
  const { t } = useTranslation()
  const isLaterStepEditingEnabled = useIsMrfSingpassAllSteps()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const {
    isOpen: isEsrvcIdModalOpen,
    onOpen: onEsrvcIdModalOpen,
    onClose: onEsrvcIdModalClose,
  } = useDisclosure()

  const isFormPublic = form.status === FormStatus.Public
  const savedAuths = resolveAllStepAuths(form, form.workflow)
  const corppassStepLabels = savedAuths.flatMap((saved, i) =>
    saved.authType === FormAuthType.CP
      ? [t(`${STEP_LOGIN_COPY_KEY}.stepTitle`, { stepNumber: i + 1 })]
      : [],
  )
  const hasLaterSteps = savedAuths.length > 1

  return (
    <Box>
      <AuthSettingsDescriptionText />
      <Stack spacing="1rem" mb="2.5rem">
        <InlineMessage>
          {t(`${STEP_LOGIN_COPY_KEY}.newSubmissionsOnly`)}
        </InlineMessage>
        {isFormPublic ? (
          <InlineMessage>
            {t(`${STEP_LOGIN_COPY_KEY}.closeFormToEdit`)}
          </InlineMessage>
        ) : null}
        {hasLaterSteps && !isLaterStepEditingEnabled ? (
          <InlineMessage>
            {t(`${STEP_LOGIN_COPY_KEY}.laterStepsReadOnly`)}
          </InlineMessage>
        ) : null}
      </Stack>

      {form.esrvcId || corppassStepLabels.length > 0 ? (
        <Stack spacing="0.5rem" mb="2.5rem">
          <ChangeEsrvcIdModal
            isOpen={isEsrvcIdModalOpen}
            onClose={onEsrvcIdModalClose}
            value={form.esrvcId ?? ''}
            corppassStepLabels={corppassStepLabels}
          />
          <Text textStyle="subhead-1" color="secondary.700">
            {t(`${STEP_LOGIN_COPY_KEY}.esrvcId.title`)}
          </Text>
          <Flex gap="1rem" align="center" wrap="wrap">
            <Text textStyle="body-1" color="secondary.700">
              {form.esrvcId || t(`${STEP_LOGIN_COPY_KEY}.esrvcId.notSet`)}
            </Text>
            <Button
              variant="link"
              isDisabled={isFormPublic}
              onClick={onEsrvcIdModalOpen}
            >
              {t(
                `${STEP_LOGIN_COPY_KEY}.esrvcId.${form.esrvcId ? 'change' : 'set'}`,
              )}
            </Button>
          </Flex>
          <Text textStyle="body-2" color="secondary.400">
            {corppassStepLabels.length > 0
              ? t(`${STEP_LOGIN_COPY_KEY}.esrvcId.usedBy`, {
                  steps: corppassStepLabels.join(', '),
                })
              : t(`${STEP_LOGIN_COPY_KEY}.esrvcId.unused`)}
          </Text>
        </Stack>
      ) : null}

      <Stack spacing="1rem">
        <Text textStyle="subhead-1" color="secondary.700">
          {t(`${STEP_LOGIN_COPY_KEY}.title`)}
        </Text>
        {savedAuths.map((saved, i) => (
          <StepLoginRow
            key={form.workflow[i]?._id ?? 'step-1'}
            form={form}
            stepIndex={i}
            saved={saved}
            isEditing={editingIndex === i}
            canEdit={
              !isFormPublic &&
              editingIndex === null &&
              (i === 0 || isLaterStepEditingEnabled)
            }
            onEdit={() => setEditingIndex(i)}
            onClose={() => setEditingIndex(null)}
          />
        ))}
      </Stack>
    </Box>
  )
}
