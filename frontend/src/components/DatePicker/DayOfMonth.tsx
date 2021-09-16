import { Box } from '@chakra-ui/react'

export interface DayOfMonthProps {
  selected?: boolean
  unavailable?: boolean
  today?: boolean
  isInRange?: boolean
  children?: React.ReactNode
}

export const DayOfMonth = ({ children }: DayOfMonthProps): JSX.Element => {
  return (
    <Box as="button" display="inline-block">
      {children}
    </Box>
  )
}
