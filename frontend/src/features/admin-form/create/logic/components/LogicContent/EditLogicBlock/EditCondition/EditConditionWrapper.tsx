import { Box, forwardRef } from '@chakra-ui/react'

export interface EditConditionWrapperProps {
  children: React.ReactNode
}

export const EditConditionWrapper = forwardRef<
  EditConditionWrapperProps,
  'div'
>(({ children }, ref) => {
  return (
    <Box
      ref={ref}
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="primary.500"
      boxShadow="0 0 0 1px var(--chakra-colors-primary-500)"
      transitionProperty="common"
      transitionDuration="normal"
    >
      {children}
    </Box>
  )
})
