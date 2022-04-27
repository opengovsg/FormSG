import { Spacer } from '@chakra-ui/react'

import { DropdownRole } from '../constants'

import { CollaboratorRow } from './CollaboratorRow'
import { ViewOnlyPermission } from './ViewOnlyPermission'

export interface OwnerRowProps {
  ownerEmail: string | undefined
  isCurrentUser: boolean
  isLoading: boolean
}

export const OwnerRow = ({
  ownerEmail,
  isCurrentUser,
  isLoading,
}: OwnerRowProps): JSX.Element => {
  return (
    <CollaboratorRow
      email={ownerEmail}
      isCurrentUser={isCurrentUser}
      isLoading={isLoading}
    >
      <ViewOnlyPermission role={DropdownRole.Owner}>
        <Spacer w="2.75rem" />
      </ViewOnlyPermission>
    </CollaboratorRow>
  )
}
