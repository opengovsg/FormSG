import { useState } from 'react'
import { Divider, Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'

import { DIRECTORY_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'

import { useAgencyForms } from '../queries'

import { DirectorySearchResultsPagination } from './DirectorySearchResultsPagination'
import { FormPreviewModal } from './FormPreviewModal'

const NOT_FOUND_MESSAGE = 'Agency not found' // Keep in sync with backend error message

export const DirectorySearchResults = ({ agency }: { agency: string }) => {
  const { data, isLoading, error } = useAgencyForms(agency)

  const [resultsPerPage, setResultsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(0)
  const [formId, setFormId] = useState<string>()

  const { isOpen, onOpen, onClose } = useDisclosure()

  const maxNumberOfPages = Math.ceil((data?.length ?? 0) / resultsPerPage)

  const formsToShow = data?.slice(
    currentPage * resultsPerPage,
    (currentPage + 1) * resultsPerPage,
  )

  return (
    <>
      <Flex flexDir="column" gap="1rem">
        <Text as="h2" textStyle="h2" color="primary.500" alignSelf="center">
          Showing results for {agency}
        </Text>
        <Flex justifyContent="space-between">
          <Flex flexDir="column">
            <Text as="h2" textStyle="h2" color="secondary.500">
              {data?.length} results found
            </Text>
            <Text color="secondary.300">
              Displaying page {currentPage + 1} of {maxNumberOfPages}
            </Text>
          </Flex>
          <Flex alignSelf="center" alignItems="center">
            Displaying
            <Flex mx="0.5rem" maxW="6rem">
              <SingleSelect
                name="resultsPerPage"
                value={String(resultsPerPage)}
                items={[
                  { value: '5' },
                  { value: '10' },
                  { value: '25' },
                  { value: '50' },
                ]}
                onChange={(val) => {
                  if (isNaN(Number(val))) return
                  setResultsPerPage(Number(val))
                }}
                isClearable={false}
                isSearchable={false}
              />
            </Flex>
            results per page
          </Flex>
        </Flex>
        <Stack flexDir="column" divider={<Divider />}>
          {isLoading
            ? 'loading state...'
            : error && error.message === NOT_FOUND_MESSAGE
            ? 'Agency not found'
            : !data || data.length === 0
            ? 'No data found'
            : formsToShow?.map(({ title, _id, startPage }) => (
                <Flex
                  _hover={{
                    bg: 'primary.100',
                    transition: '0.2s ease',
                  }}
                  _active={{
                    bg: 'primary.200',
                    transition: '0.2s ease',
                  }}
                  onClick={() => {
                    setFormId(_id)
                    onOpen()
                  }}
                  py="1rem"
                  px="0.5rem"
                  flexDir="column"
                  key={_id}
                >
                  <Text textStyle="subhead-1">{title}</Text>
                  <Text textStyle="caption-2">{startPage.paragraph}</Text>
                </Flex>
              ))}
        </Stack>
        <DirectorySearchResultsPagination
          maxNumberOfPages={maxNumberOfPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <Flex gap="1rem" alignSelf="center" alignItems="center">
          <Text>Didn't find what you want?</Text>
          <Button
            onClick={() => window.location.assign(`${DIRECTORY_ROUTE}`)}
            variant="outline"
            size="sm"
          >
            Try searching within a different agency
          </Button>
        </Flex>
      </Flex>
      <FormPreviewModal isOpen={isOpen} onClose={onClose} formId={formId} />
    </>
  )
}
