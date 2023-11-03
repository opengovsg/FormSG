import React, { useMemo, useState } from 'react'
import Chart, { GoogleChartWrapperChartType } from 'react-google-charts'
import { BiBarChartAlt2, BiTable } from 'react-icons/bi'
import { Flex, Text, VStack } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types'

import IconButton from '~components/IconButton'

import { TableChart } from './TableChart'

type ChartTypeMapping = {
  [key: string]: GoogleChartWrapperChartType
}
export const ChartTypes: ChartTypeMapping = {
  COLUMN_CHART: 'ColumnChart',
  PIE_CHART: 'PieChart',
  BAR_CHART: 'BarChart',
  TABLE: 'Table',
}
export const FIELD_TO_CHART = new Map<BasicField, GoogleChartWrapperChartType>([
  [BasicField.Rating, ChartTypes.COLUMN_CHART],
  [BasicField.Radio, ChartTypes.PIE_CHART],
  [BasicField.Checkbox, ChartTypes.BAR_CHART],
  [BasicField.Dropdown, ChartTypes.PIE_CHART],
  [BasicField.CountryRegion, ChartTypes.PIE_CHART],
  [BasicField.YesNo, ChartTypes.PIE_CHART],
])

export const FormChart = ({
  title,
  formField,
  data,
}: {
  title: string
  formField: FormFieldDto
  data: [string, number | string][]
}) => {
  const [isTable, setIsTable] = useState(false)

  const dataToRender = useMemo(() => {
    // deep copy of the data
    const renderArray = data.map((val) => [...val] as [string, number | string])
    // Adding data headers
    renderArray.unshift(['Answer', 'Count'])
    if (
      !isTable &&
      // Checkbox bar chart should have different colors
      // But rating does not
      formField.fieldType === BasicField.Checkbox
    )
      renderArray.forEach((val, index) => {
        if (val[1] === 'Count') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          val.push({ role: 'style' })
        } else {
          val.push(colorArray[index % colorArray.length])
        }
      })
    return renderArray
  }, [data, formField.fieldType, isTable])

  const chartType: GoogleChartWrapperChartType = useMemo(() => {
    if (isTable) return ChartTypes.TABLE
    return FIELD_TO_CHART.get(formField.fieldType) || ChartTypes.PIE_CHART
  }, [isTable, formField])

  const options = {
    // only display legend if piechart
    legend: {
      position: chartType === ChartTypes.PIE_CHART ? undefined : 'none',
    },
    chartArea: { width: '50%' },
  }

  return (
    <VStack w="100%" gap="0">
      <Flex alignItems="center" justifyContent="space-between" w="100%">
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
          chartType={chartType}
          options={options}
          width="100%"
          height="400px"
        />
      )}
      {formField.fieldType === BasicField.Rating && (
        <RatingsAverageText data={data} />
      )}
    </VStack>
  )
}

const RatingsAverageText = ({
  data,
}: {
  data: [string, number | string][]
}) => {
  let mean = 0
  let count = 0
  data.forEach((data) => {
    mean += Number(data[0]) * Number(data[1])
    count += Number(data[1])
  })
  mean = mean / count

  return (
    <Text textStyle="h4">
      Average: {Math.round((mean + Number.EPSILON) * 100) / 100}
    </Text>
  )
}

// colour palette for charts
const colorArray: string[] = [
  '#FF5733', // Red
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33A1', // Pink
  '#FF8C33', // Orange
  '#A833FF', // Purple
  '#33FFF6', // Cyan
  '#D4FF33', // Lime
  '#FF335E', // Rose
  '#33FF90', // Mint
  '#7A33FF', // Lavender
  '#FF3362', // Watermelon
  '#FFB833', // Tangerine
  '#33FFAB', // Aquamarine
  '#5133FF', // Indigo
  '#FF334F', // Tomato
  '#33E4FF', // Sky blue
  '#FF33D1', // Magenta
  '#78FF33', // Spring green
  '#FF3355', // Crimson
  '#FF6633', // Vermilion
  '#33FFC1', // Turquoise
  '#9933FF', // Grape
  '#FF3388', // Raspberry
  '#33FF48', // Shamrock
  '#FF3344', // Scarlet
  '#33FFDE', // Azure
  '#AC33FF', // Orchid
  '#FF33BB', // Cerise
  '#33FF6C', // Emerald
]
