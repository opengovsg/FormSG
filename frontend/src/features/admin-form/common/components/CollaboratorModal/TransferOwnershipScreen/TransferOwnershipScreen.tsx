import {
  ButtonGroup,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { useCollaboratorWizard } from '../CollaboratorWizardContext'

export const TransferOwnershipScreen = (): JSX.Element => {
  const {
    handleBackToList,
    formMethods: { watch },
  } = useCollaboratorWizard()

  const transferEmail = watch('email')

  return (
    <>
      <ModalHeader color="secondary.700">Transfer form ownership</ModalHeader>
      <ModalBody whiteSpace="pre-line" pb="3.25rem">
        <Text>
          You are transferring this form to{' '}
          <Text color="danger.500" as="span" fontWeight={700}>
            {transferEmail}
          </Text>
          . You will lose form ownership and the right to delete this form. You
          will still have Editor rights.
        </Text>
      </ModalBody>
      <ModalFooter>
        <ButtonGroup>
          <Button
            variant="clear"
            colorScheme="secondary"
            onClick={handleBackToList}
          >
            Cancel
          </Button>
          <Button colorScheme="danger">Yes, transfer form</Button>
        </ButtonGroup>
      </ModalFooter>
    </>
  )
}
