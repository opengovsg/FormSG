import { useAdminForm } from '~features/admin-form/common/queries'

import {
  BuildFieldState,
  stateDataSelector,
  useBuilderAndDesignStore,
} from './useBuilderAndDesignStore'

export const useCreateTabForm = () => {
  const stateData = useBuilderAndDesignStore(stateDataSelector)
  return useAdminForm({
    // Only fetch data if no field is being created or edited
    enabled: stateData.state === BuildFieldState.Inactive,
  })
}
