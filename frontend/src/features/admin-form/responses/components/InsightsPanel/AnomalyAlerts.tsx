import { useMemo } from 'react'
import { Box, Flex, HStack, Icon, Text, VStack } from '@chakra-ui/react'
import { BiCopy, BiErrorCircle } from 'react-icons/bi'
import { FiAlertTriangle } from 'react-icons/fi'

import { DecryptedResponse } from '../../ResponsesPage/storage/useDecryptedResponsesQuery'

interface AnomalyAlertsProps {
  decryptedResponses: DecryptedResponse[]
  minResponsesForAnalysis?: number
  onResponseClick?: (refNo: string) => void
}

interface Anomaly {
  type: 'duplicate' | 'outlier' | 'rapid_submission'
  severity: 'warning' | 'info'
  title: string
  description: string
  affectedResponseIds?: string[]
}

/**
 * Detects potential anomalies in form responses
 */
const detectAnomalies = (
  responses: DecryptedResponse[],
  minResponses: number,
): Anomaly[] => {
  const anomalies: Anomaly[] = []

  if (responses.length < minResponses) {
    return anomalies
  }

  // 1. Detect duplicate responses (same answers within short time)
  const responseHashes = new Map<string, { count: number; refNos: string[] }>()

  responses.forEach((response) => {
    // Create a hash of the response content (answers only)
    const answerHash = response.decryptedResponses
      .filter((f) => f.answer)
      .map((f) => `${f._id}:${f.answer}`)
      .sort()
      .join('|')

    if (answerHash) {
      const existing = responseHashes.get(answerHash)
      if (existing) {
        existing.count++
        existing.refNos.push(response.refNo)
      } else {
        responseHashes.set(answerHash, { count: 1, refNos: [response.refNo] })
      }
    }
  })

  // Flag duplicates (3+ identical responses)
  responseHashes.forEach((data) => {
    if (data.count >= 3) {
      anomalies.push({
        type: 'duplicate',
        severity: 'warning',
        title: `${data.count} identical responses`,
        description: 'Multiple submissions with exactly the same answers',
        affectedResponseIds: data.refNos,
      })
    }
  })

  // 2. Detect rapid submissions (multiple from same session in < 1 minute)
  const timestamps = responses
    .map((r) => ({
      time: new Date(r.submissionTime).getTime(),
      refNo: r.refNo,
    }))
    .filter((t) => !isNaN(t.time))
    .sort((a, b) => a.time - b.time)

  let rapidCount = 0
  const rapidRefNos: string[] = []

  for (let i = 1; i < timestamps.length; i++) {
    const timeDiff = timestamps[i].time - timestamps[i - 1].time
    // Less than 30 seconds between submissions
    if (timeDiff < 30000) {
      rapidCount++
      if (!rapidRefNos.includes(timestamps[i - 1].refNo)) {
        rapidRefNos.push(timestamps[i - 1].refNo)
      }
      rapidRefNos.push(timestamps[i].refNo)
    }
  }

  if (rapidCount >= 3) {
    anomalies.push({
      type: 'rapid_submission',
      severity: 'info',
      title: `${rapidCount + 1} rapid submissions`,
      description: 'Several responses submitted within 30 seconds of each other',
      affectedResponseIds: rapidRefNos.slice(0, 5), // Limit to 5
    })
  }

  // 3. Detect outlier text lengths (very short or very long responses)
  const textFields = responses.flatMap((r) =>
    r.decryptedResponses
      .filter((f) => f.answer && typeof f.answer === 'string' && f.answer.length > 0)
      .map((f) => ({
        refNo: r.refNo,
        fieldId: f._id,
        length: f.answer?.length || 0,
      })),
  )

  if (textFields.length >= 10) {
    // Group by fieldId
    const fieldGroups = new Map<string, typeof textFields>()
    textFields.forEach((tf) => {
      const existing = fieldGroups.get(tf.fieldId)
      if (existing) {
        existing.push(tf)
      } else {
        fieldGroups.set(tf.fieldId, [tf])
      }
    })

    // For each field, detect outliers using IQR method
    const outlierRefNos = new Set<string>()

    fieldGroups.forEach((fields) => {
      if (fields.length < 5) return

      const lengths = fields.map((f) => f.length).sort((a, b) => a - b)
      const q1 = lengths[Math.floor(lengths.length * 0.25)]
      const q3 = lengths[Math.floor(lengths.length * 0.75)]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr

      fields.forEach((f) => {
        if (f.length < lowerBound || f.length > upperBound) {
          outlierRefNos.add(f.refNo)
        }
      })
    })

    if (outlierRefNos.size >= 2) {
      anomalies.push({
        type: 'outlier',
        severity: 'info',
        title: `${outlierRefNos.size} unusual response lengths`,
        description: 'Responses with text significantly shorter or longer than typical',
        affectedResponseIds: Array.from(outlierRefNos).slice(0, 5),
      })
    }
  }

  return anomalies
}

