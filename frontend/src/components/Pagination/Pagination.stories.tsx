import { useEffect, useState } from 'react'
import { Meta, Story } from '@storybook/react'

import { Pagination, PaginationProps } from './Pagination'

export default {
  title: 'Components/Pagination',
  component: Pagination,
  decorators: [],
} as Meta

const Template: Story<PaginationProps> = (args) => {
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
  siblingCount: 1,
}
