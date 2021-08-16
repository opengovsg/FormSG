import { Box, Flex, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Link from '../Link'

import { Searchbar, SearchbarProps } from './Searchbar'
import { useSearchbar } from './useSearchbar'

export default {
  title: 'Components/Searchbar',
  component: Searchbar,
  decorators: [],
} as Meta

export const Default: Story<SearchbarProps> = (args) => <Searchbar {...args} />
Default.args = {
  isExpanded: true,
  onSearch: (query) => console.log(query),
}

export const ExpandableClosed: Story<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion } = useSearchbar({
    isInitiallyExpanded,
    isFocusOnExpand: true,
  })

  return (
    <Searchbar
      ref={inputRef}
      isExpanded={isExpanded}
      onSearchIconClick={isExpanded ? undefined : handleExpansion}
      {...args}
    />
  )
}
ExpandableClosed.args = {
  onSearch: (query) => console.log(query),
  isExpanded: false,
}
ExpandableClosed.storyName = 'Expandable/Closed'

export const ExpandableOpen: Story<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion } = useSearchbar({
    isInitiallyExpanded,
  })

  return (
    <Searchbar
      ref={inputRef}
      onSearchIconClick={isExpanded ? undefined : handleExpansion}
      isExpanded={isExpanded}
      {...args}
    />
  )
}
ExpandableOpen.args = {
  onSearch: (query) => console.log(query),
  isExpanded: true,
}
ExpandableOpen.storyName = 'Expandable/Open'

export const Playground: Story<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion, handleCollapse } =
    useSearchbar({ isInitiallyExpanded, isFocusOnExpand: true })

  return (
    <Box
      bg="neutral.100"
      p="2.625rem"
      color="secondary.500"
      transitionProperty="position"
    >
      <Text textStyle="h2">Form examples</Text>
      <Flex justify="space-between">
        <Text textStyle="body-1">Explore forms and use as a template</Text>
        <Flex align="center" w="20rem" justify="flex-end">
          {isExpanded && (
            <Link variant="inline" mr="1rem" onClick={handleCollapse}>
              Reset
            </Link>
          )}
          <Searchbar
            ref={inputRef}
            onSearchIconClick={isExpanded ? undefined : handleExpansion}
            isExpanded={isExpanded}
            {...args}
          />
        </Flex>
      </Flex>
    </Box>
  )
}

Playground.args = {
  onSearch: (query) => alert(`${query} is being searched`),
  isExpanded: false,
}
