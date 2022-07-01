import { Box, Flex, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Searchbar, SearchbarProps } from './Searchbar'
import { useSearchbar } from './useSearchbar'

export default {
  title: 'Components/Searchbar',
  component: Searchbar,
  decorators: [],
} as Meta

export const Default: Story<SearchbarProps> = (args) => <Searchbar {...args} />
Default.args = {
  onSearch: (query) => console.log(query),
}

export const ExpandableClosed: Story<SearchbarProps> = (args) => {
  const { inputRef } = useSearchbar()

  return <Searchbar ref={inputRef} isExpanded={false} {...args} />
}
ExpandableClosed.args = {
  onSearch: (query) => console.log(query),
}
ExpandableClosed.storyName = 'Expandable/Closed'

export const ExpandableOpen: Story<SearchbarProps> = (args) => {
  const { inputRef } = useSearchbar()

  return <Searchbar ref={inputRef} isExpanded={true} {...args} />
}
ExpandableOpen.args = {
  onSearch: (query) => console.log(query),
}
ExpandableOpen.storyName = 'Expandable/Open'

export const UnexpandableOpen: Story<SearchbarProps> = (args) => {
  const { inputRef } = useSearchbar()

  return <Searchbar ref={inputRef} isExpandable={false} {...args} />
}
UnexpandableOpen.args = {
  onSearch: (query) => console.log(query),
}
UnexpandableOpen.storyName = 'Unexpandable/Open'

export const Playground: Story<SearchbarProps> = (args) => {
  const { inputRef } = useSearchbar()

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
        <Flex align="center" maxW="25rem" justify="flex-end">
          <Searchbar ref={inputRef} {...args} />
        </Flex>
      </Flex>
    </Box>
  )
}

Playground.args = {
  onSearch: (query) => alert(`${query} is being searched`),
}
