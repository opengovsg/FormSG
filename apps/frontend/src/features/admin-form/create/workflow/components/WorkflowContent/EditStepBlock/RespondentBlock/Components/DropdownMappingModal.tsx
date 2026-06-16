import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { DropdownFieldBase } from 'formsg-shared/types'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import { TagInput } from '~components/TagInput'

interface DropdownMappingModalProps {
  isOpen: boolean
  onClose: () => void
  fieldOptions: string[]
  existingMapping: DropdownFieldBase['optionsToRecipientsMap'] | undefined
  onSave: (mapping: Record<string, string[]>) => void
  isSaving: boolean
  onOpenCsvModal: () => void
}

export const DropdownMappingModal = ({
  isOpen,
  onClose,
  fieldOptions,
  existingMapping,
  onSave,
  isSaving,
  onOpenCsvModal,
}: DropdownMappingModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  // Local state: option -> emails array
  const [mapping, setMapping] = useState<Record<string, string[]>>({})

  // Sync from existing mapping when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, string[]> = {}
      for (const option of fieldOptions) {
        initial[option] = existingMapping?.[option] ?? []
      }
      setMapping(initial)
    }
  }, [isOpen, fieldOptions, existingMapping])

  const handleEmailsChange = useCallback(
    (option: string) => (emails: string[]) => {
      setMapping((prev) => ({ ...prev, [option]: emails }))
    },
    [],
  )

  const handleSave = () => {
    onSave(mapping)
  }

  const handleCsvFallback = () => {
    onClose()
    onOpenCsvModal()
  }

  const hasAnyEmails = Object.values(mapping).some(
    (emails) => emails.length > 0,
  )

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700" pr="4rem">
          Map emails to options
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            {fieldOptions.map((option) => (
              <Box key={option}>
                <FormLabel mb="0.5rem" textColor="secondary.700">
                  {`Map emails to "${option}"`}
                </FormLabel>
                <FormControl>
                  <TagInput
                    placeholder="Add email addresses..."
                    value={mapping[option] ?? []}
                    onChange={handleEmailsChange(option)}
                    tagValidation={isEmail}
                    keyDownKeys={['Enter', ',', ' ']}
                    preventDuplicates
                  />
                </FormControl>
              </Box>
            ))}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Flex w="100%" justifyContent="space-between" alignItems="center">
            <Button variant="clear" onClick={handleCsvFallback}>
              Upload CSV instead
            </Button>
            <Flex gap="0.5rem">
              <Button variant="clear" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                isDisabled={!hasAnyEmails}
              >
                Save
              </Button>
            </Flex>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
