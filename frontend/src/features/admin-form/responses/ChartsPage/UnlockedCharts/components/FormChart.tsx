import { useMemo, useState } from 'react'
import Chart, { GoogleChartWrapperChartType } from 'react-google-charts'
import { BiBarChartAlt2, BiTable } from 'react-icons/bi'
import { Flex, Text, VStack } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types'

import IconButton from '~components/IconButton'

import { COLOR_ARRAY } from '../constants'

import { toolTipFlickerFix } from './piechartCss'
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
  rawTitle,
  formField,
  data,
}: {
  title: string
  rawTitle: string
  formField: FormFieldDto
  data: [string, number][]
}) => {
  const [isTable, setIsTable] = useState(false)

  const dataToRender = useMemo(() => {
    // deep copy of the data
    const renderArray = data.map((val) => [...val] as [string, number | string])
    // Adding data headers
    // react-google-charts requires the first row to be a header of [string, string]
    renderArray.unshift([rawTitle, 'Count'])
    if (
      !isTable &&
      // Checkbox bar chart should have different colors
      // But rating does not
      formField.fieldType === BasicField.Checkbox
    )
      renderArray.forEach(
        (val: [string, number | string | { role: string }], index) => {
          if (val[1] === 'Count') {
            val.push({ role: 'style' })
          } else {
            val.push(COLOR_ARRAY[index % COLOR_ARRAY.length])
          }
        },
      )
    return renderArray
  }, [data, formField.fieldType, isTable, rawTitle])

  const chartType: GoogleChartWrapperChartType = useMemo(() => {
    if (isTable) return ChartTypes.TABLE
    return FIELD_TO_CHART.get(formField.fieldType) || ChartTypes.PIE_CHART
  }, [isTable, formField])

  const options = {
    // only display legend if pie chart
    legend: {
      position: chartType === ChartTypes.PIE_CHART ? undefined : 'none',
    },
    chartArea: { width: '50%' },
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

const RatingsAverageText = ({ data }: { data: [string, number][] }) => {
  let mean = 0
  let count = 0
  data.forEach(([rating, ratingCount]) => {
    const numericRating = Number(rating)
    if (!isNaN(numericRating)) {
      mean += numericRating * ratingCount
      count += ratingCount
    }
  })

  if (count === 0) {
    return <Text textStyle="h4">Average: N/A</Text> // Handle division by zero and no valid ratings
  }
  mean = mean / count
  const roundedMean = Math.round(mean * 100) / 100 // Rounds to two decimal places
  return <Text textStyle="h4">Average: {roundedMean}</Text>
}
