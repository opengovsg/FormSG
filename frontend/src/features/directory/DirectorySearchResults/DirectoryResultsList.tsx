import { useState } from 'react'
import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import fuzzysort from 'fuzzysort'

import { useAgencyForms } from '../queries'

import { FormPreviewModal } from './FormPreviewModal'

const NOT_FOUND_MESSAGE = 'Agency not found' // Keep in sync with backend error message

export const DirectoryResultsList = ({
  agency,
  activeSearch,
}: {
  agency: string
  activeSearch: string
}) => {
  const { data: forms, isLoading, error } = useAgencyForms(agency)

  const [formId, setFormId] = useState<string>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const displayedForms = fuzzysort
    .go(activeSearch, forms ?? [], {
      all: true,
      key: 'title',
    })
    .map((res) => res.obj)

  return (
    <>
      <Text as="h2" textStyle="h2" color="secondary.500">
        {displayedForms?.length} forms found
      </Text>
      <Stack flexDir="column">
        {isLoading
          ? 'loading state...'
          : error && error.message === NOT_FOUND_MESSAGE
          ? 'Agency not found'
          : !displayedForms || displayedForms.length === 0
          ? 'No forms found'
          : displayedForms.map(({ title, _id, startPage }) => (
              <Flex
                _hover={{
                  bg: 'primary.100',
                  transition: '0.2s ease',
                  cursor: 'pointer',
                }}
                _active={{
                  bg: 'primary.200',
                  transition: '0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setFormId(_id)
                  onOpen()
                }}
                p="1rem"
                flexDir="column"
                key={_id}
                border="secondary.300"
                borderWidth="1px"
                borderRadius="4px"
              >
                <Text textStyle="subhead-1">{title}</Text>
                <Text textStyle="caption-2">{startPage.paragraph}</Text>
              </Flex>
            ))}
      </Stack>
      <FormPreviewModal isOpen={isOpen} onClose={onClose} formId={formId} />
    </>
  )
}
