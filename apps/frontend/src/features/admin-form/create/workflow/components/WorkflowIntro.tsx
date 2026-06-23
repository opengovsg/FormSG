import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex, HStack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import {
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { useGuidedWorkflowStore } from '../guidedWorkflowStore'

import {
  FormToWorkflowIllustration,
  type FormToWorkflowIllustrationHandle,
} from './FormToWorkflowIllustration'

export const WorkflowIntro = (): JSX.Element => {
  const startGuided = useGuidedWorkflowStore((state) => state.startGuided)
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)

  const animHandle = useRef<FormToWorkflowIllustrationHandle>(null)
  const autoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const isHoveringRef = useRef(false)
  const [isGuidedHover, setIsGuidedHover] = useState(false)

  // Auto-play on mount: forward after 1.2s, reverse after 5.2s
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (!isHoveringRef.current) animHandle.current?.playForward()
    }, 1200)

    const t2 = setTimeout(() => {
      if (!isHoveringRef.current) animHandle.current?.playReverse()
    }, 3500)

    autoTimersRef.current = [t1, t2]

    return () => {
      autoTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true
    animHandle.current?.playForward()
  }, [])

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false
    animHandle.current?.playReverse()
  }, [])

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      {/* Header zone */}
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cursor="default"
        mb="2.5rem"
      >
        <Text textStyle="h2" as="h2">
          Workflows split your form into steps
        </Text>
        <Text textStyle="body-1" mt="1rem" mb="1.5rem">
          Send each step to a different person. Each person only fills in their
          own part.
        </Text>
        <HStack spacing="0.75rem" justify="center">
          <Button
            onClick={startGuided}
            onMouseEnter={() => setIsGuidedHover(true)}
            onMouseLeave={() => setIsGuidedHover(false)}
          >
            Start with guided setup
          </Button>
          <Button variant="outline" onClick={setToCreating}>
            Set up manually
          </Button>
        </HStack>
      </Box>

      {/* Lottie illustration */}
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        w="100%"
        display="flex"
        justifyContent="center"
      >
        <FormToWorkflowIllustration
          handleRef={animHandle}
          showSpotlight={isGuidedHover}
        />
      </Box>
    </Flex>
  )
}
