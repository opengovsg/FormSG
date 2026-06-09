import { Box, Flex } from '@chakra-ui/react'

export type WizardStep =
  | 'name'
  | 'origin'
  | 'secretKey'
  | 'storageName'
  | 'storageOrigin'

const STEP_ORDER: WizardStep[] = ['name', 'origin', 'secretKey']

const STORAGE_STEP_ORDER: WizardStep[] = [
  'name',
  'storageName',
  'storageOrigin',
  'secretKey',
]

interface ProgressBarProps {
  currentStep: WizardStep
}

const ProgressBar = ({ currentStep }: ProgressBarProps): JSX.Element => {
  const isStoragePath =
    currentStep === 'storageName' || currentStep === 'storageOrigin'
  const order = isStoragePath ? STORAGE_STEP_ORDER : STEP_ORDER
  const currentIndex = order.indexOf(currentStep)
  const progress = ((currentIndex + 1) / order.length) * 100

  return (
    <Box w="100%" mb="2rem">
      <Box
        h="4px"
        w="100%"
        bg="neutral.300"
        borderRadius="full"
        overflow="hidden"
      >
        <Box
          h="100%"
          w={`${progress}%`}
          bg="primary.500"
          borderRadius="full"
          transition="width 0.3s ease"
        />
      </Box>
    </Box>
  )
}

interface SplitScreenLayoutProps {
  currentStep: WizardStep
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export const SplitScreenLayout = ({
  currentStep,
  leftPanel,
  rightPanel,
}: SplitScreenLayoutProps): JSX.Element => {
  return (
    <Flex h="100vh" w="100vw">
      {/* Left panel */}
      <Flex
        direction="column"
        w="50%"
        bg="white"
        px="3rem"
        py="2rem"
        overflow="auto"
        borderRight="1px solid"
        borderColor="neutral.300"
      >
        <ProgressBar currentStep={currentStep} />
        <Box flex={1}>{leftPanel}</Box>
      </Flex>

      {/* Right panel */}
      <Flex
        w="50%"
        bg="primary.100"
        align="center"
        justify="center"
        overflow="auto"
      >
        {rightPanel}
      </Flex>
    </Flex>
  )
}
