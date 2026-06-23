import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex, keyframes, Stack, Text } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'

// --- Keyframes ---

const peelUp = keyframes`
  0% { transform: translateY(30px); opacity: 0; }
  60% { transform: translateY(-4px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
`

const peelDown = keyframes`
  0% { transform: translateY(-30px); opacity: 0; }
  60% { transform: translateY(4px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

// --- Skeleton helpers ---

const SkeletonLine = ({
  w = '100%',
  h = '0.5rem',
}: {
  w?: string
  h?: string
}) => <Box bg="secondary.200" borderRadius="3px" w={w} h={h} flexShrink={0} />

const SkeletonField = ({ labelW = '30%' }: { labelW?: string }) => (
  <Stack spacing="0.5rem">
    <SkeletonLine w={labelW} h="0.5rem" />
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="6px"
      h="2.25rem"
    />
  </Stack>
)

// --- Form illustration (matches real FormSG public form layout) ---

const FormCard = ({ title }: { title: string }) => (
  <Stack spacing={0} w="100%">
    {/* Agency logo area (above banner) */}
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
      <Box bg="secondary.200" borderRadius="6px" w="2.5rem" h="2.5rem" />
    </Flex>

    {/* Blue banner with centered title */}
    <Flex
      bg="primary.500"
      justify="center"
      align="center"
      direction="column"
      py="1.5rem"
      px="1.5rem"
      borderX="1px solid"
      borderColor="primary.500"
    >
      <Text
        color="white"
        fontWeight="400"
        fontSize="1.1rem"
        textAlign="center"
        noOfLines={1}
      >
        {title}
      </Text>
    </Flex>

    {/* Fields section */}
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
      <Box bg="white" borderRadius="8px" px="1.25rem" py="1.25rem">
        <Stack spacing="1.25rem">
          <SkeletonField labelW="25%" />
          <SkeletonField labelW="40%" />
          <SkeletonField labelW="20%" />
        </Stack>
      </Box>

      {/* Fade-out gradient at bottom */}
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

// --- Step card illustration ---

const StepCard = ({
  stepNumber,
  opacity,
  isSpotlit,
  isDimmed,
}: {
  stepNumber: number
  opacity?: number
  isSpotlit?: boolean
  isDimmed?: boolean
}) => (
  <Box
    borderRadius="8px"
    border={isSpotlit ? '2px solid' : '1px solid'}
    borderColor={isSpotlit ? 'primary.500' : 'neutral.300'}
    bg={isSpotlit ? 'primary.100' : 'white'}
    w="100%"
    px="1.25rem"
    py="1rem"
    opacity={isDimmed ? 0.5 : opacity}
    transition="opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease"
  >
    <Stack spacing="0.75rem">
      {/* Step badge + label */}
      <Flex align="center" gap="0.75rem">
        <Text
          fontSize="0.75rem"
          fontWeight="600"
          py="0.375rem"
          px="0.625rem"
          borderWidth="1px"
          borderColor="secondary.300"
          borderRadius="8px"
          bg="white"
          lineHeight="1.2"
          flexShrink={0}
        >
          {stepNumber}
        </Text>
        <Text
          fontWeight="500"
          fontSize="0.8rem"
          color="secondary.500"
          noOfLines={1}
        >
          Step {stepNumber}
        </Text>
      </Flex>

      {/* Skeleton content */}
      <Stack spacing="0.75rem" pl="2.25rem">
        <Stack spacing="0.25rem">
          <SkeletonLine w="30%" h="0.4rem" />
          <SkeletonLine w="55%" />
        </Stack>
        <Stack spacing="0.25rem">
          <SkeletonLine w="25%" h="0.4rem" />
          <SkeletonLine w="45%" />
        </Stack>
      </Stack>
    </Stack>
  </Box>
)

// --- Connector ---

const StepConnector = ({ opacity }: { opacity?: number }) => (
  <Flex direction="column" align="center" my="0.25rem" opacity={opacity}>
    <Box w="2px" h="0.625rem" bg="secondary.200" />
    <Text fontSize="0.55rem" color="secondary.300" lineHeight="1">
      ▼
    </Text>
    <Box w="2px" h="0.625rem" bg="secondary.200" />
  </Flex>
)

// --- Main component ---

export interface FormToWorkflowIllustrationHandle {
  playForward: () => void
  playReverse: () => void
}

interface FormToWorkflowIllustrationProps {
  handleRef: React.Ref<FormToWorkflowIllustrationHandle>
  showSpotlight?: boolean
}

export const FormToWorkflowIllustration = ({
  handleRef,
  showSpotlight = false,
}: FormToWorkflowIllustrationProps): JSX.Element => {
  const { data: form } = useAdminForm()
  // Two-phase: 'form' and 'workflow'. Transition is driven by CSS only.
  const [showWorkflow, setShowWorkflow] = useState(false)

  const formTitle = form?.title ?? 'Your Form'

  const playForward = useCallback(() => {
    setShowWorkflow(true)
  }, [])

  const playReverse = useCallback(() => {
    setShowWorkflow(false)
  }, [])

  // Expose imperative handle
  useEffect(() => {
    if (!handleRef) return
    const handle = { playForward, playReverse }
    if (typeof handleRef === 'function') {
      handleRef(handle)
    } else if (handleRef && 'current' in handleRef) {
      ;(
        handleRef as React.MutableRefObject<FormToWorkflowIllustrationHandle | null>
      ).current = handle
    }
  }, [handleRef, playForward, playReverse])

  return (
    <Box w="100%" maxW="400px" position="relative">
      {/* Form layer */}
      <Box
        position={showWorkflow ? 'absolute' : 'relative'}
        inset={showWorkflow ? 0 : undefined}
        opacity={showWorkflow ? 0 : 1}
        transform={showWorkflow ? 'scale(0.97)' : 'scale(1)'}
        transition="opacity 0.5s ease, transform 0.5s ease"
        zIndex={showWorkflow ? 0 : 2}
        pointerEvents={showWorkflow ? 'none' : 'auto'}
      >
        <FormCard title={formTitle} />
      </Box>

      {/* Workflow layer */}
      <Box
        position={showWorkflow ? 'relative' : 'absolute'}
        inset={showWorkflow ? undefined : 0}
        opacity={showWorkflow ? 1 : 0}
        transform={showWorkflow ? 'scale(1)' : 'scale(0.97)'}
        transition="opacity 0.5s ease, transform 0.5s ease"
        zIndex={showWorkflow ? 2 : 0}
        pointerEvents={showWorkflow ? 'auto' : 'none'}
      >
        {/* Step 1 */}
        <StepCard stepNumber={1} isSpotlit={showSpotlight} isDimmed={false} />

        <StepConnector />

        {/* Step 2 */}
        <StepCard stepNumber={2} isDimmed={showSpotlight} />

        <StepConnector opacity={0.5} />

        {/* Step 3 - faded, suggesting more steps */}
        <StepCard stepNumber={3} opacity={0.5} isDimmed={showSpotlight} />
      </Box>
    </Box>
  )
}
