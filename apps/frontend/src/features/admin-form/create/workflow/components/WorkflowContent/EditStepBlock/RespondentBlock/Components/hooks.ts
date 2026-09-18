import { useTranslation } from 'react-i18next'

import { WorkflowType } from 'formsg-shared/types/form/workflow'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

export const useWorkflowTypeValidation = () => {
  const { t } = useTranslation()
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isSavePermissive = useIsWorkflowSavePermissive()
  return {
    required: isSavePermissive
      ? false
      : t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.requiredRedesign'
            : 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.required',
        ),
    validate: (value: WorkflowType) => {
      if (value && !Object.values(WorkflowType).includes(value)) {
        return t(
          isRedesign
            ? 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalidRedesign'
            : 'features.adminForm.sidebar.workflow.conditionalRouting.errors.respondentType.invalid',
        )
      }
    },
  }
}
