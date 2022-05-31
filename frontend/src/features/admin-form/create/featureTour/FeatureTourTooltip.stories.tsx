import { useState } from 'react'
import { Meta, Story } from '@storybook/react'

import { fullScreenDecorator } from '~utils/storybook'
import { ButtonProps } from '~components/Button'

import { FEATURE_STEPS } from './constants'
import {
  FeatureTourStep,
  FeatureTourTooltip,
  FeatureTourTooltipProps,
} from './FeatureTourTooltip'

export default {
  title: 'Pages/FeatureTour/Tooltip',
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
  },
} as Meta

const Template: Story<FeatureTourTooltipProps> = (args) => {
  const [featureStep, setFeatureStep] = useState<number>(0)

  const handleNextClick = () => {
    setFeatureStep(featureStep + 1)
  }

  const getFeatureTourTooltipContent = (
    featureStep: number,
  ): FeatureTourStep => {
    return {
      title: FEATURE_STEPS[featureStep].title,
      content: FEATURE_STEPS[featureStep].content,
    }
  }

  const featureTourTooltipContent = getFeatureTourTooltipContent(featureStep)
  const isLastStep = featureStep === 2
  const mockPrimaryProps: ButtonProps = {
    onClick: handleNextClick,
  }

  return (
    <FeatureTourTooltip
      {...args}
      step={featureTourTooltipContent}
      primaryProps={mockPrimaryProps}
      isLastStep={isLastStep}
    />
  )
}

export const BasicUsage = Template.bind({})
BasicUsage.args = {}
