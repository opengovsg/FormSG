import { ReactNode } from 'react'
import { BiX } from 'react-icons/bi'
import { Box, Flex, IconButton, Text } from '@chakra-ui/react'

import { HeroStats } from './HeroStats'

interface InsightsPanelProps {
  isOpen: boolean
  onClose: () => void
  responseCount: number
  filteredCount?: number
  dateRange: [string | null, string | null]
  lastResponseTime?: string
  children?: ReactNode
}

export const InsightsPanel = ({
  isOpen,
  onClose,
  responseCount,
  filteredCount,
  dateRange,
  lastResponseTime,
  children,
}: InsightsPanelProps) => {
  if (!isOpen) return null

  return (
    <Box
      w="380px"
      minW="380px"
      h="100%"
      bg="white"
      borderRight="1px solid"
      borderColor="neutral.300"
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      {/* Panel Header - matches table header styling */}
      <Flex
        justify="space-between"
        align="center"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="neutral.300"
        bg="neutral.100"
        flexShrink={0}
      >
        <Text fontSize="sm" fontWeight="semibold" color="secondary.700">
          Insights
        </Text>
        <IconButton
          aria-label="Close insights panel"
          icon={<BiX size={18} />}
          variant="clear"
          size="xs"
          color="secondary.500"
          _hover={{ color: 'secondary.700', bg: 'neutral.200' }}
          onClick={onClose}
        />
      </Flex>

      {/* Panel Content - Scrollable */}
      <Box
        flex={1}
        overflowY="auto"
        p={4}
        bg="neutral.50"
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#CBD5E0',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#A0AEC0',
          },
        }}
      >
        <HeroStats
          responseCount={responseCount}
          filteredCount={filteredCount}
          dateRange={dateRange}
          lastResponseTime={lastResponseTime}
        />

        {/* InterpretBox and other children */}
        {children}
      </Box>
    </Box>
  )
}
