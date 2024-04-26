import { Box, Flex, Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import { Searchbar, SearchbarProps } from './Searchbar'
import { useSearchbar } from './useSearchbar'

export default {
  title: 'Components/Searchbar',
  component: Searchbar,
  decorators: [],
} as Meta

export const Default: StoryFn<SearchbarProps> = (args) => (
  <Searchbar {...args} />
)
Default.args = {
  onChange: (newValue) => console.log('typed: ', newValue),
  onSearch: (query) => console.log(query),
}

export const ExpandableClosed: StoryFn<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { inputRef, isExpanded, handleExpansion, handleCollapse } =
    useSearchbar({
      isInitiallyExpanded,
    })

  return (
    <Searchbar
      ref={inputRef}
      isExpanded={isExpanded}
      onExpandIconClick={handleExpansion}
      onCollapseIconClick={handleCollapse}
      {...args}
    />
  )
}
ExpandableClosed.args = {
  isExpanded: false,
  onSearch: (query) => console.log(query),
}
ExpandableClosed.storyName = 'Expandable/Closed'

export const ExpandableOpen: StoryFn<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { inputRef, isExpanded, handleExpansion, handleCollapse } =
    useSearchbar({
      isInitiallyExpanded,
      isFocusOnExpand: false,
    })

  return (
    <Searchbar
      ref={inputRef}
      isExpanded={isExpanded}
      onExpandIconClick={handleExpansion}
      onCollapseIconClick={handleCollapse}
      {...args}
    />
  )
}
ExpandableOpen.args = {
  isExpanded: true,
  onSearch: (query) => console.log(query),
}
ExpandableOpen.storyName = 'Expandable/Open'

export const Unexpandable: StoryFn<SearchbarProps> = ({
  isExpandable,
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { inputRef, isExpanded, handleExpansion, handleCollapse } =
    useSearchbar({
      isInitiallyExpanded,
      isFocusOnExpand: false,
    })

  return (
    <Searchbar
      ref={inputRef}
      isExpandable={false}
      isExpanded={isExpanded}
      onExpandIconClick={handleExpansion}
      onCollapseIconClick={handleCollapse}
      {...args}
    />
  )
}
Unexpandable.args = {
  isExpandable: false,
  isExpanded: true,
  onSearch: (query) => console.log(query),
}

export const Playground: StoryFn<SearchbarProps> = ({
  isExpanded: isInitiallyExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion, handleCollapse } =
    useSearchbar({ isInitiallyExpanded })

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
          <Searchbar
            ref={inputRef}
            isExpanded={isExpanded}
            onExpandIconClick={handleExpansion}
            onCollapseIconClick={handleCollapse}
            {...args}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
Playground.args = {
  isExpanded: false,
  onSearch: (query) => alert(`${query} is being searched`),
}
