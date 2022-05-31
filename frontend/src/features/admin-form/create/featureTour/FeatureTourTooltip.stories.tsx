import { BoxProps } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { fullScreenDecorator } from '~utils/storybook'

import { FEATURE_TOUR } from './constants'
import { FeatureTourTooltip } from './FeatureTourTooltip'

export default {
  title: 'Pages/FeatureTour/Tooltip',
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
  },
} as Meta

const mockStep = {
  content: `${FEATURE_TOUR[0].content}`,
  title: `${FEATURE_TOUR[0].title}`,
}

const mockButtonProps = {
  onClick: () => {
    return
  },
}

const Template: Story = () => {
  return (
    <FeatureTourTooltip
      step={mockStep}
      tooltipProps={{} as BoxProps}
      primaryProps={mockButtonProps}
      skipProps={mockButtonProps}
      isLastStep={false}
    />
  )
}

export const BasicUsage = Template.bind({})
