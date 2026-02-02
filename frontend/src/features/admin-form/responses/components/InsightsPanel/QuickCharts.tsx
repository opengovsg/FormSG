import { useMemo } from 'react'
import Chart from 'react-google-charts'
import { Box, SimpleGrid, Skeleton, Text } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types'

// CSS fix for Google Charts tooltip flicker on hover
const toolTipFlickerFix = {
  'svg > g > g:last-child': { pointerEvents: 'none' },
}

import { DecryptedResponse } from '../../ResponsesPage/storage/useDecryptedResponsesQuery'

// Brand colors for charts
const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // green-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
]

// Chartable field types and their preferred chart types
const CHARTABLE_FIELD_CONFIG: Record<
  string,
  { chartType: 'pie' | 'bar' | 'column'; priority: number }
> = {
  [BasicField.Radio]: { chartType: 'pie', priority: 1 },
  [BasicField.Dropdown]: { chartType: 'pie', priority: 2 },
  [BasicField.Checkbox]: { chartType: 'bar', priority: 3 },
  [BasicField.YesNo]: { chartType: 'pie', priority: 4 },
  [BasicField.Rating]: { chartType: 'column', priority: 5 },
  [BasicField.CountryRegion]: { chartType: 'pie', priority: 6 },
}

interface QuickChartsProps {
  formFields: FormFieldDto[]
  decryptedResponses: DecryptedResponse[]
  maxCharts?: number
  isLoading?: boolean
}

interface ChartData {
  fieldId: string
  title: string
  chartType: 'pie' | 'bar' | 'column'
  data: { label: string; value: number }[]
}

/**
 * Aggregates responses for a single-answer field (Radio, Dropdown, YesNo, Rating, CountryRegion)
 */
