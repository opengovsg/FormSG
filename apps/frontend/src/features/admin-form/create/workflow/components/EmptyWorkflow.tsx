import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex, HStack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import {
  setToCreatingSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { useGuidedWorkflowStore } from '../guidedWorkflowStore'
import {
  useGuidedSetupAudience,
  useMarkGuidedSetupTaught,
} from '../utils/useGuidedSetupAudience'

import {
  FormToWorkflowIllustration,
  type FormToWorkflowIllustrationHandle,
} from './FormToWorkflowIllustration'

/**
 * The workflow tab's empty state, and the first place most admins meet the
 * concept.
 *
 * The screen itself is the same for everyone. What differs is where its call to
 * action leads, and whether the admin is offered a choice at all.
 */
export const EmptyWorkflow = (): JSX.Element => {
  const startGuided = useGuidedWorkflowStore((state) => state.startGuided)
  const setToCreating = useAdminWorkflowStore(setToCreatingSelector)
  const { audience } = useGuidedSetupAudience()
  const markTaught = useMarkGuidedSetupTaught()

  // Only the pre-existing cohort is asked. A new admin gets guidance without
  // choosing it, and a taught admin gets to work in one click.
  const showFork = audience === 'pre-existing'

  // Choosing guided setup from the fork counts as being taught, so the fork
  // retires on its own: offered once per admin in the seeded cohort, and never
  // to anyone who joins afterwards.
  //
  // They still get the welcome card. Asking for guidance and then being dropped
  // straight into a form field is the jolt the card exists to soften.
  const handleGuided = useCallback(() => {
    markTaught()
    startGuided()
  }, [markTaught, startGuided])

  // Picking manual is a decision, so the fork does not return on the next form.
  const handleManual = useCallback(() => {
    markTaught()
    setToCreating()
  }, [markTaught, setToCreating])

  // A taught admin still sees this screen. They skip the welcome card and are
  // never dropped straight into an unsaved step editor by opening the tab.
  const handleCreateWorkflow = useCallback(() => {
    if (audience === 'taught') {
      setToCreating()
      return
    }
    startGuided()
  }, [audience, setToCreating, startGuided])

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
          {showFork ? (
            <>
              <Button
                onClick={handleGuided}
                onMouseEnter={() => setIsGuidedHover(true)}
                onMouseLeave={() => setIsGuidedHover(false)}
              >
                Start with guided setup
              </Button>
              <Button variant="outline" onClick={handleManual}>
                Set up manually
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCreateWorkflow}
              onMouseEnter={() => setIsGuidedHover(true)}
              onMouseLeave={() => setIsGuidedHover(false)}
            >
              Create workflow
            </Button>
          )}
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
