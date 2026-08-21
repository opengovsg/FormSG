import { Box, Text } from '@chakra-ui/react'

import { useWorkflowStack } from '../hooks/useWorkflowStack'
import { getWorkflowCardPose } from '../utils/workflowCardPose'

/**
 * The three steps of a routed response. Illustration copy, so it lives here
 * rather than in the i18n bundle — same call as the security document's field
 * labels.
 */
const STEPS: readonly { title: string; detail: string; stamp: string }[] = [
  {
    title: 'Staff claim #212',
    detail: 'Submitted by Wei Ming',
    stamp: 'STEP 1',
  },
  {
    title: 'Step 2 · Mdm Tan',
    detail: 'Reviewed in one click',
    stamp: 'STEP 2',
  },
  {
    title: 'Step 3 · Finance',
    detail: 'Confirmation emailed',
    stamp: 'STEP 3',
  },
]

/**
 * Approvals landing and getting stamped, in ink.
 *
 * Purely illustrative, so the whole thing is hidden from assistive technology:
 * the adjacent copy makes the same point in words, and announcing three
 * decorative cards that re-enter on a loop would be noise.
 */
export const WorkflowStack = (): JSX.Element => {
  const { ref, landedCount, stampedCount } = useWorkflowStack(STEPS.length)

  return (
    <Box
      ref={ref}
      aria-hidden
      position="relative"
      w="100%"
      h="15rem"
      /* The stack is absolutely positioned and overlaps itself, so it cannot
         size its own container. */
      maxW={{ base: '18.75rem', lg: 'none' }}
      mx="auto"
    >
      {STEPS.map((step, index) => {
        const pose = getWorkflowCardPose(index, index < landedCount)
        return (
          <Box
            key={step.stamp}
            position="absolute"
            left="50%"
            w={{ base: '16.25rem', lg: '20rem' }}
            maxW="100%"
            bg="white"
            border="1px solid"
            borderColor="landing.hairline"
            borderRadius="6px"
            padding="0.875rem 1.125rem"
            boxShadow="0 10px 24px rgba(38,58,112,0.10)"
            textAlign="left"
            transform={pose.transform}
            opacity={pose.opacity}
            transition="transform 0.8s var(--lv5-settle), opacity 0.5s"
          >
            <Text as="h6" fontSize="0.8125rem" fontWeight={600} mb="0.25rem">
              {step.title}
            </Text>
            <Text as="small" fontSize="0.71875rem" color="landing.muted">
              {step.detail}
            </Text>
            {/* Same mono, weight, tracking, border and tilt as the security
                document's underside stamp, so both read as the same rubber
                stamp; only the ink changes. */}
            <Text
              as="span"
              className={index < stampedCount ? 'lv5-stamp-in' : undefined}
              position="absolute"
              top="0.625rem"
              right="0.75rem"
              fontFamily="var(--lv5-mono)"
              fontSize="0.65625rem"
              fontWeight={600}
              letterSpacing="0.14em"
              color="landing.blueDeep"
              border="2px solid"
              borderColor="landing.blueDeep"
              borderRadius="4px"
              padding="0.125rem 0.4375rem"
              /* Resting state is stamped-but-invisible; the class animates it
                 in. Kept here so an unstamped card has no stamp visible even
                 before the animation has ever run. */
              transform="rotate(-8deg) scale(0)"
              opacity={0}
            >
              {step.stamp}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
