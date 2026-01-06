import { Box, Flex, Button, Stack } from '@chakra-ui/react'
import { ResponsesTableV2 } from './ResponsesTable/ResponsesTableV2'
import Searchbar, { useSearchbar } from '~components/Searchbar'
import { useState } from 'react'
import { BiCalendar, BiFilter, BiHide } from 'react-icons/bi'


const FilterButton = ({ icon, label }: { icon: React.ReactElement, label: string }) => {
  return (
    <Button
      leftIcon={icon}
      borderWidth='1'
      borderColor='secondary.200'
      color="secondary.500"
      variant='clear'
      _hover={{ bg: 'secondary.100', color: 'secondary.700' }}
    >
      {label}
    </Button>
  )
}
const FieldFilter = () => {
  return <FilterButton icon={<BiFilter />} label='Filter' />
}

const HideFields = () => {
  return <FilterButton icon={<BiHide />} label='Hide Fields' />
}
const TextSearchFilter = () => {
  const [inputValue, setInputValue] = useState<string | undefined>(undefined)

  const { inputRef } = useSearchbar()

  return (
    <Box maxWidth="300px">
      <Searchbar
        // isDisabled={isAnyFetching}
        ref={inputRef}
        value={inputValue}
        isExpanded={!!inputValue}
        onChange={setInputValue}
        onCollapseIconClick={() => setInputValue(undefined)}
        onSearch={() => { }}
        placeholder={'Search by text'}
      />
    </Box>
  )
}

const DateRangeFilter = () => {
  return (
    <FilterButton icon={<BiCalendar />} label='All time' />
  )
}

const FilterBar = () => {
  return (
    <Flex justifyContent={'space-between'}>
      <Flex gap='0.5rem'>
        <FieldFilter />
        <HideFields />
      </Flex>
      <Flex gap='0.5rem'>
        <TextSearchFilter />
        <DateRangeFilter />
      </Flex>
    </Flex >
  )
}

const UnlockedResponsesV2 = () => {
  return (
    <Stack width='100%' gap='0.5rem' flexDir='column'>
      <FilterBar />
      <Box overflow='auto' maxWidth='100%' flex={1}>
        <ResponsesTableV2 />
      </Box>
    </Stack>
  )
}

export default UnlockedResponsesV2
