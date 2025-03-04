import { useTranslation } from 'react-i18next'

import { WorkflowType } from '~shared/types/form/workflow'

export const useWorkflowTypeValidation = () => {
  const { t } = useTranslation()
  return {
    required: t(
      'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.required',
    ),
    validate: (value: WorkflowType) => {
      if (!Object.values(WorkflowType).includes(value)) {
        return t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalid',
        )
      }
    },
  }
}
