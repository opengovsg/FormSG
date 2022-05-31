import { BiBulb, BiRightArrowAlt } from 'react-icons/bi'
import { Box, BoxProps, CloseButton, Flex, Icon, Text } from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button from '~components/Button'

interface FeatureTourButtonProps {
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

interface FeatureTourStep {
  content: React.ReactNode
  title?: React.ReactNode
}

interface FeatureTourTooltipProps {
  step: FeatureTourStep
  tooltipProps: BoxProps
  primaryProps: FeatureTourButtonProps
  skipProps: FeatureTourButtonProps
  isLastStep: boolean
}

export const FeatureTourTooltip = ({
  step,
  tooltipProps,
  primaryProps,
  skipProps,
  isLastStep,
}: FeatureTourTooltipProps) => {
  return (
    <Box
      padding="1.5rem"
      alignItems="center"
      maxW="100%"
      w="18rem"
      color="secondary.500"
      bg="primary.100"
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
        {...skipProps}
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
      <Text textStyle="subhead-1" color="secondary.500" marginTop="1.25rem">
        {step.title}
      </Text>
      <Text textStyle="body-2" color="secondary.500" marginTop="0.5rem">
        {step.content}
      </Text>
      <Flex
        flexDirection="row"
        marginTop="2.5rem"
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Todo: Create pagination component */}
        <Text>Pagination Component</Text>
        {isLastStep ? (
          <Button {...skipProps}>Done</Button>
        ) : (
          <Button rightIcon={<BiRightArrowAlt />} {...primaryProps}>
            Next
          </Button>
        )}
      </Flex>
    </Box>
  )
}
