import { FormId } from '~shared/types/form/form'

import { useIsMobile } from '~hooks/useIsMobile'

import { RowActionsDrawer } from './RowActionsDrawer'
import { RowActionsDropdown } from './RowActionsDropdown'

export interface RowActionsProps {
  formId: FormId
  isDisabled?: boolean
}

export const RowActions = (props: RowActionsProps): JSX.Element => {
  const isMobile = useIsMobile()
  return isMobile ? (
    <RowActionsDrawer {...props} />
  ) : (
    <RowActionsDropdown {...props} />
  )
}
