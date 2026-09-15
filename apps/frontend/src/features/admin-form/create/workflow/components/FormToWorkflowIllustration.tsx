import {
  Box,
  Flex,
  Image,
  Stack,
  Text,
  usePrefersReducedMotion,
} from '@chakra-ui/react'

import formSgLogo from '~/assets/svgs/brand/brand-mark-colour.svg'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'

const ILLUSTRATED_FORM_TITLE = 'My form'

const ILLUSTRATED_STEP_COUNT = 3

const CROSSFADE_MS = 500

const SkeletonLine = ({ w, h = '0.5rem' }: { w: string; h?: string }) => (
  <Box bg="secondary.200" borderRadius="3px" w={w} h={h} flexShrink={0} />
)

const SkeletonField = ({ labelWidth }: { labelWidth: string }) => (
  <Stack spacing="0.5rem">
    <SkeletonLine w={labelWidth} />
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="4px"
      h="2.25rem"
    />
  </Stack>
)

const FormCard = (): JSX.Element => (
  <Stack spacing={0} w="100%">
    <Flex
      justify="center"
      align="center"
      py="1rem"
      bg="white"
      borderTopRadius="8px"
      borderX="1px solid"
      borderTop="1px solid"
      borderColor="neutral.300"
    >
      <Image src={formSgLogo} alt="FormSG" w="2.5rem" h="2.5rem" />
    </Flex>

    <Flex
      bg="primary.500"
      justify="center"
      align="center"
      py="1.5rem"
      px="1.5rem"
      borderX="1px solid"
      borderColor="primary.500"
    >
      <Text textStyle="subhead-1" color="white" noOfLines={1}>
        {ILLUSTRATED_FORM_TITLE}
      </Text>
    </Flex>

    <Box
      bg="primary.100"
      px="1.25rem"
      py="1.25rem"
      borderX="1px solid"
      borderBottom="1px solid"
      borderColor="neutral.300"
      borderBottomRadius="8px"
      position="relative"
    >
      <Box bg="white" borderRadius="4px" px="1.25rem" py="1.25rem">
        <Stack spacing="1.25rem">
          <SkeletonField labelWidth="25%" />
          <SkeletonField labelWidth="40%" />
          <SkeletonField labelWidth="20%" />
        </Stack>
      </Box>

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="3rem"
        bgGradient="linear(to-b, transparent, primary.100)"
        borderBottomRadius="8px"
      />
    </Box>
  </Stack>
)

const StepCard = ({
  stepNumber,
  isLit,
  isDimmed,
  opacity,
}: {
  stepNumber: number
  isLit?: boolean
  isDimmed?: boolean
  opacity?: number
}): JSX.Element => (
  <Box
    borderRadius="4px"
    border={isLit ? '2px solid' : '1px solid'}
    borderColor={isLit ? 'primary.500' : 'neutral.300'}
    bg={isLit ? 'primary.100' : 'white'}
    w="100%"
    px="1.25rem"
    py="1rem"
    opacity={isDimmed ? 0.5 : opacity}
    transition="opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease"
  >
    <Stack spacing="0.75rem">
      <Flex align="center" gap="0.75rem">
        <Text
          textStyle="caption-1"
          py="0.25rem"
          px="0.5rem"
          borderWidth="1px"
          borderColor="secondary.300"
          borderRadius="4px"
          bg="white"
          flexShrink={0}
        >
          {stepNumber}
        </Text>
        <Text textStyle="caption-1" color="secondary.500" noOfLines={1}>
          Step {stepNumber}
        </Text>
      </Flex>
      <Stack spacing="0.75rem" pl="2rem">
        <Stack spacing="0.25rem">
          <SkeletonLine w="30%" h="0.375rem" />
          <SkeletonLine w="55%" />
        </Stack>
        <Stack spacing="0.25rem">
          <SkeletonLine w="25%" h="0.375rem" />
          <SkeletonLine w="45%" />
        </Stack>
      </Stack>
    </Stack>
  </Box>
)

const StepConnector = ({ opacity }: { opacity?: number }): JSX.Element => (
  <Flex direction="column" align="center" my="0.25rem" opacity={opacity}>
    <Box w="2px" h="0.625rem" bg="secondary.200" />
    <Box as={BxsChevronDown} color="secondary.300" fontSize="0.75rem" />
    <Box w="2px" h="0.625rem" bg="secondary.200" />
  </Flex>
)

export interface FormToWorkflowIllustrationProps {
  showWorkflow?: boolean
  showSpotlight?: boolean
}

export const FormToWorkflowIllustration = ({
  showWorkflow = false,
  showSpotlight = false,
}: FormToWorkflowIllustrationProps): JSX.Element => {
  const prefersReducedMotion = usePrefersReducedMotion()

  const crossfade = prefersReducedMotion
    ? undefined
    : `opacity ${CROSSFADE_MS}ms ease, transform ${CROSSFADE_MS}ms ease`

  return (
    <Box w="100%" maxW="25rem" position="relative">
      <Box
        position={showWorkflow ? 'absolute' : 'relative'}
        inset={showWorkflow ? 0 : undefined}
        opacity={showWorkflow ? 0 : 1}
        transform={showWorkflow ? 'scale(0.97)' : 'scale(1)'}
        transition={crossfade}
        zIndex={showWorkflow ? 0 : 2}
        pointerEvents="none"
        aria-hidden={showWorkflow}
      >
        <FormCard />
      </Box>

      <Box
        position={showWorkflow ? 'relative' : 'absolute'}
        inset={showWorkflow ? undefined : 0}
        opacity={showWorkflow ? 1 : 0}
        transform={showWorkflow ? 'scale(1)' : 'scale(0.97)'}
        transition={crossfade}
        zIndex={showWorkflow ? 2 : 0}
        pointerEvents="none"
        aria-hidden={!showWorkflow}
      >
        {Array.from({ length: ILLUSTRATED_STEP_COUNT }, (_, index) => {
          const stepNumber = index + 1
          const isFirst = index === 0
          const isLast = index === ILLUSTRATED_STEP_COUNT - 1
          return (
            <Box key={stepNumber}>
              {isFirst ? null : <StepConnector opacity={isLast ? 0.5 : 1} />}
              <StepCard
                stepNumber={stepNumber}
                isLit={isFirst && showSpotlight}
                isDimmed={!isFirst && showSpotlight}
                opacity={isLast ? 0.5 : undefined}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
