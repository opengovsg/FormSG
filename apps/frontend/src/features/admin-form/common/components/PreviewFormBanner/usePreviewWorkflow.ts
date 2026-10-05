import { FormResponseMode } from 'formsg-shared/types/form'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

export const usePreviewWorkflow = () => {
  const { form } = usePublicFormContext()
  return form?.responseMode === FormResponseMode.Multirespondent
    ? form.workflow
    : undefined
}

export const useHasStickyPreviewBanner = (isTemplate?: boolean) => {
  const workflow = usePreviewWorkflow()
  return !!isTemplate || !!workflow?.length
}