const aggregateSingleAnswerField = (
  fieldId: string,
  responses: DecryptedResponse[],
): { label: string; value: number }[] => {
  const counts = new Map<string, number>()

  responses.forEach((response) => {
    const field = response.decryptedResponses.find((f) => f._id === fieldId)
    if (field?.answer) {
      const answer = field.answer.trim()
      if (answer) {
        counts.set(answer, (counts.get(answer) || 0) + 1)
      }
    }
  })

  // Sort by count descending
  return Array.from(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Aggregates responses for a multi-answer field (Checkbox)
 * Each selected option is counted separately
 */
const aggregateMultiAnswerField = (
  fieldId: string,
  responses: DecryptedResponse[],
): { label: string; value: number }[] => {
  const counts = new Map<string, number>()

  responses.forEach((response) => {
    const field = response.decryptedResponses.find((f) => f._id === fieldId)
    if (field?.answer) {
      // Checkbox answers are typically comma-separated or array
      const answers = Array.isArray(field.answer)
        ? field.answer
        : field.answer.split(',').map((a) => a.trim())

      answers.forEach((answer) => {
        if (answer) {
          counts.set(answer, (counts.get(answer) || 0) + 1)
        }
      })
    }
  })

  // Sort by count descending
  return Array.from(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Identifies chartable fields from form fields and returns top N by priority
 */
const getChartableFields = (
  formFields: FormFieldDto[],
  maxCharts: number,
): Array<{ field: FormFieldDto; config: (typeof CHARTABLE_FIELD_CONFIG)[string] }> => {
  const chartableFields = formFields
    .map((field) => {
      const config = CHARTABLE_FIELD_CONFIG[field.fieldType]
      if (config) {
        return { field, config }
      }
      return null
    })
    .filter(
      (item): item is { field: FormFieldDto; config: (typeof CHARTABLE_FIELD_CONFIG)[string] } =>
        item !== null,
    )

  // Sort by priority and take top N
  return chartableFields
    .sort((a, b) => a.config.priority - b.config.priority)
    .slice(0, maxCharts)
}

/**
 * Auto-generates charts for top chartable fields using client-side aggregation.
 */
export const QuickCharts = ({
  formFields,
  decryptedResponses,
  maxCharts = 2,
  isLoading = false,
}: QuickChartsProps) => {
  const chartData = useMemo<ChartData[]>(() => {
    if (!formFields.length || !decryptedResponses.length) {
      return []
    }

    const chartableFields = getChartableFields(formFields, maxCharts)

    return chartableFields
      .map(({ field, config }) => {
        // Use multi-answer aggregation for checkbox, single for others
        const data =
          field.fieldType === BasicField.Checkbox
            ? aggregateMultiAnswerField(field._id, decryptedResponses)
            : aggregateSingleAnswerField(field._id, decryptedResponses)

        // Skip fields with no data or only one unique value
        if (data.length < 2) {
          return null
        }

        return {
          fieldId: field._id,
          title: field.title,
          chartType: config.chartType,
          data,
        }
      })
      .filter((chart): chart is ChartData => chart !== null)
  }, [formFields, decryptedResponses, maxCharts])

  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {[1, 2].map((i) => (
            <Box
              key={i}
              bg="white"
              borderRadius="lg"
              border="1px solid"
              borderColor="neutral.200"
              borderLeft="3px solid"
              borderLeftColor="green.400"
              p={3}
            >
              <Skeleton height="1rem" width="60%" mb={3} />
              <Skeleton height="220px" borderRadius="md" />
            </Box>
          ))}
      </SimpleGrid>
    )
  }

  if (chartData.length === 0) {
    return null
  }

  // Convert chart data to Google Charts format
  const prepareChartData = (data: { label: string; value: number }[]) => {
    const rows: [string, number][] = data.map((item) => [item.label, item.value])
    return [['Label', 'Value'], ...rows]
  }

  // Get chart options based on type
  const getChartOptions = (chartType: 'pie' | 'bar' | 'column') => {
    const baseOptions: Record<string, unknown> = {
      colors: CHART_COLORS,
      backgroundColor: 'transparent',
      fontName: 'Inter, sans-serif',
    }

    if (chartType === 'pie') {
      return {
        ...baseOptions,
        pieHole: 0.4, // Donut chart for better readability
        legend: {
          position: 'right',
          alignment: 'center',
          textStyle: { fontSize: 11, color: '#4A5568' },
        },
        chartArea: { width: '90%', height: '85%' },
        pieSliceText: 'percentage',
        pieSliceTextStyle: { fontSize: 11 },
      }
    }

    if (chartType === 'bar') {
      return {
        ...baseOptions,
        legend: { position: 'none' },
        chartArea: { width: '65%', height: '80%' },
        hAxis: { textStyle: { fontSize: 11, color: '#4A5568' } },
        vAxis: { textStyle: { fontSize: 11, color: '#4A5568' } },
      }
    }

    // column chart
    return {
      ...baseOptions,
      legend: { position: 'none' },
      chartArea: { width: '80%', height: '75%' },
      hAxis: { textStyle: { fontSize: 11, color: '#4A5568' } },
      vAxis: { textStyle: { fontSize: 11, color: '#4A5568' } },
    }
  }

  const getGoogleChartType = (chartType: 'pie' | 'bar' | 'column') => {
    switch (chartType) {
      case 'pie':
        return 'PieChart'
      case 'bar':
        return 'BarChart'
      case 'column':
        return 'ColumnChart'
    }
  }

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
      {chartData.map((chart) => (
        <Box
          key={chart.fieldId}
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="neutral.200"
          borderLeft="3px solid"
          borderLeftColor="green.400"
          p={3}
          sx={toolTipFlickerFix}
          transition="all 0.2s"
          _hover={{ boxShadow: 'sm', borderColor: 'neutral.300' }}
        >
          <Text fontSize="sm" fontWeight="medium" color="secondary.700" mb={2}>
            {chart.title}
          </Text>
          <Chart
            chartType={getGoogleChartType(chart.chartType)}
            data={prepareChartData(chart.data)}
            options={getChartOptions(chart.chartType)}
            width="100%"
            height="220px"
          />
        </Box>
      ))}
    </SimpleGrid>
  )
}
