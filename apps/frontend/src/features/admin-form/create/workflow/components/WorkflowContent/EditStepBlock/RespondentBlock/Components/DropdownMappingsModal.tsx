import { useTranslation } from 'react-i18next'
import { BiChevronRight, BiEnvelope } from 'react-icons/bi'
import {
  Flex,
  FormControl,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { DropdownFormField, getMappingMismatchError } from './dropdownMapping'
import { DropdownRecipientsMapping } from './DropdownRecipientsMapping'

interface DropdownMappingsModalProps {
  fields: DropdownFormField[]
  isLoading: boolean
  onMapped: () => void
}

export const DropdownMappingsModal = ({
  fields,
  isLoading,
  onMapped,
}: DropdownMappingsModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const mappedCount = fields.filter(
    (field) =>
      field.optionsToRecipientsMap && !getMappingMismatchError(field, t),
  ).length

  return (
    <>
      <Button
        w="100%"
        h="auto"
        py="0.625rem"
        whiteSpace="normal"
        variant="outline"
        onClick={onOpen}
        isDisabled={isLoading}
      >
        <Flex w="100%" align="center" gap="0.5rem">
          <Icon as={BiEnvelope} fontSize="1.25rem" />
          <Text as="span" flex={1} textAlign="left">
            {t(
              'features.adminForm.sidebar.workflow.respondentSource.dropdownMappings.button',
            )}
          </Text>
          <Text as="span" textStyle="caption-1" color="secondary.400">
            {t(
              'features.adminForm.sidebar.workflow.respondentSource.dropdownMappings.progress',
              { mapped: mappedCount, total: fields.length },
            )}
          </Text>
          <Icon as={BiChevronRight} fontSize="1.25rem" />
        </Flex>
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>
            {t(
              'features.adminForm.sidebar.workflow.respondentSource.dropdownMappings.button',
            )}
          </ModalHeader>
          <ModalBody>
            <Stack spacing="1.5rem" divider={<StackDivider />}>
              {fields.map((field) => {
                const mismatchError = getMappingMismatchError(field, t)
                return (
                  <FormControl
                    key={field._id}
                    id={`dropdown-mapping-${field._id}`}
                    isInvalid={!!mismatchError}
                  >
                    <FormLabel
                      isRequired
                    >{`${field.questionNumber}. ${field.title}`}</FormLabel>
                    <DropdownRecipientsMapping
                      field={field}
                      isLoading={isLoading}
                      onMapped={onMapped}
                    />
                    <FormErrorMessage>{mismatchError}</FormErrorMessage>
                  </FormControl>
                )
              })}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              {t(
                'features.adminForm.sidebar.workflow.respondentSource.dropdownMappings.done',
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
