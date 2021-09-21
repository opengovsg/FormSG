import { Box } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { DatePicker } from './DatePicker'

export default {
  title: 'Components/DatePicker',
  component: DatePicker,
} as Meta

const Template: Story = () => {
  return (
    <Box maxW="50%">
      <DatePicker />
    </Box>
  )
}

export const Default = Template.bind({})
