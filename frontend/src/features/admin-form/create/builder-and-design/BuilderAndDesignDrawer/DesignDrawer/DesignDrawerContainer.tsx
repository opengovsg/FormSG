import { useAdminForm } from '~features/admin-form/common/queries'

import { DesignDrawer } from './DesignDrawer'

export const DesignDrawerContainer = (): JSX.Element | null => {
  const { data: form } = useAdminForm()

  return form ? <DesignDrawer startPage={form.startPage} /> : null
}
