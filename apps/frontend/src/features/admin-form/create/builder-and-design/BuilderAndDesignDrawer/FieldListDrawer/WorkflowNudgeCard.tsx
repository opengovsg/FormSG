import { useCallback } from 'react'
import { BiX } from 'react-icons/bi'
import { Box, Flex, IconButton, Text } from '@chakra-ui/react'

interface WorkflowNudgeCardProps {
  onDismiss: () => void
  onClick: () => void
}

export const WorkflowNudgeCard = ({
  onDismiss,
  onClick,
}: WorkflowNudgeCardProps): JSX.Element => {
  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDismiss()
    },
    [onDismiss],
  )

  return (
    <Box
      mb="0.75rem"
      px="0.75rem"
      py="0.75rem"
      borderRadius="8px"
      border="1px solid"
      borderColor="primary.300"
      bg="primary.100"
      cursor="pointer"
      _hover={{ borderColor: 'primary.500' }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text textStyle="subhead-2" color="secondary.500">
            Set up a workflow for this form
          </Text>
          <Text textStyle="caption-1" color="secondary.400" mt="0.25rem">
            Assign steps to different respondents for approvals and sign-offs
          </Text>
        </Box>
        <IconButton
          aria-label="Dismiss workflow suggestion"
          icon={<BiX fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="xs"
          onClick={handleDismiss}
          _focusVisible={{ boxShadow: 'none' }}
        />
      </Flex>
    </Box>
  )
}
