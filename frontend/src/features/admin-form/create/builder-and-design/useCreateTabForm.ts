import { useAdminForm } from '~features/admin-form/common/queries'

import {
  FieldBuilderState,
  fieldBuilderStateSelector,
  useFieldBuilderStore,
} from './useFieldBuilderStore'

export const useCreateTabForm = () => {
  const fieldBuilderState = useFieldBuilderStore(fieldBuilderStateSelector)
  return useAdminForm({
    // Only fetch data if no field is being created or edited
    enabled: fieldBuilderState === FieldBuilderState.Inactive,
  })
}
