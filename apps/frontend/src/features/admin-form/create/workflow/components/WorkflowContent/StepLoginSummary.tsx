import { useTranslation } from 'react-i18next'
import { Link as ReactLink, useParams } from 'react-router-dom'
import { Flex, Stack, Text } from '@chakra-ui/react'

import { FormAuthType } from 'formsg-shared/types'
import { resolveStepAuth } from 'formsg-shared/utils/workflow-auth'

import { textStyles } from '~theme/textStyles'
import {
  ADMINFORM_ROUTE,
  ADMINFORM_SETTINGS_SINGPASS_SUBROUTE,
} from '~constants/routes'
import Link from '~components/Link'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useStepLoginLabels } from '~features/admin-form/settings/components/AuthSettingsSection/StepLogin/useStepLoginLabels'

import { useIsMrfSingpassAllSteps } from '../../hooks/useIsMrfSingpassAllSteps'
import { useWorkflowSurfaces } from '../../hooks/useWorkflowSurfaces'

import { EditStepBlockContainer } from './EditStepBlock/EditStepBlockContainer'

interface StepLoginSummaryProps {
  // Zero-based step index.
  stepNumber: number
  // Step cards are buttons, so only the editor links to Settings.
  isEditor?: boolean
}

// Read-only login line for a workflow step; login is edited in Settings › Singpass.
export const StepLoginSummary = ({
  stepNumber,
  isEditor = false,
}: StepLoginSummaryProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const { sectionLabelTextStyle } = useWorkflowSurfaces()
  const { getTypeLabel, getCheckLabels } = useStepLoginLabels()
  const isStepLoginEnabled = useIsMrfSingpassAllSteps()

  if (!form || !('workflow' in form)) return null
  const saved = resolveStepAuth(form, form.workflow, stepNumber)
  // Without the flag, only saved logins are worth a line.
  if (!isStepLoginEnabled && saved.authType === FormAuthType.NIL) return null
  const summary = [getTypeLabel(saved.authType), ...getCheckLabels(saved)].join(
    ' · ',
  )
  const title = t('features.adminForm.sidebar.workflow.stepLogin.title')

  if (!isEditor) {
    return (
      <Stack>
        <Text textStyle={sectionLabelTextStyle}>{title}</Text>
        <Text>{summary}</Text>
      </Stack>
    )
  }

  return (
    <EditStepBlockContainer>
      <Text style={textStyles.h4} textStyle="subhead-1">
        {title}
      </Text>
      <Flex gap="1rem" align="center" wrap="wrap">
        <Text>{summary}</Text>
        {/* Later steps are read-only in Settings until the flag is on. */}
        {isStepLoginEnabled || stepNumber === 0 ? (
          <Link
            as={ReactLink}
            to={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SINGPASS_SUBROUTE}`}
          >
            {t(
              'features.adminForm.sidebar.workflow.stepLogin.changeInSettings',
            )}
          </Link>
        ) : null}
      </Flex>
    </EditStepBlockContainer>
  )
}
