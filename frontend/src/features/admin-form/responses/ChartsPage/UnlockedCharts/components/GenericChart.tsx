import { useMemo, useState } from 'react'
import Chart, { GoogleChartWrapperChartType } from 'react-google-charts'
import { BiBarChartAlt2, BiTable } from 'react-icons/bi'
import { Flex, Text, VStack } from '@chakra-ui/react'

import IconButton from '~components/IconButton'

import { COLOR_ARRAY } from '../constants'

import { toolTipFlickerFix } from './piechartCss'
import { TableChart } from './TableChart'

type ChartTypeMapping = {
  [key: string]: GoogleChartWrapperChartType
}

const ChartTypes: ChartTypeMapping = {
  COLUMN_CHART: 'ColumnChart',
  PIE_CHART: 'PieChart',
  BAR_CHART: 'BarChart',
  LINE_CHART: 'LineChart',
  TABLE: 'Table',
}

const CHART_TYPE_MAP: Record<
  'pie' | 'bar' | 'column' | 'line',
  GoogleChartWrapperChartType
> = {
  pie: ChartTypes.PIE_CHART,
  bar: ChartTypes.BAR_CHART,
  column: ChartTypes.COLUMN_CHART,
  line: ChartTypes.LINE_CHART,
}

export interface GenericChartProps {
  title: string
  chartType: 'pie' | 'bar' | 'column' | 'line'
  data: { label: string; value: number }[] | [string, number][] // Array of objects or tuples
}

export const GenericChart = ({ title, chartType, data }: GenericChartProps) => {
  const [isTable, setIsTable] = useState(false)

  const dataToRender = useMemo(() => {
    // Convert data to tuple format if it's in object format
    const tupleData: [string, number][] =
      data.length > 0 && typeof data[0] === 'object' && 'label' in data[0]
        ? (data as { label: string; value: number }[]).map((item) => [
            item.label,
            item.value,
          ])
        : (data as [string, number][])

    // Deep copy of the data
    const renderArray = tupleData.map(
      (val) => [...val] as [string, number | string],
    )
    // Adding data headers
    // react-google-charts requires the first row to be a header of [string, string]
    renderArray.unshift(['Label', 'Value'])

    // Add colors for bar charts
    if (!isTable && chartType === 'bar') {
      renderArray.forEach(
        (val: [string, number | string | { role: string }], index) => {
          if (val[1] === 'Value') {
            val.push({ role: 'style' })
          } else {
            val.push(COLOR_ARRAY[index % COLOR_ARRAY.length])
          }
        },
      )
    }
    return renderArray
  }, [data, chartType, isTable])

  const googleChartType: GoogleChartWrapperChartType = useMemo(() => {
    if (isTable) return ChartTypes.TABLE
    return CHART_TYPE_MAP[chartType]
  }, [isTable, chartType])

  const options = useMemo(() => {
    const baseOptions: Record<string, unknown> = {
      chartArea: { width: '50%' },
    }

    // Legend settings
    if (chartType === 'pie') {
      baseOptions.legend = { position: undefined }
    } else if (chartType === 'line') {
      baseOptions.legend = { position: 'top' }
    } else {
      baseOptions.legend = { position: 'none' }
    }

    // Line chart specific options
    if (chartType === 'line') {
      baseOptions.pointSize = 5
      baseOptions.lineWidth = 2
      baseOptions.interpolateNulls = false
    }

    return baseOptions
  }, [chartType])

  if (data.length === 0) {
    return null
  }

  return (
    <VStack w="100%" gap="0" sx={toolTipFlickerFix}>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        w="100%"
        mb="0.25rem"
      >
        <Text textStyle="h4" mr="1rem">
          {title}
        </Text>
        <Flex gap="0.5rem">
          <IconButton
            aria-label="chart"
            onClick={() => setIsTable(false)}
            icon={<BiBarChartAlt2 />}
            variant="clear"
            isActive={!isTable}
          />

          <IconButton
            aria-label="table"
            onClick={() => setIsTable(true)}
            icon={<BiTable />}
            variant="clear"
            isActive={isTable}
          />
        </Flex>
      </Flex>
      {isTable ? (
        <TableChart data={dataToRender} />
      ) : (
        <Chart
          data={dataToRender}
          chartType={googleChartType}
          options={options}
          width="100%"
          height="400px"
        />
      )}
    </VStack>
  )
}
