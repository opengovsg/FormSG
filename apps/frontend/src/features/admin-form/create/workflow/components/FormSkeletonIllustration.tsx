import { BiDownArrowAlt } from 'react-icons/bi'
import { Box, Center, Flex, Text } from '@chakra-ui/react'

interface FormSkeletonIllustrationProps {
  isTorn: boolean
}

const SkeletonBar = ({
  width = '100%',
  height = '32px',
  bg = 'neutral.200',
  ...props
}: {
  width?: string
  height?: string
  bg?: string
  [key: string]: unknown
}) => (
  <Box
    w={width}
    h={height}
    bg={bg}
    borderRadius="4px"
    border="1px solid"
    borderColor="neutral.300"
    {...props}
  />
)

const SkeletonLabel = ({ width = '30%' }: { width?: string }) => (
  <Box w={width} h="10px" bg="neutral.300" borderRadius="3px" mb="0.5rem" />
)

const StepHeader = ({ step, isTorn }: { step: number; isTorn: boolean }) => (
  <Flex
    align="center"
    gap="0.5rem"
    mb={isTorn ? '0.875rem' : '0'}
    opacity={isTorn ? 1 : 0}
    h={isTorn ? '22px' : '0'}
    overflow="hidden"
    transition="all 300ms ease-in-out"
  >
    <Center
      w="22px"
      h="22px"
      borderRadius="full"
      bg="primary.500"
      color="white"
      fontSize="0.6rem"
      fontWeight="700"
      flexShrink={0}
    >
      {step}
    </Center>
    <Text fontSize="0.75rem" fontWeight="600" color="secondary.500">
      Step {step}
    </Text>
  </Flex>
)

const SplitGap = ({ isTorn }: { isTorn: boolean }) => (
  <Center
    h={isTorn ? '40px' : '0'}
    transition="height 300ms ease-in-out"
    overflow="visible"
  >
    <Box
      as={BiDownArrowAlt}
      color="neutral.400"
      fontSize="1.25rem"
      opacity={isTorn ? 1 : 0}
      transition="opacity 200ms ease-in-out"
    />
  </Center>
)

export const FormSkeletonIllustration = ({
  isTorn,
}: FormSkeletonIllustrationProps): JSX.Element => {
  const sectionStyles = {
    bg: 'white',
    p: '1.25rem 1.5rem',
    border: isTorn ? '2px solid' : 'none',
    borderColor: isTorn ? 'primary.500' : 'transparent',
    borderRadius: isTorn ? '12px' : '0',
    transition: 'all 300ms ease-in-out',
  }

  return (
    <Box w="100%" maxW="520px">
      {/* Banner */}
      <Box
        bg="primary.500"
        p="1.5rem 2rem"
        borderRadius={isTorn ? '12px' : '12px 12px 0 0'}
        border="1px solid"
        borderColor="primary.500"
        display="flex"
        justifyContent="center"
        transition="border-radius 300ms ease-in-out"
      >
        <Box h="14px" w="55%" bg="whiteAlpha.500" borderRadius="3px" />
      </Box>

      {/* Banner gap */}
      <Box h={isTorn ? '20px' : '0'} transition="height 300ms ease-in-out" />

      {/* Sections wrapper: gives the untorn state a visible card border */}
      <Box
        border={isTorn ? 'none' : '1px solid'}
        borderTop="none"
        borderColor="neutral.300"
        borderRadius={isTorn ? '0' : '0 0 12px 12px'}
        transition="all 300ms ease-in-out"
        overflow={isTorn ? 'visible' : 'hidden'}
      >
        {/* Section 1: 2 fields */}
        <Box {...sectionStyles}>
          <StepHeader step={1} isTorn={isTorn} />
          <Box mb="1rem">
            <SkeletonLabel width="30%" />
            <SkeletonBar />
          </Box>
          <Box>
            <SkeletonLabel width="40%" />
            <SkeletonBar width="60%" />
          </Box>
        </Box>

        <SplitGap isTorn={isTorn} />

        {/* Section 2: 3 fields */}
        <Box {...sectionStyles}>
          <StepHeader step={2} isTorn={isTorn} />
          <Box mb="1rem">
            <SkeletonLabel width="25%" />
            <SkeletonBar width="80%" />
          </Box>
          <Box mb="1rem">
            <SkeletonLabel width="35%" />
            <SkeletonBar width="60%" />
          </Box>
          <Box>
            <SkeletonLabel width="30%" />
            <SkeletonBar width="60%" />
          </Box>
        </Box>

        <SplitGap isTorn={isTorn} />

        {/* Section 3: 1 field */}
        <Box {...sectionStyles}>
          <StepHeader step={3} isTorn={isTorn} />
          <Box>
            <SkeletonLabel width="35%" />
            <SkeletonBar />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
