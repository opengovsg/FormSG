import { useTranslation } from 'react-i18next'

import { WorkflowType } from 'formsg-shared/types/form/workflow'

import { workflowNs } from '~/i18n/locales/features/admin-form/sidebar/workflow'

import { useIsWorkflowBuilderRedesign } from '../../../../../hooks/useIsWorkflowBuilderRedesign'
import { useIsWorkflowSavePermissive } from '../../../../../hooks/useIsWorkflowSavePermissive'

export const useWorkflowTypeValidation = () => {
  const { t } = useTranslation(workflowNs)
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isSavePermissive = useIsWorkflowSavePermissive()
  return {
    required: isSavePermissive
      ? false
      : t(
          isRedesign
            ? 'conditionalRouting.errors.respondentType.requiredRedesign'
            : 'conditionalRouting.errors.respondentType.required',
        ),
    validate: (value: WorkflowType) => {
      if (value && !Object.values(WorkflowType).includes(value)) {
        return t(
          isRedesign
            ? 'conditionalRouting.errors.respondentType.invalidRedesign'
            : 'conditionalRouting.errors.respondentType.invalid',
        )
      }
    },
  }
}
