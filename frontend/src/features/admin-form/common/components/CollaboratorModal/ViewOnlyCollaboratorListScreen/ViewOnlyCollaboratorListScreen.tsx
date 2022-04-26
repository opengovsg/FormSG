import { ModalBody, ModalHeader } from '@chakra-ui/react'

import { ViewOnlyCollaboratorList } from './ViewOnlyCollaboratorList'

export const ViewOnlyCollaboratorListScreen = (): JSX.Element => {
  return (
    <>
      <ModalHeader color="secondary.700">Collaborators</ModalHeader>
      <ModalBody whiteSpace="pre-line" pb="2rem">
        <ViewOnlyCollaboratorList />
      </ModalBody>
    </>
  )
}
