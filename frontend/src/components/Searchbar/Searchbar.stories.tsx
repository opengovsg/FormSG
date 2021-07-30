import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Link from '../Link'

import { Searchbar, SearchbarProps } from './Searchbar'

export default {
  title: 'Components/Searchbar',
  component: Searchbar,
  decorators: [],
} as Meta

// Custom hooks for stories
const useSearchbar = (isInitiallyExpanded = false) => {
  const [isExpanded, onExpansionChange] = useState(isInitiallyExpanded)
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus()
    }
  }, [isExpanded])

  const handleExpansion = useCallback(() => onExpansionChange(true), [])
  const handleCollapse = useCallback(() => onExpansionChange(false), [])

  return {
    inputRef,
    isExpanded,
    handleExpansion,
    handleCollapse,
  }
}

export const Default: Story<SearchbarProps> = (args) => <Searchbar {...args} />
Default.args = {
  isExpanded: true,
  onSearch: (query) => console.log(query),
}

export const ExpandableClosed: Story<SearchbarProps> = ({
  isExpanded: _isExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion } = useSearchbar(_isExpanded)

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
  isExpanded: _isExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion } = useSearchbar(_isExpanded)

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
  isExpanded: _isExpanded,
  ...args
}) => {
  const { isExpanded, inputRef, handleExpansion, handleCollapse } =
    useSearchbar(_isExpanded)

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
