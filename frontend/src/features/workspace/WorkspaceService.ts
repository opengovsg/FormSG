import axios from 'axios'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

// endpoint exported for testing
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

/**
 * Gets metadata for all forms in dashboard view i.e. forms which user
 * owns or collaborates on
 * @returns Metadata required for forms on dashboard view
 */
export const getDashboardView = async (): Promise<
  AdminDashboardFormMetaDto[]
> => {
  return axios
    .get<AdminDashboardFormMetaDto[]>(`${ADMIN_FORM_ENDPOINT}`)
    .then(({ data }) => data)
}
