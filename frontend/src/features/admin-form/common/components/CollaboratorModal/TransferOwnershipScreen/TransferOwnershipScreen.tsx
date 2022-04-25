import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useCollaboratorWizard } from '../CollaboratorWizardContext'

export const TransferOwnershipScreen = (): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    handleBackToList,
    emailToTransfer,
    handleTransferOwnership,
    isMutationLoading,
  } = useCollaboratorWizard()

  return (
    <>
      <ModalHeader color="secondary.700">Transfer form ownership</ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Text>
          You are transferring this form to{' '}
          <Text color="danger.500" as="span" fontWeight={700}>
            {emailToTransfer}
          </Text>
          . You will lose form ownership and the right to delete this form. You
          will still have Editor rights.
        </Text>
      </ModalBody>
      <ModalFooter>
        <Stack
          flex={1}
          spacing="1rem"
          direction={{ base: 'column', md: 'row-reverse' }}
        >
          <Button
            isFullWidth={isMobile}
            isLoading={isMutationLoading}
            colorScheme="danger"
            onClick={handleTransferOwnership}
          >
            Yes, transfer form
          </Button>
          <Button
            isFullWidth={isMobile}
            isDisabled={isMutationLoading}
            variant="clear"
            colorScheme="secondary"
            onClick={handleBackToList}
          >
            Cancel
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
