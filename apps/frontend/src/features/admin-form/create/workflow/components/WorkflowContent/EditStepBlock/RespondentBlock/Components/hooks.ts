import { useTranslation } from 'react-i18next'

import { WorkflowType } from 'formsg-shared/types/form/workflow'

import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

export const useWorkflowTypeValidation = () => {
  const { t } = useTranslation()
  const isSavePermissive = useIsWorkflowSavePermissive()
  return {
    required: isSavePermissive
      ? false
      : t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.required',
        ),
    validate: (value: WorkflowType) => {
      if (value && !Object.values(WorkflowType).includes(value)) {
        return t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalid',
        )
      }
    },
  }
}
