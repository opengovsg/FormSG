import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormFieldDto } from 'formsg-shared/types'
import { getIncompleteStepNumbers } from 'formsg-shared/utils/workflow-step-completion'

import { getWorkflowStepLabel } from '../utils/getWorkflowStepLabel'

import { useAdminFormWorkflow } from './useAdminFormWorkflow'

/**
 * Names of the workflow steps that are not finished, in step order (FRM-2489).
 * Runs the same predicate the backend uses, on the form already in the cache.
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
