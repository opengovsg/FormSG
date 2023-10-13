import { useMemo, useState } from 'react'
import Chart, { GoogleChartWrapperChartType } from 'react-google-charts'
import { BiBarChartAlt2, BiTable } from 'react-icons/bi'
import { Flex, Text, VStack } from '@chakra-ui/react'

import { BasicField, FormFieldDto } from '~shared/types'

import IconButton from '~components/IconButton'

import { TableChart } from './TableChart'

export const FIELD_TO_CHART = new Map<BasicField, GoogleChartWrapperChartType>([
  [BasicField.Rating, 'ColumnChart'],
  [BasicField.Radio, 'PieChart'],
  [BasicField.Checkbox, 'BarChart'],
  [BasicField.Dropdown, 'PieChart'],
  [BasicField.CountryRegion, 'PieChart'],
  [BasicField.YesNo, 'PieChart'],
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

  console.log(data)

  const dataToRender = useMemo(() => {
    // deep copy of the data
    const renderArray = data.map((val) => [...val])
    renderArray.unshift(['Answer', 'Count'])
    // append random color as styling to the data
    if (
      !isTable &&
      // Bar and column charts require specific color styles to be passed into data array
      (formField.fieldType === BasicField.Checkbox || BasicField.Rating)
    )
      renderArray.forEach((val) => {
        if (val[1] === 'Count') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          val.push({ role: 'style' })
        } else {
          val.push(
            '#' +
              (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6),
          )
        }
      })
    return renderArray
  }, [data, formField.fieldType, isTable])

  console.log(dataToRender)

  const chartType: GoogleChartWrapperChartType = useMemo(() => {
    if (isTable) return 'Table'
    return FIELD_TO_CHART.get(formField.fieldType) || 'PieChart'
  }, [isTable, formField])

  const options = {
    // only display legend if piechart
    legend: { position: chartType === 'PieChart' ? undefined : 'none' },
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
