import { useMemo, useState } from 'react'
import { Meta, StoryFn } from '@storybook/react'

import { fullScreenDecorator } from '~utils/storybook'
import { ButtonProps } from '~components/Button'

import { getFeatureSteps } from './constants'
import { FeatureTourContext } from './FeatureTourContext'
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

const Template: StoryFn<FeatureTourTooltipProps> = (args) => {
  const [featureStep, setFeatureStep] = useState<number>(args.index ?? 0)
  const featureSteps = useMemo(() => getFeatureSteps(), [])

  const handleNextClick = () => {
    featureStep === featureSteps.length - 1
      ? setFeatureStep(featureStep)
      : setFeatureStep(featureStep + 1)
  }

  const getFeatureTourTooltipContent = (
    featureStep: number,
  ): FeatureTourStep => {
    return {
      title: featureSteps[featureStep].title,
      content: featureSteps[featureStep].content,
    }
  }

  const featureTourTooltipContent = getFeatureTourTooltipContent(featureStep)
  const isLastStep = args.isLastStep ?? featureStep === featureSteps.length - 1
  const mockPrimaryProps: ButtonProps = {
    onClick: handleNextClick,
  }
  const paginationCallback = (indicatorIdx: number) => {
    setFeatureStep(indicatorIdx)
  }

  return (
    <FeatureTourContext.Provider
      value={{ paginationCallback: paginationCallback }}
    >
      <FeatureTourTooltip
        {...args}
        step={featureTourTooltipContent}
        primaryProps={mockPrimaryProps}
        isLastStep={isLastStep}
        index={featureStep}
      />
    </FeatureTourContext.Provider>
  )
}

export const BasicUsage = Template.bind({})

export const LastFeatureStep = Template.bind({})
LastFeatureStep.args = {
  index: getFeatureSteps().length - 1,
  isLastStep: true,
}
