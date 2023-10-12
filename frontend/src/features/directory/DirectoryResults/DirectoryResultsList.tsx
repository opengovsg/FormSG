import { useState } from 'react'
import {
  Box,
  Flex,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import fuzzysort from 'fuzzysort'

import { useAgencyForms } from '../queries'

import {
  DirectoryResultsListPagination,
  useDirectoryResultsListPagination,
} from './DirectoryResultsListPagination'
import { FormPreviewModal } from './FormPreviewModal'

export type DirectoryResultsListProps = {
  agencyShortName: string
  searchValue: string
}

export const DirectoryResultsList = ({
  agencyShortName,
  searchValue,
}: DirectoryResultsListProps) => {
  const { data: forms, isLoading } = useAgencyForms(agencyShortName)

  const [formId, setFormId] = useState<string>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const searchedForms = fuzzysort
    .go(searchValue, forms ?? [], {
      all: true,
      key: 'title',
    })
    .map((res) => res.obj)

  const usePaginationProps = useDirectoryResultsListPagination(searchedForms)

  const { paginatedData } = usePaginationProps

  return (
    <>
      <Flex gap="0.5rem" align="flex-end">
        {isLoading ? (
          <Skeleton minH="2rem" minW="2rem" />
        ) : (
          <Text textStyle="h2">{searchedForms?.length}</Text>
        )}
        <Text textStyle="h4" mb="2px">
          forms found
        </Text>
      </Flex>

      {isLoading ? (
        <DirectoryResultsListSkeleton />
      ) : (
        <Stack flexDir="column" gap="0.5rem">
          {!searchedForms || searchedForms.length === 0
            ? 'No forms found'
            : paginatedData.map(({ title, _id, startPage }) => (
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
      )}
      <Box alignSelf="center">
        <DirectoryResultsListPagination {...usePaginationProps} />
      </Box>
      <FormPreviewModal isOpen={isOpen} onClose={onClose} formId={formId} />
    </>
  )
}

const DirectoryResultsListSkeleton = () => {
  return (
    <Stack gap="0.5rem">
      <Skeleton minH="4rem" minW="10rem" />
      <Skeleton minH="4rem" minW="10rem" />
      <Skeleton minH="4rem" minW="10rem" />
      <Skeleton minH="4rem" minW="10rem" />
      <Skeleton minH="4rem" minW="10rem" />
    </Stack>
  )
}
