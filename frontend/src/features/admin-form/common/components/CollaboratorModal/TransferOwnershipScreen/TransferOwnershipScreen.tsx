import { useCallback } from 'react'
import {
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'

import { useIsMobile } from '~hooks/useIsMobile'

import { useMutateCollaborators } from '~features/admin-form/common/mutations'

import { useCollaboratorWizard } from '../CollaboratorWizardContext'

export const TransferOwnershipScreen = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const { mutateTransferFormOwnership } = useMutateCollaborators()
  const { handleBackToList, emailToTransfer } = useCollaboratorWizard()

  const handleTransferOwnership = useCallback(() => {
    if (!emailToTransfer) return
    return mutateTransferFormOwnership.mutate(emailToTransfer, {
      onSuccess: () => handleBackToList(),
    })
  }, [emailToTransfer, handleBackToList, mutateTransferFormOwnership])

  if (!emailToTransfer) return null

  return (
    <>
      <ModalHeader color="brand.secondary.700">
        Transfer form ownership
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="brand.secondary.500">
        <Text>
          You are transferring this form to{' '}
          <Text color="interaction.critical.default" as="span" fontWeight={700}>
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
            isLoading={mutateTransferFormOwnership.isLoading}
            colorScheme="critical"
            onClick={handleTransferOwnership}
          >
            Yes, transfer form
          </Button>
          <Button
            isFullWidth={isMobile}
            isDisabled={mutateTransferFormOwnership.isLoading}
            variant="clear"
            colorScheme="sub"
            onClick={handleBackToList}
          >
            Cancel
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}
