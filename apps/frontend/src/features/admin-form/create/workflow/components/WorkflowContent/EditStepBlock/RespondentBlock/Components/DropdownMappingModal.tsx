import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Flex,
  FormControl,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import { DropdownFieldBase } from 'formsg-shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
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
  const isMobile = useIsMobile()

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
    <Modal size={isMobile ? 'mobile' : 'md'} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Text textStyle="h4">Map emails to options</Text>
        </ModalHeader>
        <ModalBody>
          <Stack spacing="1rem">
            {fieldOptions.map((option) => (
              <Box key={option}>
                <Text textStyle="subhead-2" mb="0.375rem">
                  {option}
                </Text>
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
          <Link
            mt="1rem"
            display="inline-block"
            textStyle="body-2"
            color="primary.500"
            onClick={handleCsvFallback}
          >
            Upload CSV instead
          </Link>
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
