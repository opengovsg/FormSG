import { ModalBody, ModalHeader, Stack } from '@chakra-ui/react'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'

import { AddCollaboratorInput } from './AddCollaboratorInput'
import { CollaboratorList } from './CollaboratorList'

export const CollaboratorListScreen = (): JSX.Element => {
  const { showEditableModal } = useAdminFormCollaborators()
  return (
    <>
      <ModalHeader color="secondary.700">
        {showEditableModal ? 'Manage collaborators' : 'Collaborators'}
      </ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Stack spacing="2.5rem" pb="2rem">
          {showEditableModal ? <AddCollaboratorInput /> : null}
          <CollaboratorList />
        </Stack>
      </ModalBody>
    </>
  )
}
