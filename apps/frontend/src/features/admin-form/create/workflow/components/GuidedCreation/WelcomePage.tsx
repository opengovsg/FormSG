import { useEffect, useRef } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { useGuidedWorkflowStore } from '../../guidedWorkflowStore'
import {
  FormToWorkflowIllustration,
  type FormToWorkflowIllustrationHandle,
} from '../FormToWorkflowIllustration'

export const WelcomePage = (): JSX.Element => {
  const startBuilding = useGuidedWorkflowStore((s) => s.startBuilding)
  const animHandle = useRef<FormToWorkflowIllustrationHandle>(null)

  // Auto-play the illustration on mount, ending in spotlight state
  useEffect(() => {
    const timer = setTimeout(() => {
      animHandle.current?.playForward()
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="8px"
      p={{ base: '1.5rem', md: '2.5rem' }}
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
              Split your form into steps
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              Each step goes to a different person, and they only fill in their
              part.
            </Text>
            <Text textStyle="body-1" color="secondary.400">
              Let&apos;s start with <strong>Step 1</strong>, which will be what
              everyone who opens your form link will fill in first.
            </Text>
          </Stack>
          <Box>
            <Button onClick={startBuilding}>Let's go</Button>
          </Box>
        </Stack>
      </Flex>
    </Box>
  )
}
