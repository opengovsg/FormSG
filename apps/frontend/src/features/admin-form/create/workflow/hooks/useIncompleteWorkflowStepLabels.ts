import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormFieldDto } from 'formsg-shared/types'
import { getIncompleteStepNumbers } from 'formsg-shared/utils/workflow-step-completion'

import { getWorkflowStepLabel } from '../utils/getWorkflowStepLabel'

import { useAdminFormWorkflow } from './useAdminFormWorkflow'

/**
 * Names of the workflow steps that are not finished, in step order. Empty when
 * the workflow is complete, so callers can treat a non-empty result as "publish
 * is blocked" (FRM-2489).
 *
 * Runs the same predicate the backend uses, on the form already in the cache,
 * so the publish pre-check costs no extra request.
 */
export const useIncompleteWorkflowStepLabels = (): string[] => {
  const { t } = useTranslation()
  const { formWorkflow, formFields } = useAdminFormWorkflow()
  const stepWord = t('features.common.entities.step')

  return useMemo(() => {
    if (!formWorkflow) return []

    return getIncompleteStepNumbers(
      formWorkflow,
      (formFields ?? []) as FormFieldDto[],
    ).map((stepNumber) =>
      getWorkflowStepLabel({
        stepNumber,
        stepName: formWorkflow[stepNumber]?.step_name,
        stepWord,
      }),
    )
  }, [formWorkflow, formFields, stepWord])
}
