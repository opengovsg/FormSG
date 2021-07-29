/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react'
import { Meta, Story } from '@storybook/react'

import { Searchbar, SearchbarProps } from './Searchbar'

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

export const ExpandableClosed: Story<SearchbarProps> = (args) => {
  const [isExpanded, onExpansionChange] = useState(false)
  return (
    <Searchbar
      {...args}
      isExpanded={isExpanded}
      onExpansionChange={onExpansionChange}
    />
  )
}
ExpandableClosed.args = {
  onSearch: (query) => console.log(query),
}
ExpandableClosed.storyName = 'Expandable/Closed'

export const ExpandableOpen: Story<SearchbarProps> = (args) => {
  const [isExpanded, onExpansionChange] = useState(true)
  return (
    <Searchbar
      {...args}
      isExpanded={isExpanded}
      onExpansionChange={onExpansionChange}
    />
  )
}
ExpandableOpen.args = {
  onSearch: (query) => console.log(query),
}
ExpandableOpen.storyName = 'Expandable/Open'
