import { useTranslation } from 'react-i18next'
import { Link as ReactLink, useParams } from 'react-router-dom'
import {
  Box,
  Divider,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormFieldDto,
  FormStatus,
  FormWorkflowStepDto,
  WorkflowType,
} from 'formsg-shared/types'
import {
  findFirstStepUsingAuthType,
  resolveAllStepAuths,
} from 'formsg-shared/utils/workflow-auth'

import { ADMINFORM_ROUTE } from '~constants/routes'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { getOpenWorkflowTabState } from '~features/admin-form/create/common/OpenWorkflowTabOnArrival'
import { StepLoginBadges } from '~features/admin-form/create/workflow/components/WorkflowContent/StepLogin/StepLoginSummary'
import { useStepLoginTypeLabel } from '~features/admin-form/create/workflow/components/WorkflowContent/StepLogin/useStepLoginTypeLabel'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'

const COPY_KEY = 'features.adminForm.settings.singpassStepLogin'

const WorkflowTabLink = ({
  children,
  editStep,
  ariaLabel,
}: {
  children: string
  editStep?: number
  ariaLabel?: string
}): JSX.Element => {
  const { formId } = useParams()
  return (
    <Link
      as={ReactLink}
      to={`${ADMINFORM_ROUTE}/${formId}`}
      state={getOpenWorkflowTabState(editStep)}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  )
}

const useDescribeStepRespondent = () => {
  const { t } = useTranslation()
  return (
    formFields: FormFieldDto[],
    step: FormWorkflowStepDto | undefined,
    stepIndex: number,
  ): string => {
    if (stepIndex === 0 || !step) return t(`${COPY_KEY}.anyoneWithLink`)
    const titleOf = (fieldId: string) =>
      formFields.find((field) => field._id === fieldId)?.title ??
      t(`${COPY_KEY}.deletedField`)
    switch (step.workflow_type) {
      case WorkflowType.Static:
        return step.emails.join(', ')
      case WorkflowType.Dynamic:
        return t(`${COPY_KEY}.emailField`, { title: titleOf(step.field) })
      case WorkflowType.Conditional:
        return t(`${COPY_KEY}.dropdownOptions`, {
          title: titleOf(step.conditional_field),
        })
    }
  }
}

/** Settings › Singpass for MRF forms: each step's saved login, with Edit links into the Workflow tab. */
export const MrfLoginOverview = ({
  form,
  isReadOnly = false,
}: {
  form: AdminMultirespondentFormDto
  // Without step login editing, saved logins are still listed, with no Edit links.
  isReadOnly?: boolean
}): JSX.Element => {
  const { t } = useTranslation()
  const getTypeLabel = useStepLoginTypeLabel()
  const describeRespondent = useDescribeStepRespondent()
  const rows = resolveAllStepAuths(form, form.workflow)
  const corppassStepIndex = findFirstStepUsingAuthType(
    form,
    form.workflow,
    FormAuthType.CP,
  )

  return (
    <Box>
      {isReadOnly ? null : (
        <>
          <AuthSettingsDescriptionText />
          <InlineMessage mb="1rem">
            <Text>
              {t(`${COPY_KEY}.summaryBefore`)}{' '}
              <WorkflowTabLink>{t(`${COPY_KEY}.workflowTab`)}</WorkflowTabLink>
              {t(`${COPY_KEY}.summaryAfter`)}
            </Text>
          </InlineMessage>
        </>
      )}
      {!isReadOnly && form.status === FormStatus.Public ? (
        <InlineMessage mb="1rem">
          {t(`${COPY_KEY}.closeFormToEdit`)}
        </InlineMessage>
      ) : null}
      <Text textStyle="body-2" color="secondary.400" mb="2.5rem">
        {t('features.adminForm.sidebar.workflow.stepLogin.newSubmissionsOnly')}
      </Text>
      <Stack spacing="1rem">
        <Text textStyle="subhead-1">{t(`${COPY_KEY}.tableTitle`)}</Text>
        <Box overflowX="auto">
          {/* Top-align so each row's cells line up with the step title, not the middle of its two lines. */}
          <Table
            variant="simple"
            size="sm"
            sx={{ td: { verticalAlign: 'top' } }}
          >
            <Thead>
              <Tr>
                <Th>{t(`${COPY_KEY}.columns.step`)}</Th>
                <Th>{t(`${COPY_KEY}.columns.login`)}</Th>
                <Th>{t(`${COPY_KEY}.columns.checks`)}</Th>
                {isReadOnly ? null : <Th />}
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((resolved, i) => {
                const step = form.workflow[i] as FormWorkflowStepDto | undefined
                const hasChecks =
                  resolved.isSubmitterIdCollectionEnabled ||
                  resolved.isWhitelistEnabled ||
                  resolved.isSingleSubmission
                return (
                  <Tr key={step?._id ?? 'step-1'}>
                    <Td>
                      <Text textStyle="subhead-2">
                        {step?.step_name
                          ? t(`${COPY_KEY}.namedStepTitle`, {
                              stepNumber: i + 1,
                              stepName: step.step_name,
                            })
                          : t(`${COPY_KEY}.stepTitle`, { stepNumber: i + 1 })}
                      </Text>
                      <Text textStyle="caption-1" color="secondary.400">
                        {describeRespondent(form.form_fields, step, i)}
                      </Text>
                    </Td>
                    <Td>
                      <Text textStyle="body-2">
                        {getTypeLabel(resolved.authType)}
                      </Text>
                    </Td>
                    <Td>
                      {hasChecks ? (
                        <StepLoginBadges resolved={resolved} hideAuthType />
                      ) : (
                        <Text textStyle="body-2" color="secondary.400">
                          {t(`${COPY_KEY}.noChecks`)}
                        </Text>
                      )}
                    </Td>
                    {isReadOnly ? null : (
                      <Td>
                        <WorkflowTabLink
                          editStep={i}
                          ariaLabel={t(`${COPY_KEY}.editAriaLabel`, {
                            stepNumber: i + 1,
                          })}
                        >
                          {t(`${COPY_KEY}.edit`)}
                        </WorkflowTabLink>
                      </Td>
                    )}
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>
      </Stack>
      {corppassStepIndex >= 0 ? (
        <>
          <Divider my="2.5rem" />
          <Stack spacing="0.5rem">
            <Text textStyle="subhead-1">{t(`${COPY_KEY}.esrvcIdTitle`)}</Text>
            <Text textStyle="body-2">
              {form.esrvcId || t(`${COPY_KEY}.esrvcIdNotSet`)}
            </Text>
            <Text textStyle="body-2" color="secondary.400">
              {t(`${COPY_KEY}.esrvcIdShared`)}
              {isReadOnly ? null : (
                <>
                  {' '}
                  <WorkflowTabLink editStep={corppassStepIndex}>
                    {t(`${COPY_KEY}.esrvcIdChange`, {
                      stepNumber: corppassStepIndex + 1,
                    })}
                  </WorkflowTabLink>
                </>
              )}
            </Text>
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
