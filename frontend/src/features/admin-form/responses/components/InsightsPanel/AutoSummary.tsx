import { useMemo } from 'react'
import { Box, HStack, keyframes, Skeleton, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react'

import Button from '~components/Button'

// Blinking cursor animation for streaming
const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`

interface AutoSummaryProps {
  summary: string | null
  keyFindings: string[]
  suggestedQuestions: string[]
  isLoading: boolean
  isAsking?: boolean // True when a question is being processed
  isStreaming?: boolean // True when summary is being streamed
  streamingSummary?: string // Partial summary text during streaming
  onQuestionClick?: (question: string) => void
}

/**
 * AutoSummary component - displays AI-generated summary when Analyse is clicked
 * Shows summary, key findings bullets, and suggested follow-up questions
 * Supports streaming display of summary text
 */
export const AutoSummary = ({
  summary,
  keyFindings,
  suggestedQuestions,
  isLoading,
  isAsking = false,
  isStreaming = false,
  streamingSummary,
  onQuestionClick,
}: AutoSummaryProps) => {
  // Filter out empty or placeholder findings
  const validFindings = useMemo(
    () => keyFindings.filter((f) => f && f !== 'No data available'),
    [keyFindings],
  )

  // Show streaming state - display cursor with text as it arrives
  // No skeleton - just the blinking cursor indicates loading
  if (isStreaming) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="neutral.200"
        borderLeft="3px solid"
        borderLeftColor="purple.400"
        p={3}
      >
        <Text fontSize="sm" color="secondary.700">
          {streamingSummary || ''}
          <Box
            as="span"
            display="inline-block"
            w="2px"
            h="1em"
            bg="primary.500"
            ml={1}
            verticalAlign="text-bottom"
            animation={`${blink} 1s step-end infinite`}
          />
        </Text>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="neutral.200"
        borderLeft="3px solid"
        borderLeftColor="purple.400"
        p={3}
      >
        <Skeleton height="1rem" width="30%" mb={3} />
        <Skeleton height="3rem" mb={4} />
        <VStack align="stretch" spacing={2}>
          <Skeleton height="1rem" width="80%" />
          <Skeleton height="1rem" width="70%" />
          <Skeleton height="1rem" width="75%" />
        </VStack>
      </Box>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="neutral.200"
      borderLeft="3px solid"
      borderLeftColor="purple.400"
      p={3}
      transition="all 0.2s"
      _hover={{ boxShadow: 'sm', borderColor: 'neutral.300' }}
    >
      {/* Summary */}
      <Text fontSize="sm" color="secondary.700" mb={3}>
        {summary}
      </Text>

      {/* Key Findings */}
      {validFindings.length > 0 && (
        <Box mb={4}>
          <Text fontSize="xs" fontWeight="medium" color="secondary.500" mb={2}>
            Key findings
          </Text>
          <VStack align="stretch" spacing={1} pl={2}>
            {validFindings.map((finding, index) => (
              <HStack key={index} align="flex-start" spacing={2}>
                <Text fontSize="sm" color="secondary.400" lineHeight="tall">
                  •
                </Text>
                <Text fontSize="sm" color="secondary.700" lineHeight="tall">
                  {finding}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && onQuestionClick && (
        <Box>
          <Text fontSize="xs" fontWeight="medium" color="secondary.500" mb={2}>
            Explore further
          </Text>
          <Wrap spacing={2}>
            {suggestedQuestions.map((question, index) => (
              <WrapItem key={index}>
                <Button
                  variant="outline"
                  size="xs"
                  colorScheme="secondary"
                  onClick={() => onQuestionClick(question)}
                  fontWeight="normal"
                  isDisabled={isAsking}
                  opacity={isAsking ? 0.6 : 1}
                >
                  {question}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
    </Box>
  )
}
