import { useEffect, useState } from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { viewports } from '~utils/storybook'

import { Pagination, PaginationProps } from './Pagination'

export default {
  title: 'Components/Pagination',
  component: Pagination,
  decorators: [],
} as Meta

const Template: StoryFn<PaginationProps> = (args) => {
  const [currentPage, setCurrentPage] = useState(args.currentPage)

  useEffect(() => {
    setCurrentPage(args.currentPage)
  }, [args.currentPage])

  return (
    <Pagination
      {...args}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    />
  )
}
export const Default = Template.bind({})
Default.args = {
  currentPage: 5,
  totalCount: 1000,
  pageSize: 10,
}

export const Disabled = Template.bind({})
Disabled.args = {
  currentPage: 5,
  totalCount: 1000,
  pageSize: 10,
  isDisabled: true,
}

export const SiblingCountEquals2 = Template.bind({})
SiblingCountEquals2.args = {
  currentPage: 31,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 2,
}

export const Exactly7Pages = Template.bind({})
Exactly7Pages.args = {
  currentPage: 1,
  totalCount: 70,
  pageSize: 10,
  siblingCount: 1,
}

export const Exactly8Pages = Template.bind({})
Exactly8Pages.args = {
  currentPage: 1,
  totalCount: 80,
  pageSize: 10,
  siblingCount: 1,
}

export const LessThan7Pages = Template.bind({})
LessThan7Pages.args = {
  currentPage: 1,
  totalCount: 60,
  pageSize: 10,
  siblingCount: 1,
}

export const StartOf100Pages = Template.bind({})
StartOf100Pages.args = {
  currentPage: 1,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 1,
}

export const EndOf100Pages = Template.bind({})
EndOf100Pages.args = {
  currentPage: 100,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 1,
}

export const MiddleOf100Pages = Template.bind({})
MiddleOf100Pages.args = {
  currentPage: 31,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 1,
}

export const Mobile = Template.bind({})
Mobile.args = {
  currentPage: 31,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 1,
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileDisabled = Template.bind({})
MobileDisabled.args = {
  currentPage: 31,
  totalCount: 1000,
  pageSize: 10,
  siblingCount: 1,
  isDisabled: true,
}
MobileDisabled.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
