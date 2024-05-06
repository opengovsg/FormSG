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

export const RemoveSelfScreen = (): JSX.Element | null => {
  const isMobile = useIsMobile()
  const { mutateRemoveSelf } = useMutateCollaborators()
  const { handleBackToList, onClose } = useCollaboratorWizard()

  const handleRemoveSelf = useCallback(() => {
    return mutateRemoveSelf.mutate(undefined, { onSuccess: onClose })
  }, [mutateRemoveSelf, onClose])

  return (
    <>
      <ModalHeader color="brand.secondary.700">
        Remove myself as collaborator
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap" color="brand.secondary.500">
        <Text>
          You are removing yourself as a collaborator and will lose all access
          to this form. This action cannot be undone.
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
            isLoading={mutateRemoveSelf.isLoading}
            colorScheme="critical"
            onClick={handleRemoveSelf}
          >
            Yes, remove myself
          </Button>
          <Button
            isFullWidth={isMobile}
            isDisabled={mutateRemoveSelf.isLoading}
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
