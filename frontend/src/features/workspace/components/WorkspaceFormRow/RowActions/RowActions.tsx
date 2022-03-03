import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

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

  const ComponentToRender = useMemo(() => {
    return isMobile ? RowActionsDrawer : RowActionsDropdown
  }, [isMobile])

  return (
    <Box
      pos="absolute"
      right="2rem"
      top={{ md: '1.5rem' }}
      bottom={{ base: '1.5rem', md: 'initial' }}
    >
      <ComponentToRender {...props} />
    </Box>
  )
}
