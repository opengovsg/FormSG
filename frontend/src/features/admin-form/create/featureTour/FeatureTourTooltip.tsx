import { BiBulb, BiRightArrowAlt } from 'react-icons/bi'
import { Box, BoxProps, CloseButton, Flex, Icon, Text } from '@chakra-ui/react'
import { Badge, Button, ButtonProps } from '@opengovsg/design-system-react'

import { ProgressIndicator } from '~components/ProgressIndicator'

import { FEATURE_STEPS } from './constants'
import { useFeatureTourContext } from './FeatureTourContext'

export interface FeatureTourStep {
  content: React.ReactNode
  title?: React.ReactNode
}

export interface FeatureTourTooltipProps {
  step: FeatureTourStep
  tooltipProps: BoxProps
  primaryProps: ButtonProps
  closeProps: ButtonProps
  isLastStep: boolean
  index: number
}

export const FeatureTourTooltip = ({
  step,
  tooltipProps,
  primaryProps,
  closeProps,
  isLastStep,
  index,
}: FeatureTourTooltipProps): JSX.Element => {
  const { paginationCallback } = useFeatureTourContext()
  return (
    <Box
      padding="1.5rem"
      alignItems="center"
      maxW="100%"
      w="18rem"
      color="brand.secondary.500"
      bg="brand.primary.50"
      borderRadius="4px"
      {...tooltipProps}
      position="relative"
    >
      <CloseButton
        variant="clear"
        colorScheme="neutral"
        position="absolute"
        right="1.25rem"
        top="1.25rem"
        {...closeProps}
      />
      <Badge
        colorScheme="success"
        variant="solid"
        display="flex"
        width="fit-content"
      >
        <Icon as={BiBulb} mr="0.25rem" fontSize="1rem" />
        <Text textStyle="caption-1">Tip</Text>
      </Badge>
      <Text
        textStyle="subhead-1"
        color="brand.secondary.500"
        marginTop="1.25rem"
      >
        {step.title}
      </Text>
      <Text textStyle="body-2" color="brand.secondary.500" marginTop="0.5rem">
        {step.content}
      </Text>
      <Flex
        flexDirection="row"
        marginTop="2.5rem"
        alignItems="center"
        justifyContent="space-between"
      >
        <ProgressIndicator
          numIndicators={FEATURE_STEPS.length}
          currActiveIdx={index}
          onClick={paginationCallback}
        />
        {isLastStep ? (
          <Button {...primaryProps} title="Done">
            Done
          </Button>
        ) : (
          <Button rightIcon={<BiRightArrowAlt />} {...primaryProps}>
            Next
          </Button>
        )}
      </Flex>
    </Box>
  )
}
