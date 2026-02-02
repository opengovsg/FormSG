import { useMemo } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { formatDistanceToNow } from 'date-fns'

interface HeroStatsProps {
  responseCount: number
  filteredCount?: number
  dateRange: [string | null, string | null]
  lastResponseTime?: string
}

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
}

const StatCard = ({ label, value, subValue }: StatCardProps) => (
  <Box
    bg="white"
    borderRadius="md"
    border="1px solid"
    borderColor="neutral.200"
    p={3}
    flex="1"
    minW="120px"
    transition="all 0.2s"
    _hover={{ boxShadow: 'sm', borderColor: 'neutral.300' }}
  >
    <Text fontSize="xs" color="secondary.500" fontWeight="medium" mb={1}>
      {label}
    </Text>
    <Text fontSize="xl" fontWeight="semibold" color="secondary.800" lineHeight="1.2">
      {value}
    </Text>
    {subValue && (
      <Text fontSize="xs" color="secondary.400" mt={1}>
        {subValue}
      </Text>
    )}
  </Box>
)

export const HeroStats = ({
  responseCount,
  filteredCount,
  dateRange,
  lastResponseTime,
}: HeroStatsProps) => {
  const dateRangeText = useMemo(() => {
    const [start, end] = dateRange
    if (!start && !end) return 'All time'
    if (start && end) {
      return `${new Date(start).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })} - ${new Date(end).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}`
    }
    if (start) return `From ${new Date(start).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}`
    if (end) return `Until ${new Date(end).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}`
    return 'All time'
  }, [dateRange])

  const lastResponseText = useMemo(() => {
    if (!lastResponseTime) return null
    try {
      return formatDistanceToNow(new Date(lastResponseTime), { addSuffix: true })
    } catch {
      return null
    }
  }, [lastResponseTime])

  const showFilteredCount =
    filteredCount !== undefined && filteredCount !== responseCount

  return (
    <Flex gap={3} flexWrap="wrap">
      {/* Responses Card */}
      <StatCard
        label="Responses"
        value={showFilteredCount ? filteredCount : responseCount}
        subValue={showFilteredCount ? `of ${responseCount} total` : undefined}
      />

      {/* Date Range Card */}
      <StatCard
        label="Date range"
        value={dateRangeText}
      />

      {/* Last Response Card */}
      {lastResponseText && (
        <StatCard
          label="Last response"
          value={lastResponseText}
        />
      )}
    </Flex>
  )
}
