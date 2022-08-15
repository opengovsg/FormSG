import { useAdminForm } from '~features/admin-form/common/queries'

import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from './useFieldBuilderStore'

export const useCreateTabForm = () => {
  const stateData = useFieldBuilderStore(stateDataSelector)
  return useAdminForm({
    // Only fetch data if no field is being created or edited
    enabled: stateData.state === FieldBuilderState.Inactive,
  })
}
