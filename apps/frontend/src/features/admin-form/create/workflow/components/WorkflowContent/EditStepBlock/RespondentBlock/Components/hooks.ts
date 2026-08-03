import { useTranslation } from 'react-i18next'

import { WorkflowType } from 'formsg-shared/types/form/workflow'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'

export const useWorkflowTypeValidation = () => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  return {
    required: t(
      isRedesign
        ? 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.requiredRedesign'
        : 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.required',
    ),
    validate: (value: WorkflowType) => {
      if (!Object.values(WorkflowType).includes(value)) {
        return t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalidRedesign'
            : 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalid',
        )
      }
    },
  }
}
