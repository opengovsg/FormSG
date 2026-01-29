import { useMemo } from 'react'
import { Box, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { BiTrendingDown, BiTrendingUp } from 'react-icons/bi'
import { FiClock } from 'react-icons/fi'

import { DecryptedResponse } from '../../ResponsesPage/storage/useDecryptedResponsesQuery'

interface TrendAlertsProps {
  decryptedResponses: DecryptedResponse[]
  minResponsesForTrend?: number // Minimum responses needed to detect trends
}

interface TrendInfo {
  type: 'increasing' | 'decreasing' | 'stable'
  percentage: number
  period: string
  description: string
}

interface PeakInfo {
  dayOfWeek: string
  hourRange: string
  percentage: number
}

/**
 * Analyzes submission timestamps to detect trends
 */
const analyzeTrends = (
  responses: DecryptedResponse[],
  minResponses: number,
): { trend: TrendInfo | null; peak: PeakInfo | null } => {
  if (responses.length < minResponses) {
    return { trend: null, peak: null }
  }

  // Parse timestamps and sort by date
  const timestamps = responses
    .map((r) => new Date(r.submissionTime))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  if (timestamps.length < minResponses) {
    return { trend: null, peak: null }
  }

  // Calculate date range
  const firstDate = timestamps[0]
  const lastDate = timestamps[timestamps.length - 1]
  const totalDays = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  // Need at least 7 days of data for meaningful trends
  if (totalDays < 7) {
    return { trend: null, peak: null }
  }

  // Analyze weekly trend (compare last week to previous week)
  const oneWeekAgo = new Date(lastDate)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(lastDate)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const lastWeekCount = timestamps.filter(
    (t) => t >= oneWeekAgo && t <= lastDate,
  ).length
  const previousWeekCount = timestamps.filter(
    (t) => t >= twoWeeksAgo && t < oneWeekAgo,
  ).length

  let trend: TrendInfo | null = null

  if (previousWeekCount > 0) {
    const changePercentage = Math.round(
      ((lastWeekCount - previousWeekCount) / previousWeekCount) * 100,
    )

    if (Math.abs(changePercentage) >= 10) {
      trend = {
        type: changePercentage > 0 ? 'increasing' : 'decreasing',
        percentage: Math.abs(changePercentage),
        period: 'week-over-week',
        description:
          changePercentage > 0
            ? `${Math.abs(changePercentage)}% more responses this week`
            : `${Math.abs(changePercentage)}% fewer responses this week`,
      }
    }
  } else if (lastWeekCount > 0) {
    trend = {
      type: 'increasing',
      percentage: 100,
      period: 'week-over-week',
      description: 'First responses received this week',
    }
  }

  // Analyze peak submission times
  const dayOfWeekCounts: Record<number, number> = {}
  const hourCounts: Record<number, number> = {}

  timestamps.forEach((t) => {
    const day = t.getDay()
    const hour = t.getHours()
    dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  // Find peak day
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let peakDay = 0
  let peakDayCount = 0
  Object.entries(dayOfWeekCounts).forEach(([day, count]) => {
    if (count > peakDayCount) {
      peakDay = parseInt(day)
      peakDayCount = count
    }
  })

  // Find peak hour range
  let peakHour = 0
  let peakHourCount = 0
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > peakHourCount) {
      peakHour = parseInt(hour)
      peakHourCount = count
    }
  })

  const peakPercentage = Math.round((peakDayCount / timestamps.length) * 100)

  // Only show peak if it's significant (>20% of submissions on one day)
  const peak: PeakInfo | null =
    peakPercentage >= 20
      ? {
          dayOfWeek: dayNames[peakDay],
          hourRange: `${peakHour}:00-${(peakHour + 1) % 24}:00`,
          percentage: peakPercentage,
        }
      : null

  return { trend, peak }
}

/**
 * TrendAlerts - Shows trend insights based on submission patterns
 */
export const TrendAlerts = ({
  decryptedResponses,
  minResponsesForTrend = 10,
}: TrendAlertsProps) => {
  const { trend, peak } = useMemo(
    () => analyzeTrends(decryptedResponses, minResponsesForTrend),
    [decryptedResponses, minResponsesForTrend],
  )

  if (!trend && !peak) {
    return null
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="neutral.200"
      p={4}
    >
      <Text fontSize="xs" fontWeight="medium" color="secondary.500" mb={3}>
        Submission patterns
      </Text>
      <VStack align="stretch" spacing={3}>
        {/* Trend Alert */}
        {trend && (
          <HStack spacing={3} align="flex-start">
            <Flex
              w={8}
              h={8}
              borderRadius="md"
              bg={trend.type === 'increasing' ? 'green.50' : 'red.50'}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon
                as={trend.type === 'increasing' ? BiTrendingUp : BiTrendingDown}
                color={trend.type === 'increasing' ? 'green.500' : 'red.500'}
                boxSize={5}
              />
            </Flex>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="secondary.700">
                {trend.type === 'increasing' ? 'Trending up' : 'Trending down'}
              </Text>
              <Text fontSize="xs" color="secondary.500">
                {trend.description}
              </Text>
            </Box>
          </HStack>
        )}

        {/* Peak Time Alert */}
        {peak && (
          <HStack spacing={3} align="flex-start">
            <Flex
              w={8}
              h={8}
              borderRadius="md"
              bg="primary.50"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={FiClock} color="primary.500" boxSize={5} />
            </Flex>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="secondary.700">
                Peak on {peak.dayOfWeek}s
              </Text>
              <Text fontSize="xs" color="secondary.500">
                {peak.percentage}% of responses submitted on {peak.dayOfWeek}s
              </Text>
            </Box>
          </HStack>
        )}
      </VStack>
    </Box>
  )
}
