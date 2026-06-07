import { Box } from '@chakra-ui/react'

import type { Phase } from '../types'
import { PHASE_ORDER } from '../types'

type PhaseProgressBarProps = {
  phase: Phase
}

export const PhaseProgressBar = ({
  phase,
}: PhaseProgressBarProps): JSX.Element => {
  const phaseIndex = PHASE_ORDER.indexOf(phase)
  const fillPercent = ((phaseIndex + 1) / PHASE_ORDER.length) * 100

  return (
    <Box px="1.5rem" pt="0.75rem" pb="0.5rem">
      <Box h="4px" bg="neutral.200" borderRadius="2px" overflow="hidden">
        <Box
          h="100%"
          w={`${fillPercent}%`}
          bg="primary.500"
          borderRadius="2px"
          transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
        />
      </Box>
    </Box>
  )
}