/**
 * AnomalyAlerts - Shows potential issues or unusual patterns in responses
 */
export const AnomalyAlerts = ({
  decryptedResponses,
  minResponsesForAnalysis = 5,
  onResponseClick,
}: AnomalyAlertsProps) => {
  const anomalies = useMemo(
    () => detectAnomalies(decryptedResponses, minResponsesForAnalysis),
    [decryptedResponses, minResponsesForAnalysis],
  )

  if (anomalies.length === 0) {
    return null
  }

  const getAnomalyIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'duplicate':
        return BiCopy
      case 'rapid_submission':
        return FiAlertTriangle
      case 'outlier':
        return BiErrorCircle
      default:
        return BiErrorCircle
    }
  }

  const getAnomalyColor = (severity: Anomaly['severity']) => {
    return severity === 'warning' ? 'orange' : 'blue'
  }

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="neutral.200"
      borderLeft="3px solid"
      borderLeftColor="orange.400"
      p={3}
      transition="all 0.2s"
      _hover={{ boxShadow: 'sm', borderColor: 'neutral.300' }}
    >
      <Text fontSize="xs" fontWeight="medium" color="secondary.500" mb={2}>
        Potential issues
      </Text>
      <VStack align="stretch" spacing={2}>
        {anomalies.map((anomaly, index) => {
          const color = getAnomalyColor(anomaly.severity)
          return (
            <HStack key={index} spacing={2} align="flex-start">
              <Flex
                w={6}
                h={6}
                borderRadius="md"
                bg={`${color}.50`}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon
                  as={getAnomalyIcon(anomaly.type)}
                  color={`${color}.500`}
                  boxSize={4}
                />
              </Flex>
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" color="secondary.700">
                  {anomaly.title}
                </Text>
                <Text fontSize="xs" color="secondary.500">
                  {anomaly.description}
                </Text>
                {anomaly.affectedResponseIds &&
                  anomaly.affectedResponseIds.length > 0 &&
                  onResponseClick && (
                    <HStack spacing={1} mt={1} flexWrap="wrap">
                      <Text fontSize="xs" color="secondary.400">
                        Responses:
                      </Text>
                      {anomaly.affectedResponseIds.slice(0, 3).map((refNo) => (
                        <Text
                          key={refNo}
                          fontSize="xs"
                          color="primary.500"
                          cursor="pointer"
                          _hover={{ textDecoration: 'underline' }}
                          onClick={() => onResponseClick(refNo)}
                        >
                          #{refNo}
                        </Text>
                      ))}
                      {anomaly.affectedResponseIds.length > 3 && (
                        <Text fontSize="xs" color="secondary.400">
                          +{anomaly.affectedResponseIds.length - 3} more
                        </Text>
                      )}
                    </HStack>
                  )}
              </Box>
            </HStack>
          )
        })}
      </VStack>
    </Box>
  )
}
