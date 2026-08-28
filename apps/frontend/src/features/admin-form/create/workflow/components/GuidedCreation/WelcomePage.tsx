import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Flex,
  Stack,
  Text,
  usePrefersReducedMotion,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'
import {
  FormToWorkflowIllustration,
  type FormToWorkflowIllustrationHandle,
} from '../FormToWorkflowIllustration'

/** Milliseconds the card takes to clear before Step 1 takes its place. */
const LEAVE_DURATION_MS = 150

/**
 * Orients an admin into the workflow model, so they reach Step 1 already
 * knowing it is what the first person to open their form link will fill in.
 *
 * The middle of three beats. The empty state explains what a workflow is, this
 * card connects that to Step 1, and the guided flow asks for input. The concept
 * explanation stays upstream on the empty state, so the copy here is scoped to
 * the handover.
 *
 * It asks for nothing. One action, no exit.
 */
export const WelcomePage = (): JSX.Element => {
  const startBuilding = useGuidedWorkflowStore((s) => s.startBuilding)
  const animHandle = useRef<FormToWorkflowIllustrationHandle>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isLeaving, setIsLeaving] = useState(false)

  // Play the illustration once on mount, ending in the spotlight state. It does
  // not reverse, loop or respond to hover: the picture holds still on the step
  // the heading names. Hover reversal belongs to the empty state, where the
  // admin has a reason to look twice.
  useEffect(() => {
    const timer = setTimeout(() => {
      animHandle.current?.playForward()
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  // The card is a bridge, so the moment it gives way is the moment the model is
  // handed over. A hard swap drops the admin into a form field with no
  // continuity, so the card clears before Step 1 renders in its place.
  const handleStartBuilding = () => {
    if (prefersReducedMotion) {
      startBuilding()
      return
    }
    setIsLeaving(true)
    setTimeout(startBuilding, LEAVE_DURATION_MS)
  }

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="8px"
      p={{ base: '1.5rem', md: '2.5rem' }}
      opacity={isLeaving ? 0 : 1}
      transform={isLeaving ? 'translateY(-8px)' : 'translateY(0)'}
      transition={
        prefersReducedMotion
          ? undefined
          : `opacity ${LEAVE_DURATION_MS}ms ease-in, transform ${LEAVE_DURATION_MS}ms ease-in`
      }
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap={{ base: '2rem', md: '2.5rem' }}
        align="center"
      >
        {/* Illustration on the left */}
        <Box flexShrink={0} w={{ base: '100%', md: '280px' }}>
          <FormToWorkflowIllustration handleRef={animHandle} showSpotlight />
        </Box>

        {/* Text + CTA on the right */}
        <Stack spacing="1.5rem" flex={1}>
          <Stack spacing="0.75rem">
            <Text textStyle="h4" color="secondary.500">
              Let&apos;s start with Step 1
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              Step 1 is what everyone who opens your form link fills in first.
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              You&apos;ll name it, choose who fills it in, and pick which fields
              they see. Then you can add more steps.
            </Text>
          </Stack>
          {/*
            "Let's go" is the only action. The card carries no exit: it is an
            orientation beat rather than a decision, and Skip guidance is
            waiting in the card header on the very next screen.
          */}
          <Box>
            <Button onClick={handleStartBuilding}>Let&apos;s go</Button>
          </Box>
        </Stack>
      </Flex>
    </Box>
  )
}
