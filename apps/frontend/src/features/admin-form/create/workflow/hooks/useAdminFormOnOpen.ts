import { useEffect, useRef, useState } from 'react'

import { useAdminForm } from '~features/admin-form/common/queries'

/**
 * The admin form as it was when a modal opened. A refetch while it is open
 * must not change what the admin is confirming.
 */
export const useAdminFormOnOpen = (isOpen: boolean) => {
  const { data: loadedForm } = useAdminForm()
  const [form, setForm] = useState(loadedForm)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (isOpen && !wasOpen.current) setForm(loadedForm)
    wasOpen.current = isOpen
  }, [isOpen, loadedForm])
  return form
}
