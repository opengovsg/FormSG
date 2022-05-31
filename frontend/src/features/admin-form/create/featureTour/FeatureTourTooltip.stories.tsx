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
  const [featureStep, setFeatureStep] = useState<number>(args.stepIndex ?? 0)

  const handleNextClick = () => {
    featureStep === FEATURE_STEPS.length - 1
      ? setFeatureStep(featureStep)
      : setFeatureStep(featureStep + 1)
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
  const isLastStep = args.isLastStep ?? featureStep === FEATURE_STEPS.length - 1
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

export const LastFeatureStep = Template.bind({})
LastFeatureStep.args = {
  stepIndex: FEATURE_STEPS.length - 1,
  isLastStep: true,
}
